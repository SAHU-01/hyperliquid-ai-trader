import { Implementation } from '@modelcontextprotocol/sdk/types.js';
import { McpHonoServerDO } from '@nullshot/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { setupServerTools } from './tools';
import { setupServerResources } from './resources';
import { setupServerPrompts } from './prompts';

export class PerformanceTrackerMcp extends McpHonoServerDO<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  getImplementation(): Implementation {
    return {
      name: 'performance-tracker',
      version: '1.0.0',
    };
  }

  configureServer(server: McpServer): void {
    // Pass a function that returns env
    setupServerTools(server, () => this.env);
    setupServerResources(server);
    setupServerPrompts(server);
  }
}