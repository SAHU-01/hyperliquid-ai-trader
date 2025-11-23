import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function setupServerTools(server: McpServer) {
  // Generate Master Signal
  server.tool(
    'generate_master_signal',
    'Combines news, orderbook, and technical signals with weighted scoring',
    {
      coin: z.string().describe('Coin symbol'),
      newsSignal: z.object({
        signal: z.string(),
        confidence: z.string(),
        sentiment: z.string()
      }),
      orderbookSignal: z.object({
        signal: z.string(),
        confidence: z.string(),
        imbalance: z.string()
      }),
      technicalSignal: z.object({
        signal: z.string(),
        confidence: z.string(),
        rsi: z.string()
      })
    },
    async ({ coin, newsSignal, orderbookSignal, technicalSignal }) => {
      // Weighted scoring: 40% orderbook, 35% technical, 25% news
      const weights = {
        orderbook: 0.40,
        technical: 0.35,
        news: 0.25
      };

      // Convert signals to scores
      const signalToScore = (signal: string): number => {
        const scores: Record<string, number> = {
          'STRONG_BUY': 100,
          'BUY': 75,
          'NEUTRAL': 50,
          'SELL': 25,
          'STRONG_SELL': 0
        };
        return scores[signal] || 50;
      };

      const newsScore = signalToScore(newsSignal.signal);
      const orderbookScore = signalToScore(orderbookSignal.signal);
      const technicalScore = signalToScore(technicalSignal.signal);

      // Calculate weighted score
      const weightedScore = 
        (orderbookScore * weights.orderbook) +
        (technicalScore * weights.technical) +
        (newsScore * weights.news);

      // Calculate confidence (weighted average)
      const newsConf = parseFloat(newsSignal.confidence);
      const orderbookConf = parseFloat(orderbookSignal.confidence);
      const technicalConf = parseFloat(technicalSignal.confidence);

      const weightedConfidence =
        (orderbookConf * weights.orderbook) +
        (technicalConf * weights.technical) +
        (newsConf * weights.news);

      // Determine final signal
      let finalSignal = 'NEUTRAL';
      if (weightedScore >= 75) finalSignal = 'STRONG_BUY';
      else if (weightedScore >= 60) finalSignal = 'BUY';
      else if (weightedScore <= 25) finalSignal = 'STRONG_SELL';
      else if (weightedScore <= 40) finalSignal = 'SELL';

      // Determine action
      let action = 'HOLD';
      if (finalSignal === 'STRONG_BUY' || finalSignal === 'BUY') {
        action = weightedConfidence >= 65 ? 'OPEN_LONG' : 'HOLD';
      } else if (finalSignal === 'STRONG_SELL' || finalSignal === 'SELL') {
        action = weightedConfidence >= 65 ? 'OPEN_SHORT' : 'HOLD';
      }

      const result = {
        coin,
        signal: finalSignal,
        action,
        confidence: weightedConfidence.toFixed(1),
        weightedScore: weightedScore.toFixed(1),
        breakdown: {
          news: {
            score: newsScore,
            weight: weights.news * 100 + '%',
            contribution: (newsScore * weights.news).toFixed(1)
          },
          orderbook: {
            score: orderbookScore,
            weight: weights.orderbook * 100 + '%',
            contribution: (orderbookScore * weights.orderbook).toFixed(1)
          },
          technical: {
            score: technicalScore,
            weight: weights.technical * 100 + '%',
            contribution: (technicalScore * weights.technical).toFixed(1)
          }
        },
        reasoning: generateReasoning(finalSignal, newsSignal, orderbookSignal, technicalSignal)
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    }
  );
}

function generateReasoning(
  finalSignal: string,
  news: any,
  orderbook: any,
  technical: any
): string {
  const reasons: string[] = [];

  if (news.signal !== 'NEUTRAL') {
    reasons.push(`News sentiment is ${news.sentiment} (${news.signal})`);
  }

  if (orderbook.signal !== 'NEUTRAL') {
    reasons.push(`Orderbook shows ${orderbook.imbalance}% imbalance (${orderbook.signal})`);
  }

  if (technical.signal !== 'NEUTRAL') {
    reasons.push(`Technical indicators: RSI ${technical.rsi} (${technical.signal})`);
  }

  if (reasons.length === 0) {
    return 'All signals are neutral - no clear direction';
  }

  return reasons.join('. ') + `.`;
}