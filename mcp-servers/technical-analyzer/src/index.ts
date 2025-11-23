import { TechnicalAnalyzerMcp } from './server';

export { TechnicalAnalyzerMcp };

interface Env {
  TECHNICAL_ANALYZER_MCP: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const sessionIdStr = url.searchParams.get('sessionId')
    const id = sessionIdStr
        ? env.TECHNICAL_ANALYZER_MCP.idFromString(sessionIdStr)
        : env.TECHNICAL_ANALYZER_MCP.newUniqueId();

    console.log(`Technical Analyzer - sessionId: ${sessionIdStr} with id: ${id}`);
    
    url.searchParams.set('sessionId', id.toString());

    return env.TECHNICAL_ANALYZER_MCP.get(id).fetch(new Request(
        url.toString(),
        request
    ));
  }
};