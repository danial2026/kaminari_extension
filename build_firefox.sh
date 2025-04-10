echo "📦 Building Firefox extension..."
zip -r ../kaminari-firefox.zip . -x "*.DS_Store" -x ".git/*"
echo "✅ Firefox extension built successfully!"