echo "📦 Building Chrome extension..."
zip -r ../kaminari-chrome.zip . -x "*.DS_Store" -x ".git/*"
echo "✅ Chrome extension built successfully!"