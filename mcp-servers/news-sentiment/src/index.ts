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
    const sessionIdStr = url.searchParams.get('sessionId')
    const id = sessionIdStr
        ? env.NEWS_SENTIMENT_MCP.idFromString(sessionIdStr)
        : env.NEWS_SENTIMENT_MCP.newUniqueId();

    console.log(`News Sentiment MCP - sessionId: ${sessionIdStr} with id: ${id}`);
    
    url.searchParams.set('sessionId', id.toString());

    return env.NEWS_SENTIMENT_MCP.get(id).fetch(new Request(
        url.toString(),
        request
    ));
  }
};