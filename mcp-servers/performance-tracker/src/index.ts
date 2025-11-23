import { PerformanceTrackerMcp } from './server';

export { PerformanceTrackerMcp };

interface Env {
  PERFORMANCE_TRACKER_MCP: DurableObjectNamespace;
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const sessionIdStr = url.searchParams.get('sessionId')
    const id = sessionIdStr
        ? env.PERFORMANCE_TRACKER_MCP.idFromName(sessionIdStr)
        : env.PERFORMANCE_TRACKER_MCP.newUniqueId();

    console.log(`Performance Tracker - sessionId: ${sessionIdStr} with id: ${id}`);
    
    url.searchParams.set('sessionId', id.toString());

    return env.PERFORMANCE_TRACKER_MCP.get(id).fetch(new Request(
        url.toString(),
        request
    ));
  }
};