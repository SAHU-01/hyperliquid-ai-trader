import { Implementation } from '@modelcontextprotocol/sdk/types.js';
import { McpHonoServerDO } from '@nullshot/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { setupServerTools } from './tools';
import { setupServerResources } from './resources';
import { setupServerPrompts } from './prompts';

export class TechnicalAnalyzerMcp extends McpHonoServerDO<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  getImplementation(): Implementation {
    return {
      name: 'technical-analyzer',
      version: '1.0.0',
    };
  }

  configureServer(server: McpServer): void {
    setupServerTools(server);
    setupServerResources(server);
    setupServerPrompts(server);
  }
}