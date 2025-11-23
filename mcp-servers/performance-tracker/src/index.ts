import { PerformanceTrackerMcp } from './server';

export { PerformanceTrackerMcp };

interface Env {
  PERFORMANCE_TRACKER_MCP: DurableObjectNamespace;
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
              name: 'performance-tracker-mcp',
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
              name: 'calculate_monthly_performance',
              description: 'Calculates trading performance metrics for a given month',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { 
                    type: 'number',
                    description: 'User ID'
                  },
                  month: { 
                    type: 'string',
                    description: 'Month in YYYY-MM format (e.g., "2025-11")'
                  }
                },
                required: ['userId', 'month']
              }
            }]
          }
        });
      }
      
      if (body.method === 'tools/call') {
        const sessionId = env.PERFORMANCE_TRACKER_MCP.newUniqueId();
        const stub = env.PERFORMANCE_TRACKER_MCP.get(sessionId);
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
        ? env.PERFORMANCE_TRACKER_MCP.idFromName(sessionIdStr)
        : env.PERFORMANCE_TRACKER_MCP.newUniqueId();

    console.log(`Performance Tracker MCP - sessionId: ${sessionIdStr} with id: ${id}`);
    
    url.searchParams.set('sessionId', id.toString());

    return env.PERFORMANCE_TRACKER_MCP.get(id).fetch(new Request(
        url.toString(),
        request
    ));
  }
};