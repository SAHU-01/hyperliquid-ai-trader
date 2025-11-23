import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function setupServerTools(server: McpServer) {
  // Analyze Orderbook Tool
  server.tool(
    'analyze_orderbook',
    'Analyzes Hyperliquid L2 orderbook for imbalances and whale movements',
    {
      coins: z.array(z.string()).describe('Array of coin symbols (BTC, ETH, SOL)'),
    },
    async ({ coins }) => {
      const results: Record<string, any> = {};

      for (const coin of coins) {
        try {
          // Fetch L2 orderbook from Hyperliquid
          const response = await fetch('https://api.hyperliquid.xyz/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'l2Book',
              coin: coin
            })
          });

          const data = await response.json() as any;

          if (!data.levels || data.levels.length < 2) {
            results[coin] = {
              signal: 'NEUTRAL',
              confidence: '30',
              error: 'Insufficient orderbook data'
            };
            continue;
          }

          // Calculate bid/ask volumes
          const bids = data.levels[0];
          const asks = data.levels[1];

          const bidVolume = bids.reduce((sum: number, [price, size]: [string, string]) => 
            sum + parseFloat(size), 0
          );
          const askVolume = asks.reduce((sum: number, [price, size]: [string, string]) => 
            sum + parseFloat(size), 0
          );

          const totalVolume = bidVolume + askVolume;
          const imbalance = ((bidVolume - askVolume) / totalVolume) * 100;

          // Detect whale orders (>1% of total volume)
          const whaleThreshold = totalVolume * 0.01;
          const whaleBids = bids.filter(([_, size]: [string, string]) => 
            parseFloat(size) > whaleThreshold
          ).length;
          const whaleAsks = asks.filter(([_, size]: [string, string]) => 
            parseFloat(size) > whaleThreshold
          ).length;

          // Calculate spread
          const bestBid = parseFloat(bids[0][0]);
          const bestAsk = parseFloat(asks[0][0]);
          const spread = ((bestAsk - bestBid) / bestBid) * 100;

          // Generate signal
          let signal = 'NEUTRAL';
          if (imbalance > 15) signal = 'STRONG_BUY';
          else if (imbalance > 5) signal = 'BUY';
          else if (imbalance < -15) signal = 'STRONG_SELL';
          else if (imbalance < -5) signal = 'SELL';

          const confidence = Math.min(50 + Math.abs(imbalance) * 2, 95);

          results[coin] = {
            signal,
            confidence: confidence.toFixed(1),
            imbalance: imbalance.toFixed(2),
            bidVolume: bidVolume.toFixed(4),
            askVolume: askVolume.toFixed(4),
            spread: spread.toFixed(4),
            whaleBids,
            whaleAsks,
            bestBid: bestBid.toFixed(2),
            bestAsk: bestAsk.toFixed(2)
          };

        } catch (error) {
          results[coin] = {
            signal: 'NEUTRAL',
            confidence: '30',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(results, null, 2)
        }]
      };
    }
  );
}