#!/bin/bash

echo "📦 Building Firefox extension..."
echo "📋 Creating Firefox package..."

# Clean up any previous build
rm -f ../kaminari-firefox.zip

# Create zip file excluding development files
zip -r ../kaminari-firefox.zip . -x "*.DS_Store" -x ".git/*" -x "build_firefox.sh" -x "*.log" -x "node_modules/*"

echo "✅ Firefox extension built successfully at ../kaminari-firefox.zip"
echo "ℹ️ You can now install it in Firefox via about:debugging or submit to AMO"