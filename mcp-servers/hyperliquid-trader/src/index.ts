import { HyperliquidTraderMcp } from './server';

export { HyperliquidTraderMcp };

interface Env {
  HYPERLIQUID_TRADER_MCP: DurableObjectNamespace;
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // ✅ Direct MCP endpoint
    if (request.method === 'POST' && url.pathname === '/mcp') {
      const body = await request.json() as any;
      
      // ✅ ADD: Handle initialize (REQUIRED!)
      if (body.method === 'initialize') {
        return Response.json({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              logging: {}
            },
            serverInfo: {
              name: 'hyperliquid-trader-mcp',
              version: '1.0.0'
            }
          }
        });
      }
      
      // ✅ ADD: Handle initialized notification (REQUIRED!)
      if (body.method === 'notifications/initialized') {
        return new Response(null, { status: 204 });
      }
      
      if (body.method === 'tools/list') {
        return Response.json({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            tools: [
              {
                name: 'get_user_balance',
                description: 'Gets user balance from Hyperliquid',
                inputSchema: {
                  type: 'object',
                  properties: {
                    userAddress: { type: 'string' }
                  },
                  required: ['userAddress']
                }
              },
              {
                name: 'place_order',
                description: 'Places a trading order on Hyperliquid',
                inputSchema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'number' },
                    coin: { type: 'string' },
                    side: { type: 'string', enum: ['LONG', 'SHORT'] },
                    size: { type: 'number' },
                    leverage: { type: 'number' },
                    tpPrice: { type: 'number' },
                    slPrice: { type: 'number' }
                  },
                  required: ['userId', 'coin', 'side', 'size', 'leverage']
                }
              },
              {
                name: 'close_position',
                description: 'Closes an open position',
                inputSchema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'number' },
                    coin: { type: 'string' }
                  },
                  required: ['userId', 'coin']
                }
              }
            ]
          }
        });
      }
      
      if (body.method === 'tools/call') {
        const sessionId = env.HYPERLIQUID_TRADER_MCP.newUniqueId();
        const stub = env.HYPERLIQUID_TRADER_MCP.get(sessionId);
        return stub.fetch(request);
      }
      
      return Response.json({
        jsonrpc: '2.0',
        id: body.id,
        error: { code: -32601, message: 'Method not found' }
      });
    }
    
    // Existing code
    const sessionIdStr = url.searchParams.get('sessionId')
    const id = sessionIdStr
        ? env.HYPERLIQUID_TRADER_MCP.idFromName(sessionIdStr)
        : env.HYPERLIQUID_TRADER_MCP.newUniqueId();

    console.log(`Hyperliquid Trader MCP - sessionId: ${sessionIdStr} with id: ${id}`);
    
    url.searchParams.set('sessionId', id.toString());

    return env.HYPERLIQUID_TRADER_MCP.get(id).fetch(new Request(
        url.toString(),
        request
    ));
  }
};