import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function setupServerTools(server: McpServer, getEnv: () => any) {
  // Calculate Monthly Performance
  server.tool(
    'calculate_monthly_performance',
    'Calculates monthly trading performance and returns',
    {
      userId: z.number().describe('User ID'),
      month: z.string().describe('Month in YYYY-MM format')
    },
    async ({ userId, month }) => {
      try {
        const env = getEnv();
        const db = env.DB;

        if (!db) {
          throw new Error('Database not configured');
        }

        // Get all trades for the month
        const trades = await db.prepare(`
          SELECT * FROM trades 
          WHERE user_id = ? 
          AND strftime('%Y-%m', datetime(timestamp/1000, 'unixepoch')) = ?
        `).bind(userId, month).all();

        const totalTrades = trades.results?.length || 0;
        
        if (totalTrades === 0) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                userId,
                month,
                totalTrades: 0,
                wins: 0,
                losses: 0,
                winRate: '0%',
                totalPnl: '0',
                returnPct: '0%',
                status: 'No trades this month'
              }, null, 2)
            }]
          };
        }

        // Calculate metrics
        const closedTrades = trades.results?.filter((t: any) => t.status === 'CLOSED') || [];
        const wins = closedTrades.filter((t: any) => parseFloat(t.pnl) > 0).length;
        const losses = closedTrades.filter((t: any) => parseFloat(t.pnl) <= 0).length;
        const totalPnl = closedTrades.reduce((sum: number, t: any) => 
          sum + parseFloat(t.pnl || 0), 0
        );

        // Get initial balance (from first trade of month or previous month's final)
        const initialBalance = 1000; // Should query from DB
        const returnPct = (totalPnl / initialBalance) * 100;

        const winRate = closedTrades.length > 0 
          ? ((wins / closedTrades.length) * 100).toFixed(1)
          : '0';

        // Determine if on track for 2%+ target
        const status = returnPct >= 2 
          ? '✅ On track' 
          : returnPct >= 1 
            ? '⚠️ Below target but positive'
            : '❌ Underperforming';

        const result = {
          userId,
          month,
          totalTrades,
          wins,
          losses,
          winRate: winRate + '%',
          totalPnl: totalPnl.toFixed(2),
          returnPct: returnPct.toFixed(2) + '%',
          status,
          avgWin: wins > 0 ? (totalPnl / wins).toFixed(2) : '0',
          avgLoss: losses > 0 ? (totalPnl / losses).toFixed(2) : '0'
        };

        // Update monthly_performance table
        await db.prepare(`
          INSERT OR REPLACE INTO monthly_performance 
          (user_id, month, total_trades, wins, losses, total_pnl, return_pct)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          userId,
          month,
          totalTrades,
          wins,
          losses,
          totalPnl,
          returnPct
        ).run();

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
}