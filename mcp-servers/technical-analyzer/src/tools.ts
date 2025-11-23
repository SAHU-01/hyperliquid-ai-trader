import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function setupServerTools(server: McpServer) {
  // Calculate Technical Indicators
  server.tool(
    'calculate_technical_indicators',
    'Calculates RSI, MACD, and Moving Averages for trading signals',
    {
      coins: z.array(z.string()).describe('Array of coin symbols (BTC, ETH, SOL)'),
    },
    async ({ coins }) => {
      const results: Record<string, any> = {};

      for (const coin of coins) {
        try {
          // Fetch candlestick data from Hyperliquid
          const response = await fetch('https://api.hyperliquid.xyz/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'candleSnapshot',
              req: {
                coin: coin,
                interval: '1h',
                startTime: Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
              }
            })
          });

          const candles = await response.json() as any[];

          if (!candles || candles.length < 14) {
            results[coin] = {
              signal: 'NEUTRAL',
              confidence: '30',
              error: 'Insufficient price data'
            };
            continue;
          }

          const closes = candles.map((c: any) => parseFloat(c.c));
          const currentPrice = closes[closes.length - 1];

          // Calculate RSI (14 period)
          const rsi = calculateRSI(closes, 14);

          // Calculate Moving Averages
          const ma7 = calculateMA(closes, 7);
          const ma25 = calculateMA(closes, 25);

          // Calculate MACD
          const ema12 = calculateEMA(closes, 12);
          const ema26 = calculateEMA(closes, 26);
          const macd = ema12 - ema26;
          const signal = calculateEMA([macd], 9);
          const histogram = macd - signal;

          // Generate trading signal
          let tradingSignal = 'NEUTRAL';
          let confidence = 50;

          // RSI signals
          if (rsi < 30) {
            tradingSignal = 'STRONG_BUY';
            confidence += 20;
          } else if (rsi < 40) {
            tradingSignal = 'BUY';
            confidence += 10;
          } else if (rsi > 70) {
            tradingSignal = 'STRONG_SELL';
            confidence += 20;
          } else if (rsi > 60) {
            tradingSignal = 'SELL';
            confidence += 10;
          }

          // MA crossover
          if (ma7 > ma25 && tradingSignal !== 'SELL' && tradingSignal !== 'STRONG_SELL') {
            confidence += 10;
          } else if (ma7 < ma25 && tradingSignal !== 'BUY' && tradingSignal !== 'STRONG_BUY') {
            confidence += 10;
          }

          // MACD confirmation
          if (histogram > 0 && (tradingSignal === 'BUY' || tradingSignal === 'STRONG_BUY')) {
            confidence += 15;
          } else if (histogram < 0 && (tradingSignal === 'SELL' || tradingSignal === 'STRONG_SELL')) {
            confidence += 15;
          }

          confidence = Math.min(confidence, 95);

          results[coin] = {
            signal: tradingSignal,
            confidence: confidence.toFixed(1),
            rsi: rsi.toFixed(2),
            ma7: ma7.toFixed(2),
            ma25: ma25.toFixed(2),
            macd: macd.toFixed(4),
            macdSignal: signal.toFixed(4),
            macdHistogram: histogram.toFixed(4),
            currentPrice: currentPrice.toFixed(2)
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

// Helper functions
function calculateRSI(prices: number[], period: number): number {
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < Math.min(period + 1, prices.length); i++) {
    const difference = prices[i] - prices[i - 1];
    if (difference >= 0) {
      gains += difference;
    } else {
      losses -= difference;
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMA(prices: number[], period: number): number {
  const slice = prices.slice(-period);
  return slice.reduce((sum, price) => sum + price, 0) / slice.length;
}

function calculateEMA(prices: number[], period: number): number {
  const multiplier = 2 / (period + 1);
  let ema = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}