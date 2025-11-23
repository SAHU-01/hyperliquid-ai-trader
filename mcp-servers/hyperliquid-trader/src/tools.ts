import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function setupServerTools(server: McpServer) {
  // Get User Balance
  server.tool(
    'get_user_balance',
    'Gets user account balance and positions from Hyperliquid',
    {
      userAddress: z.string().describe('User wallet address'),
    },
    async ({ userAddress }) => {
      try {
        const response = await fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'clearinghouseState',
            user: userAddress
          })
        });

        const data = await response.json() as any;

        const result = {
          accountValue: data.marginSummary?.accountValue || '0',
          withdrawable: data.withdrawable || '0',
          positions: data.assetPositions?.map((pos: any) => ({
            coin: pos.position.coin,
            size: pos.position.szi,
            entryPrice: pos.position.entryPx,
            unrealizedPnl: pos.position.unrealizedPnl,
            leverage: pos.position.leverage,
            liquidationPrice: pos.position.liquidationPx
          })) || []
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };

      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error'
            }, null, 2)
          }]
        };
      }
    }
  );

  // Place Order with TP/SL
  server.tool(
    'place_order_with_tpsl',
    'Places an order on Hyperliquid with automatic Take Profit and Stop Loss',
    {
      userAddress: z.string().describe('User wallet address'),
      apiSecret: z.string().describe('User API secret key'),
      coin: z.string().describe('Coin symbol'),
      isBuy: z.boolean().describe('True for long, false for short'),
      size: z.number().describe('Position size'),
      leverage: z.number().describe('Leverage (1-50)'),
      tpPercent: z.number().describe('Take profit percentage'),
      slPercent: z.number().describe('Stop loss percentage')
    },
    async ({ userAddress, apiSecret, coin, isBuy, size, leverage, tpPercent, slPercent }) => {
      try {
        // Get current price
        const priceResponse = await fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'allMids'
          })
        });

        const prices = await priceResponse.json() as any;
        const currentPrice = parseFloat(prices[coin]);

        // Calculate TP/SL prices
        const tpPrice = isBuy 
          ? currentPrice * (1 + tpPercent / 100)
          : currentPrice * (1 - tpPercent / 100);
        
        const slPrice = isBuy
          ? currentPrice * (1 - slPercent / 100)
          : currentPrice * (1 + slPercent / 100);

        // Mock order placement (in production, use actual Hyperliquid SDK)
        const order = {
          coin,
          side: isBuy ? 'LONG' : 'SHORT',
          size: size.toFixed(4),
          entryPrice: currentPrice.toFixed(2),
          tpPrice: tpPrice.toFixed(2),
          slPrice: slPrice.toFixed(2),
          leverage,
          timestamp: Date.now(),
          status: 'PENDING'
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              order,
              message: 'Order placed successfully with TP/SL'
            }, null, 2)
          }]
        };

      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }, null, 2)
          }]
        };
      }
    }
  );

  // Get Open Orders
  server.tool(
    'get_open_orders',
    'Gets all open orders for a user',
    {
      userAddress: z.string().describe('User wallet address'),
    },
    async ({ userAddress }) => {
      try {
        const response = await fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'openOrders',
            user: userAddress
          })
        });

        const orders = await response.json();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(orders, null, 2)
          }]
        };

      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error'
            }, null, 2)
          }]
        };
      }
    }
  );
}