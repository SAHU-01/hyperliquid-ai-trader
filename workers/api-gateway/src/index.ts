interface Env {
  DB: D1Database;
  PERFORMANCE_MCP_URL: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Register user
    if (url.pathname === '/register' && request.method === 'POST') {
      try {
        const { wallet, apiSecret, riskLevel } = await request.json() as any;

        await env.DB.prepare(
          'INSERT OR REPLACE INTO users (main_wallet, hl_api_address, hl_api_secret_key, api_secret, risk_level) VALUES (?, ?, ?, ?, ?)'
        ).bind(wallet, wallet, apiSecret, apiSecret, riskLevel || 'balanced').run();

        return Response.json({ 
          success: true, 
          message: 'User registered successfully' 
        }, { headers: corsHeaders });

      } catch (error) {
        return Response.json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500, headers: corsHeaders });
      }
    }

    // Get user data
    if (url.pathname === '/user' && request.method === 'POST') {
      try {
        const { wallet } = await request.json() as any;

        const user = await env.DB.prepare(
          'SELECT * FROM users WHERE main_wallet = ?'
        ).bind(wallet).first();

        if (!user) {
          return Response.json({ 
            success: false, 
            error: 'User not found' 
          }, { status: 404, headers: corsHeaders });
        }

        return Response.json({ 
          success: true, 
          user 
        }, { headers: corsHeaders });

      } catch (error) {
        return Response.json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500, headers: corsHeaders });
      }
    }

    // Get user positions
    if (url.pathname === '/positions' && request.method === 'POST') {
      try {
        const { wallet } = await request.json() as any;

        const user = await env.DB.prepare(
          'SELECT id FROM users WHERE main_wallet = ?'
        ).bind(wallet).first();

        if (!user) {
          return Response.json({ 
            success: false, 
            error: 'User not found' 
          }, { status: 404, headers: corsHeaders });
        }

        const positions = await env.DB.prepare(
          'SELECT * FROM trades WHERE user_id = ? AND status = ? ORDER BY timestamp DESC'
        ).bind(user.id, 'OPEN').all();

        return Response.json({ 
          success: true, 
          positions: positions.results 
        }, { headers: corsHeaders });

      } catch (error) {
        return Response.json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500, headers: corsHeaders });
      }
    }

    // Get trade history
    if (url.pathname === '/history' && request.method === 'POST') {
      try {
        const { wallet } = await request.json() as any;

        const user = await env.DB.prepare(
          'SELECT id FROM users WHERE main_wallet = ?'
        ).bind(wallet).first();

        if (!user) {
          return Response.json({ 
            success: false, 
            error: 'User not found' 
          }, { status: 404, headers: corsHeaders });
        }

        const history = await env.DB.prepare(
          'SELECT * FROM trades WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50'
        ).bind(user.id).all();

        return Response.json({ 
          success: true, 
          history: history.results 
        }, { headers: corsHeaders });

      } catch (error) {
        return Response.json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500, headers: corsHeaders });
      }
    }

    // Get monthly performance
    if (url.pathname === '/performance' && request.method === 'POST') {
      try {
        const { wallet, month } = await request.json() as any;

        const user = await env.DB.prepare(
          'SELECT id FROM users WHERE main_wallet = ?'
        ).bind(wallet).first();

        if (!user) {
          return Response.json({ 
            success: false, 
            error: 'User not found' 
          }, { status: 404, headers: corsHeaders });
        }

        const response = await fetch(env.PERFORMANCE_MCP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'calculate_monthly_performance',
              arguments: { userId: user.id, month }
            },
            id: 1
          })
        });

        const result = await response.json() as any;
        const performance = JSON.parse(result.result.content[0].text);

        return Response.json({ 
          success: true, 
          performance 
        }, { headers: corsHeaders });

      } catch (error) {
        return Response.json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500, headers: corsHeaders });
      }
    }

    return Response.json({ 
      message: 'API Gateway Ready',
      endpoints: ['/register', '/user', '/positions', '/history', '/performance']
    }, { headers: corsHeaders });
  }
};
