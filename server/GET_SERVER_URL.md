# How to Get Your Server URL

## Option 1: Local Server (Same WiFi Network)

If your server is running on your computer:

### Step 1: Find Your Computer's IP Address

**Windows:**
1. Open Command Prompt or PowerShell
2. Type: `ipconfig`
3. Look for "IPv4 Address" under your WiFi adapter
4. Example: `172.20.10.2` or `192.168.1.100`

**Mac/Linux:**
1. Open Terminal
2. Type: `ifconfig` or `ip addr`
3. Look for your WiFi adapter's IP address

### Step 2: Update ESP32 Config

In `firmware/esp32_attendance/include/config.h`:

```cpp
#define SERVER_URL "http://YOUR_IP_ADDRESS:4000/api/attendance"
```

Example:
```cpp
#define SERVER_URL "http://172.20.10.2:4000/api/attendance"
```

### Step 3: Make Sure Server is Running

```bash
cd server/attendance_server
npm run dev
```

Server should show: `Server running on port 4000`

---

## Option 2: Deploy to Cloud (Recommended for Production)

### Quick Deploy Options:

#### A. Railway (Fast & Easy)
1. Go to https://railway.app
2. Sign up/login
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Set root directory: `server/attendance_server`
6. Add environment variables from `.env`
7. Deploy!
8. Get URL: `https://your-app.railway.app`

#### B. Render (Free Tier Available)
1. Go to https://render.com
2. Sign up/login
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Set:
   - Root Directory: `server/attendance_server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
6. Add environment variables
7. Deploy!
8. Get URL: `https://your-app.onrender.com`

#### C. Fly.io (Fast & Reliable)
1. Install Fly CLI: https://fly.io/docs/getting-started/installing-flyctl/
2. Run: `fly launch` in `server/attendance_server`
3. Follow prompts
4. Deploy: `fly deploy`
5. Get URL: `https://your-app.fly.dev`

---

## Option 3: Use ngrok (Temporary Testing)

For quick testing without deployment:

1. Install ngrok: https://ngrok.com/download
2. Start your local server: `npm run dev`
3. In another terminal: `ngrok http 4000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Use in ESP32: `https://abc123.ngrok.io/api/attendance`

**Note:** ngrok URLs change each time you restart (unless you have a paid plan)

---

## Testing Your Server URL

Once you have a URL, test it:

```bash
# Test health endpoint
curl http://YOUR_SERVER_URL/health

# Should return JSON with server status
```

---

## Update ESP32 Config

After getting your server URL, update:

`firmware/esp32_attendance/include/config.h`:

```cpp
#define SERVER_URL "http://YOUR_SERVER_URL/api/attendance"
```

Or for HTTPS:
```cpp
#define SERVER_URL "https://YOUR_SERVER_URL/api/attendance"
```

---

## Important Notes

- **Local IP**: Only works if ESP32 and server are on same WiFi network
- **HTTPS**: Cloud deployments usually use HTTPS (make sure ESP32 supports it)
- **Port**: Default is 4000, but cloud platforms usually use port 80/443
- **CORS**: Server already has CORS enabled, so should work

---

## Quick Check

1. Is your server running? → Check terminal/logs
2. Can you access it? → Open browser: `http://YOUR_URL/health`
3. ESP32 can reach it? → Check Serial Monitor for HTTP errors

