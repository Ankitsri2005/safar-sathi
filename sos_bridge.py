import serial
import serial.tools.list_ports
import requests
import json
import time
import sys
import threading
from datetime import datetime, timedelta

# --- Configuration ---
API_BASE_URL = "http://localhost:5000/api"
ADMIN_USER = "admin"
ADMIN_PASS = "admin123"

# Live Demo Location: Kolkata Coordinates 
DEFAULT_LAT = 22.5603
DEFAULT_LNG = 88.4903

def get_live_location():
    """Attempts to fetch dynamic IP-based location in Kolkata/India, or uses precise fallback."""
    # 1. Try ip-api.com (reliable, free, high limit)
    try:
        res = requests.get("http://ip-api.com/json/", timeout=3)
        if res.status_code == 200:
            data = res.json()
            if data.get("status") == "success" and "lat" in data and "lon" in data:
                lat = float(data["lat"])
                lng = float(data["lon"])
                city = data.get("city", "Live Location")
                print(f"[LOCATION] Live GPS detected via network: {city} ({lat:.4f}, {lng:.4f})")
                return lat, lng
    except Exception as e:
        print(f"[LOCATION] ip-api check failed: {e}")

    # 2. Try ipapi.co as secondary
    try:
        res = requests.get("https://ipapi.co/json/", timeout=3)
        if res.status_code == 200:
            data = res.json()
            if not data.get("error") and "latitude" in data and "longitude" in data:
                lat = float(data["latitude"])
                lng = float(data["longitude"])
                return lat, lng
    except Exception:
        pass

    print(f"[LOCATION] Using default fallback coordinates: ({DEFAULT_LAT}, {DEFAULT_LNG})")
    return DEFAULT_LAT, DEFAULT_LNG


def auto_detect_esp32_port():
    """Detects available COM port with preference for COM8."""
    ports = list(serial.tools.list_ports.comports())
    print("\n--- Available COM Ports on Laptop ---")
    for p in ports:
        print(f"   * {p.device}: {p.description}")
    
    # Priority: check for COM8 (from Arduino IDE)
    for p in ports:
        if p.device.upper() == "COM8":
            return p.device

    for port in ports:
        desc = (port.description or "").upper()
        if "USB" in desc or "CP210" in desc or "CH340" in desc or "SERIAL" in desc or "UART" in desc:
            return port.device
    return ports[0].device if ports else None

def login_and_get_token():
    """Logs into existing Safar Sathi backend to authenticate alert creation."""
    try:
        res = requests.post(f"{API_BASE_URL}/auth/login", json={
            "username": ADMIN_USER,
            "password": ADMIN_PASS
        }, timeout=3)
        if res.status_code == 200:
            token = res.json().get("token")
            print("[SUCCESS] Connected & Authenticated with Safar Sathi Backend.")
            return token
        else:
            print(f"[ERROR] Login failed: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"[ERROR] Backend connection failed: {e}")
    return None

def get_or_create_active_tourist(token):
    """Fetches a valid tourist ID from database."""
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Query digital IDs registry
    try:
        res = requests.get(f"{API_BASE_URL}/digital-ids", headers=headers, timeout=3)
        if res.status_code == 200:
            payload = res.json()
            items = payload.get("data", payload) if isinstance(payload, dict) else payload
            if isinstance(items, list) and len(items) > 0:
                t = items[0]
                t_id = t.get("tourist_id", t.get("id"))
                t_name = t.get("tourist_name", t.get("full_name", "Verified Tourist"))
                return t_id, t_name
    except Exception as e:
        print(f"[WARN] Digital IDs check: {e}")

    # 2. Query tracking tourists
    try:
        res = requests.get(f"{API_BASE_URL}/tracking/tourists", headers=headers, timeout=3)
        if res.status_code == 200:
            tourists = res.json()
            if isinstance(tourists, list) and len(tourists) > 0:
                return tourists[0]["id"], tourists[0]["full_name"]
    except Exception:
        pass

    return "966078df-b73f-4352-841e-2af4776608c2", "Ankit Kumar (ID: WB-2026-9842)"

def trigger_sos_alert(token, tourist_id, tourist_name):
    """Sends the SOS Panic Alert to existing POST /api/alerts."""
    lat, lng = get_live_location()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "tourist_id": tourist_id,
        "alert_type": "panic",
        "location_lat": lat,
        "location_lng": lng,
        "message": f"EMERGENCY SOS: Physical Hardware Button Pressed by {tourist_name} at ({lat:.4f}, {lng:.4f})"
    }

    try:
        res = requests.post(f"{API_BASE_URL}/alerts", headers=headers, json=payload, timeout=3)
        if res.status_code in [200, 201]:
            print("\n" + "="*60)
            print(">>> [EMERGENCY ALERT DISPATCHED TO TOURISM DASHBOARD!]")
            print(f"    Tourist: {tourist_name}")
            print(f"    Location: Lat {lat:.4f}, Lng {lng:.4f}")
            print(f"    Time: {datetime.now().strftime('%H:%M:%S')}")
            print("    Socket.IO event broadcasted live to http://localhost:3000/dashboard")
            print("="*60 + "\n")
        else:
            print(f"[WARN] Alert response: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"[ERROR] Failed to post alert: {e}")

def main():
    print("==========================================================")
    print(" SAFAR SATHI - HARDWARE SOS TO TOURISM DASHBOARD BRIDGE")
    print("==========================================================")

    # 1. Authenticate with backend
    token = login_and_get_token()
    if not token:
        print("\n[ERROR] Backend not reachable on http://localhost:5000.")
        print("Please ensure your backend server is running.")
        sys.exit(1)

    # 2. Get active tourist ID
    tourist_id, tourist_name = get_or_create_active_tourist(token)
    print(f"[TARGET] Linked Tourist: {tourist_name} (ID: {tourist_id})")

    # 3. Detect and Connect to ESP32 Serial
    port = auto_detect_esp32_port()
    ser = None
    if not port:
        print("\n[INFO] No ESP32 COM port detected. Check USB connection.")
        print("[INFO] You can press [Enter] in this terminal to simulate an alert!")
    else:
        print(f"\n[SERIAL] Connecting to port: {port} at 115200 baud...")
        try:
            ser = serial.Serial(port, 115200, timeout=1)
            print(f"[SERIAL] Connected to {port} successfully!")
        except Exception as e:
            print(f"[ERROR] Could not open port {port}: {e}")
            print("Hint: Close Arduino Serial Monitor if it's currently open.")

    print("\n" + "-"*60)
    print("[READY] Bridge is LISTENING for SOS button presses!")
    print("Press your physical switch on GPIO 27, OR press [Enter] here.")
    print("-"*60 + "\n")

    last_trigger_time = 0
    COOLDOWN_SECS = 4

    # Background thread for manual Enter keypress
    def keyboard_listener():
        nonlocal last_trigger_time
        while True:
            try:
                input()
                now = time.time()
                if now - last_trigger_time >= COOLDOWN_SECS:
                    last_trigger_time = now
                    print(">>> [TRIGGER] Manual SOS alert dispatched via bridge...")
                    trigger_sos_alert(token, tourist_id, tourist_name)
                else:
                    print(f"[DEBOUNCE] Cooldown active ({COOLDOWN_SECS}s). Please wait.")
            except Exception:
                break

    t = threading.Thread(target=keyboard_listener, daemon=True)
    t.start()

    # Main Serial Loop
    TRIGGER_KEYWORDS = ["SOS", "ALERT", "PANIC", "BUTTON", "PRESSED", "TRIGGER", "EMERGENCY"]

    while True:
        try:
            if ser and ser.is_open:
                raw = ser.readline()
                if raw:
                    line = raw.decode("utf-8", errors="ignore").strip()
                    if line:
                        print(f"[ESP32 Signal] {line}")
                        upper = line.upper()
                        if any(kw in upper for kw in TRIGGER_KEYWORDS):
                            now = time.time()
                            if now - last_trigger_time >= COOLDOWN_SECS:
                                last_trigger_time = now
                                trigger_sos_alert(token, tourist_id, tourist_name)
                            else:
                                print(f"[DEBOUNCE] Ignored bounce within {COOLDOWN_SECS}s")
            else:
                time.sleep(0.5)
        except KeyboardInterrupt:
            print("\nBridge stopped.")
            break
        except Exception as e:
            print(f"Serial read error: {e}")
            time.sleep(1)

if __name__ == "__main__":
    main()
