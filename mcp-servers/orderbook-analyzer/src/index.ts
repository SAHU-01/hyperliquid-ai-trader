import { OrderbookAnalyzerMcp } from './server';

export { OrderbookAnalyzerMcp };

interface Env {
  ORDERBOOK_ANALYZER_MCP: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const sessionIdStr = url.searchParams.get('sessionId')
    const id = sessionIdStr
        ? env.ORDERBOOK_ANALYZER_MCP.idFromString(sessionIdStr)
        : env.ORDERBOOK_ANALYZER_MCP.newUniqueId();

    console.log(`Orderbook Analyzer - sessionId: ${sessionIdStr} with id: ${id}`);
    
    url.searchParams.set('sessionId', id.toString());

    return env.ORDERBOOK_ANALYZER_MCP.get(id).fetch(new Request(
        url.toString(),
        request
    ));
  }
};