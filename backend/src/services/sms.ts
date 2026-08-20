/**
 * SMS notification service using Twilio.
 *
 * Requires:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_FROM_NUMBER (e.g. +1234567890)
 *
 * For development: falls back to console logging when Twilio is not configured.
 */

interface TwilioConfig {
  account_sid: string;
  auth_token: string;
  from_number: string;
}

function getConfig(): TwilioConfig | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) return null;
  return { account_sid: sid, auth_token: token, from_number: from };
}

/**
 * Send an SMS message.
 * Falls back to console logging if Twilio is not configured.
 */
export async function sendSMS(to: string, body: string): Promise<void> {
  const config = getConfig();

  if (!config) {
    console.log(`[SMS-DEV] To: ${to} | ${body}`);
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.account_sid}/Messages.json`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.account_sid}:${config.auth_token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: config.from_number,
      To: to,
      Body: body,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Twilio SMS error ${resp.status}: ${err}`);
  }
}

/**
 * Send SMS to multiple recipients.
 */
export async function sendSMSBatch(
  recipients: string[],
  body: string
): Promise<{ success: string[]; failed: { phone: string; error: string }[] }> {
  const success: string[] = [];
  const failed: { phone: string; error: string }[] = [];

  for (const phone of recipients) {
    try {
      await sendSMS(phone, body);
      success.push(phone);
    } catch (err: any) {
      failed.push({ phone, error: err.message });
    }
  }

  return { success, failed };
}

/**
 * Send a critical alert SMS with a short code format.
 */
export async function sendCriticalAlertSMS(
  phone: string,
  alertType: string,
  touristName: string,
  location?: string
): Promise<void> {
  const msg = [
    `URGENT: ${alertType}`,
    `Tourist: ${touristName}`,
    location ? `Location: ${location}` : "",
    "Login to dashboard for details.",
  ]
    .filter(Boolean)
    .join(" | ");

  await sendSMS(phone, msg);
}
