import { SignalGeneratorMcp } from './server';

export { SignalGeneratorMcp };

interface Env {
  SIGNAL_GENERATOR_MCP: DurableObjectNamespace;
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // ✅ Direct MCP endpoint
    if (request.method === 'POST' && url.pathname === '/mcp') {
      const body = await request.json() as any;
      
      // ✅ Handle initialize
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
              name: 'signal-generator-mcp',
              version: '1.0.0'
            }
          }
        });
      }
      
      // ✅ Handle initialized notification
      if (body.method === 'notifications/initialized') {
        return new Response(null, { status: 204 });
      }
      
      if (body.method === 'tools/list') {
        return Response.json({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            tools: [{
              name: 'generate_master_signal',
              description: 'Combines news, orderbook, and technical signals into final trading decision with confidence score',
              inputSchema: {
                type: 'object',
                properties: {
                  coin: { 
                    type: 'string',
                    description: 'Coin symbol (e.g., "BTC")'
                  },
                  newsSignal: {
                    type: 'object',
                    properties: {
                      signal: { type: 'string' },
                      confidence: { type: 'string' },
                      sentiment: { type: 'string' }
                    }
                  },
                  orderbookSignal: {
                    type: 'object',
                    properties: {
                      signal: { type: 'string' },
                      confidence: { type: 'string' },
                      imbalance: { type: 'string' }
                    }
                  },
                  technicalSignal: {
                    type: 'object',
                    properties: {
                      signal: { type: 'string' },
                      confidence: { type: 'string' },
                      rsi: { type: 'string' }
                    }
                  }
                },
                required: ['coin', 'newsSignal', 'orderbookSignal', 'technicalSignal']
              }
            }]
          }
        });
      }
      
      if (body.method === 'tools/call') {
        const sessionId = env.SIGNAL_GENERATOR_MCP.newUniqueId();
        const stub = env.SIGNAL_GENERATOR_MCP.get(sessionId);
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
        ? env.SIGNAL_GENERATOR_MCP.idFromName(sessionIdStr)
        : env.SIGNAL_GENERATOR_MCP.newUniqueId();

    console.log(`Signal Generator MCP - sessionId: ${sessionIdStr} with id: ${id}`);
    
    url.searchParams.set('sessionId', id.toString());

    return env.SIGNAL_GENERATOR_MCP.get(id).fetch(new Request(
        url.toString(),
        request
    ));
  }
};