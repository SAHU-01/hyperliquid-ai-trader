import { TechnicalAnalyzerMcp } from './server';

export { TechnicalAnalyzerMcp };

interface Env {
  TECHNICAL_ANALYZER_MCP: DurableObjectNamespace;
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
              name: 'technical-analyzer-mcp',
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
              name: 'calculate_technical_indicators',
              description: 'Calculates RSI, MACD, and Bollinger Bands for technical analysis',
              inputSchema: {
                type: 'object',
                properties: {
                  coins: { 
                    type: 'array', 
                    items: { type: 'string' }
                  }
                },
                required: ['coins']
              }
            }]
          }
        });
      }
      
      if (body.method === 'tools/call') {
        const sessionId = env.TECHNICAL_ANALYZER_MCP.newUniqueId();
        const stub = env.TECHNICAL_ANALYZER_MCP.get(sessionId);
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
        ? env.TECHNICAL_ANALYZER_MCP.idFromName(sessionIdStr)
        : env.TECHNICAL_ANALYZER_MCP.newUniqueId();

    console.log(`Technical Analyzer MCP - sessionId: ${sessionIdStr} with id: ${id}`);
    
    url.searchParams.set('sessionId', id.toString());

    return env.TECHNICAL_ANALYZER_MCP.get(id).fetch(new Request(
        url.toString(),
        request
    ));
  }
};