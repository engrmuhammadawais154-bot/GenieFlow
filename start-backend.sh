#!/bin/bash

echo "🚀 Starting AI Assistant Backend Server..."
echo ""

# Navigate to server directory
cd server

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies (first time only)..."
  npm install --silent
  echo "✅ Dependencies installed!"
  echo ""
fi

# Start the server
echo "🔥 Starting backend on port 3001..."
echo ""
echo "Backend will use:"
echo "  - GEMINI_API_KEY: ${GEMINI_API_KEY:0:20}..."
echo "  - OPENAI_API_KEY: ${OPENAI_API_KEY:0:20}..."
echo ""

PORT=3001 \
NODE_ENV=development \
GEMINI_API_KEY="${GEMINI_API_KEY}" \
OPENAI_API_KEY="${OPENAI_API_KEY}" \
ALLOWED_ORIGINS="http://localhost:8081,https://*.replit.dev,exp://*" \
npm run dev
