#!/bin/bash

echo "Creating News Sentiment MCP..."

# Create directories
mkdir -p mcp-servers/news-sentiment/src

# Create package.json
cat > mcp-servers/news-sentiment/package.json << 'EOF'
{
  "name": "news-sentiment-mcp",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "deploy": "wrangler deploy",
    "dev": "wrangler dev"
  },
  "dependencies": {
    "@nullshot/mcp-framework": "^1.0.0",
    "@cloudflare/workers-types": "^4.20241127.0"
  }
}
EOF

# Create wrangler.toml
cat > mcp-servers/news-sentiment/wrangler.toml << 'EOF'
name = "news-sentiment-mcp"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
CRYPTOPANIC_API_KEY = "80b0e9790e6affa2649050bef64fc865491f0332"
LUNARCRUSH_API_KEY = "2wwwiugix75th04mscjc76v46mibunit2n3rx9gn"
EOF

echo "✅ Files created! Now open in editor to add TypeScript code."
echo "Run: code mcp-servers/news-sentiment/src/index.ts"

