# 🚀 Start the Backend Server

## Quick Start

Open a **new terminal** (Shell tab) and run:

```bash
./start-backend.sh
```

That's it! The backend will:
1. Install dependencies (first time only - takes ~30 seconds)
2. Start on port 3001
3. Connect to Gemini/ChatGPT APIs

## What You'll See

When it's working, you'll see:
```
[INFO] Server running on port 3001
[INFO] Environment: development
[INFO] Allowed origins: ...
```

## Test the Chat

Once the backend is running:

1. Go to your app (refresh if needed)
2. Open the **Chat** tab
3. Ask: **"How can I save money on groceries?"**
4. You should get an **intelligent AI response** instead of generic replies! 🎉

## Troubleshooting

**If the backend won't start:**
- Make sure port 3001 isn't already in use
- Check that your API keys are set in Replit Secrets

**If chat still gives generic responses:**
- Wait 5 seconds after backend starts
- Refresh your app
- Check the backend terminal for any errors

## Stop the Backend

Press `Ctrl+C` in the terminal where the backend is running.

---

**Pro Tip:** Keep the backend terminal open while developing. The app won't work without it!
