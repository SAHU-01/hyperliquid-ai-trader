import { Implementation } from '@modelcontextprotocol/sdk/types.js';
import { McpHonoServerDO } from '@nullshot/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { setupServerTools } from './tools';
import { setupServerResources } from './resources';
import { setupServerPrompts } from './prompts';

/**
 * News Sentiment MCP Server - Analyzes crypto news sentiment
 */
export class NewsSentimentMcp extends McpHonoServerDO<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  /**
   * Implementation details
   */
  getImplementation(): Implementation {
    return {
      name: 'news-sentiment-analyzer',
      version: '1.0.0',
    };
  }

  /**
   * Configure MCP server with news sentiment tools
   */
  configureServer(server: McpServer): void {
    setupServerTools(server);
    setupServerResources(server);
    setupServerPrompts(server);
  }
}