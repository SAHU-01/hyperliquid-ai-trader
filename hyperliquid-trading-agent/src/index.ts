import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ToolboxService } from '@nullshot/agent';
import { stepCountIs, type LanguageModel, type Provider } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { AiSdkAgent, AIUISDKMessage } from '@nullshot/agent';
import mcpConfig from '../mcp.json'

// Instantiate application with Hono
const app = new Hono<{ Bindings: Env }>();

app.use(
	'*',
	cors({
		origin: '*', // Allow any origin for development; restrict this in production
		allowMethods: ['POST', 'GET', 'OPTIONS'],
		allowHeaders: ['Content-Type'],
		exposeHeaders: ['X-Session-Id'],
		maxAge: 86400, // 24 hours
	}),
);

// Route all requests to the durable object instance based on session
app.all('/agent/chat/:sessionId?', async (c) => {
	const { AGENT } = c.env;
	var sessionIdStr = c.req.param('sessionId');

	if (!sessionIdStr || sessionIdStr == '') {
		sessionIdStr = crypto.randomUUID();
	}

	const id = AGENT.idFromName(sessionIdStr);

	const forwardRequest = new Request('https://internal.com/agent/chat/' + sessionIdStr, {
		method: c.req.method,
		body: c.req.raw.body,
	});

	// Forward to Durable Object and get response
	return await AGENT.get(id).fetch(forwardRequest);
});

//
export class SimplePromptAgent extends AiSdkAgent<Env> {
	constructor(state: DurableObjectState, env: Env) {
		 // Use string model identifier - AI SDK v5 supports this directly
		 let provider: Provider;
		 let model: LanguageModel;
		 switch (env.AI_PROVIDER) {
		   case "anthropic":
			 provider = createAnthropic({
			   apiKey: env.AI_PROVIDER_API_KEY,
			 });
	 
			 // Get the actual model object
			 model = provider.languageModel(env.MODEL_ID);
			 break;
		   default:
			 // This should never happen due to validation above, but TypeScript requires this
			 throw new Error(`Unsupported AI provider: ${env.AI_PROVIDER}`);
		 }
	 
		 super(state, env, model, [new ToolboxService(env, mcpConfig)]);
	  }

	async processMessage(sessionId: string, messages: AIUISDKMessage): Promise<Response> {
		// Use the protected streamTextWithMessages method - model is handled automatically by the agent
		const result = await this.streamTextWithMessages(
			sessionId,
			messages.messages,
			{
			  system: `You are an autonomous trading agent for Hyperliquid perpetual futures.

						Your mission: Achieve 2%+ monthly returns through disciplined AI-powered trading.

						WORKFLOW (runs every 5 minutes):
						1. Analyze news sentiment (CryptoPanic + LunarCrush)
						2. Check orderbook imbalances (Hyperliquid L2 data)
						3. Calculate technical indicators (RSI, MACD, MA)
						4. Generate master signal (weighted: 40% orderbook, 35% technical, 25% news)
						5. Execute trades with TP/SL if confidence >= 65%
						6. Track performance toward 2%+ monthly target

						RISK MANAGEMENT:
						- Conservative: Max 20% per trade
						- Balanced: Max 30% per trade
						- Aggressive: Max 50% per trade
						- Always use 1x leverage initially
						- Never trade without TP/SL
						- Stop if monthly drawdown > 10%

						Available tools from MCPs:
						- analyze_news_sentiment
						- analyze_orderbook
						- calculate_technical_indicators
						- generate_master_signal
						- get_user_balance
						- place_order_with_tpsl
						- calculate_monthly_performance

						Be concise and action-oriented.`,
			  maxSteps: 10,
			  stopWhen: stepCountIs(10),
			  // Enable MCP tools from imported mcp.json
			  experimental_toolCallStreaming: true,
			  onError: (error: unknown) => {
				console.error("Error processing message", error);
			  },
			},
		  );
	  
		  return result.toTextStreamResponse();
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		return app.fetch(request, env, ctx);
	},
};
