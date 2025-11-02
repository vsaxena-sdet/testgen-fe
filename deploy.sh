#!/bin/bash

# TestGen Frontend Deployment Script
# This script builds and deploys the frontend application

set -e  # Exit on error

echo "🚀 Starting TestGen Frontend Deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your API configuration before deployment"
fi

# Clean previous build
if [ -d "dist" ]; then
    echo "🧹 Cleaning previous build..."
    rm -rf dist
fi

# Build the application
echo "🔨 Building production bundle..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Start the production server
echo "🌐 Starting production server..."
echo "📍 Frontend will be available at: http://localhost:3000"
echo "📍 Backend API configured at: $(grep VITE_API_HOST .env | cut -d '=' -f2)"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run serve:prod
