import { HyperliquidTraderMcp } from './server';

export { HyperliquidTraderMcp };

interface Env {
  HYPERLIQUID_TRADER_MCP: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const sessionIdStr = url.searchParams.get('sessionId')
    const id = sessionIdStr
        ? env.HYPERLIQUID_TRADER_MCP.idFromName(sessionIdStr)
        : env.HYPERLIQUID_TRADER_MCP.newUniqueId();

    console.log(`Hyperliquid Trader - sessionId: ${sessionIdStr} with id: ${id}`);
    
    url.searchParams.set('sessionId', id.toString());

    return env.HYPERLIQUID_TRADER_MCP.get(id).fetch(new Request(
        url.toString(),
        request
    ));
  }
};