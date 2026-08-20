/**
 * Firebase Cloud Messaging (FCM) push notification service.
 *
 * Uses Firebase Admin SDK HTTP v1 API.
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON,
 * or FIREBASE_SERVICE_ACCOUNT_KEY as a JSON string.
 *
 * For development: falls back to console logging when Firebase is not configured.
 */

import { v4 as uuidv4 } from "uuid";
import db from "../config/database";

const FIREBASE_API_URL = "https://fcm.googleapis.com/v1/projects";

interface FirebaseConfig {
  project_id: string;
  client_email: string;
  private_key: string;
}

let accessToken: string | null = null;
let tokenExpiry = 0;

/**
 * Get OAuth2 access token for Firebase Admin SDK.
 */
async function getAccessToken(config: FirebaseConfig): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const jwt = await createJWT(config);
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!resp.ok) throw new Error(`Firebase token error: ${resp.status}`);
  const data = await resp.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

/**
 * Create a JWT for Firebase Admin SDK.
 */
async function createJWT(config: FirebaseConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: config.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  ).toString("base64url");

  const crypto = await import("crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(config.private_key, "base64url");

  return `${header}.${payload}.${signature}`;
}

/**
 * Load Firebase config from environment.
 */
function getConfig(): FirebaseConfig | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) return null;
  return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
}

/**
 * Store a device token for a user.
 */
export async function registerDeviceToken(
  userId: string,
  token: string,
  platform: string = "web"
): Promise<void> {
  const existing = await db("user_devices")
    .where({ user_id: userId, device_token: token })
    .first();

  if (!existing) {
    await db("user_devices").insert({
      id: uuidv4(),
      user_id: userId,
      device_token: token,
      platform,
      is_active: true,
    });
  }
}

/**
 * Remove a device token.
 */
export async function removeDeviceToken(token: string): Promise<void> {
  await db("user_devices").where({ device_token: token }).update({ is_active: false });
}

/**
 * Send push notification via Firebase Cloud Messaging.
 * Falls back to console logging if Firebase is not configured.
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  const config = getConfig();

  if (!config) {
    console.log(`[PUSH-DEV] To: ${userId} | ${title}: ${body}`);
    return;
  }

  // Get user's device tokens
  const devices = await db("user_devices")
    .where({ user_id: userId, is_active: true })
    .select("device_token");

  if (!devices.length) {
    console.log(`[PUSH] No device tokens for user ${userId}`);
    return;
  }

  const accessToken = await getAccessToken(config);

  for (const device of devices) {
    try {
      const resp = await fetch(
        `${FIREBASE_API_URL}/${config.project_id}/messages:send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token: device.device_token,
              notification: { title, body },
              data: data ? Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)])
              ) : {},
              webpush: {
                fcm_options: { topic: "tourist-safety" },
                notification: { icon: "/icon-192x192.png", badge: "/badge-72x72.png" },
              },
            },
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.text();
        console.error(`[PUSH] Failed to ${device.device_token.slice(0, 10)}...: ${err}`);
      }
    } catch (err: any) {
      console.error(`[PUSH] Error: ${err.message}`);
    }
  }
}

/**
 * Send push notification to multiple users at once.
 */
export async function sendPushBroadcast(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  for (const userId of userIds) {
    await sendPushNotification(userId, title, body, data);
  }
}
