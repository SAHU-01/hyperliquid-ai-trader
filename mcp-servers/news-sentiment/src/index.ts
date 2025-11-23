import { NewsSentimentMcp } from './server';

export { NewsSentimentMcp };

interface Env {
  NEWS_SENTIMENT_MCP: DurableObjectNamespace;
  CRYPTOPANIC_API_KEY: string;
  LUNARCRUSH_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // ✅ Direct MCP endpoint for agent
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
              name: 'news-sentiment-mcp',
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
              name: 'analyze_news_sentiment',
              description: 'Analyzes news sentiment from CryptoPanic and LunarCrush for specified coins',
              inputSchema: {
                type: 'object',
                properties: {
                  coins: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'Array of coin symbols to analyze (e.g., ["BTC", "ETH"])'
                  }
                },
                required: ['coins']
              }
            }]
          }
        });
      }
      
      // For tools/call, forward to Durable Object
      if (body.method === 'tools/call') {
        const sessionId = env.NEWS_SENTIMENT_MCP.newUniqueId();
        const stub = env.NEWS_SENTIMENT_MCP.get(sessionId);
        return stub.fetch(request);
      }
      
      return Response.json({
        jsonrpc: '2.0',
        id: body.id,
        error: { code: -32601, message: 'Method not found' }
      });
    }
    
    // Existing Durable Object code (SSE)
    const sessionIdStr = url.searchParams.get('sessionId')
    const id = sessionIdStr
        ? env.NEWS_SENTIMENT_MCP.idFromName(sessionIdStr)
        : env.NEWS_SENTIMENT_MCP.newUniqueId();

    console.log(`News Sentiment MCP - sessionId: ${sessionIdStr} with id: ${id}`);
    
    url.searchParams.set('sessionId', id.toString());

    return env.NEWS_SENTIMENT_MCP.get(id).fetch(new Request(
        url.toString(),
        request
    ));
  }
};