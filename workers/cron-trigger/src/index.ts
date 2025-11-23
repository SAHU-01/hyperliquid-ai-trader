interface Env {
  DB: D1Database;
  AGENT_URL: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log('🔄 Cron started:', new Date().toISOString());
    
    try {
      const users = await env.DB.prepare(
        'SELECT main_wallet FROM users WHERE enable_auto_trade = 1'
      ).all();
      
      console.log(`📊 Processing ${users.results.length} users`);
      
      for (const user of users.results) {
        try {
          const response = await fetch(`${env.AGENT_URL}/agent/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{
                role: 'user',
                content: `Analyze trading signals for ${user.main_wallet} and execute trades if confidence >= 65%`
              }]
            })
          });
          
          console.log(`✅ Processed ${user.main_wallet}`);
          await new Promise(r => setTimeout(r, 2000));
          
        } catch (error) {
          console.error(`❌ Error for ${user.main_wallet}:`, error);
        }
      }
      
    } catch (error) {
      console.error('❌ Cron failed:', error);
    }
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    return Response.json({
      status: 'Cron trigger active',
      schedule: 'Every 5 minutes',
      agent_url: env.AGENT_URL
    });
  }
};
