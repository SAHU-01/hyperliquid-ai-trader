#!/bin/bash

add_initialize_to_mcp() {
  local mcp_name=$1
  local file="$mcp_name/src/index.ts"
  
  echo "Adding initialize support to $mcp_name..."
  
  # Backup
  cp "$file" "$file.bak"
  
  # Add initialize method right after the /mcp check
  # This is a simplified approach - you'll need to manually verify
  echo "✅ Backed up $file"
}

# Process each MCP
for dir in news-sentiment orderbook-analyzer technical-analyzer signal-generator hyperliquid-trader performance-tracker; do
  add_initialize_to_mcp "$dir"
done

echo "⚠️  Please manually add initialize method to each MCP's src/index.ts"
echo "See the example code above!"
