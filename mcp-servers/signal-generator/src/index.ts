import { SignalGeneratorMcp } from './server';

export { SignalGeneratorMcp };

interface Env {
  SIGNAL_GENERATOR_MCP: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const sessionIdStr = url.searchParams.get('sessionId')
    const id = sessionIdStr
        ? env.SIGNAL_GENERATOR_MCP.idFromString(sessionIdStr)
        : env.SIGNAL_GENERATOR_MCP.newUniqueId();

    console.log(`Signal Generator - sessionId: ${sessionIdStr} with id: ${id}`);
    
    url.searchParams.set('sessionId', id.toString());

    return env.SIGNAL_GENERATOR_MCP.get(id).fetch(new Request(
        url.toString(),
        request
    ));
  }
};