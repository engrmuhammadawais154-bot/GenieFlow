# Quick Start Guide - Backend Server

## 🚀 Get Started in 3 Steps

### Step 1: Add Backend Workflow in Replit

1. Click the **"▶ Run"** button dropdown at the top
2. Select **"Configure workflows"** or go to the Workflows pane
3. Click **"Create workflow"**
4. Name it: `Start backend server`
5. Add a shell task with this command:
   ```
   cd server && npm install --silent && npm run dev
   ```
6. Set "Wait for port": `3001`
7. Save the workflow

### Step 2: Update Main Workflow

1. Edit the **"Project"** workflow
2. Change mode to "parallel"  
3. Add both workflows to run together:
   - `Start application`
   - `Start backend server`
4. Save

### Step 3: Configure API Keys

1. Your API keys are already in Replit Secrets
2. The backend will automatically use them from environment variables
3. No manual .env file needed - Replit handles this!

## ✅ That's It!

Now when you click **Run**, both your frontend and backend will start automatically!

---

## Manual Start (Alternative)

If you prefer to start manually:

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd server && npm install && npm run dev
```

## Testing

Once running, visit these URLs in your browser:

- **Frontend**: `http://localhost:8081` (or your Replit webview)
- **Backend Health**: Check port 3001 or look for backend logs
- **Test Chat**: Try asking "How can I save money?" in the app

The AI should now give intelligent responses instead of basic replies! 🎉
