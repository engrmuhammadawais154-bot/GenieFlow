#!/bin/bash

cd server

if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies..."
  npm install
fi

echo "Starting backend server..."
npm run dev
