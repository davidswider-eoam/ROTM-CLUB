import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Secure Bridge for BigCommerce ROTM Orders
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Verify Auth (Security Check)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // 3. Get BigCommerce Credentials
    const STORE_HASH = Deno.env.get('BC_STORE_HASH')
    const ACCESS_TOKEN = Deno.env.get('BC_ACCESS_TOKEN')

    if (!STORE_HASH || !ACCESS_TOKEN) {
      return new Response(JSON.stringify({ 
        error: `Missing credentials. Found HASH: ${!!STORE_HASH}, TOKEN: ${!!ACCESS_TOKEN}. Please check Supabase > Edge Functions > Manage Secrets.` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const { action, orderId } = await req.json()
    const v2Url = `https://api.bigcommerce.com/stores/${STORE_HASH}/v2`

    // 4. Handle Actions
    if (action === 'fetch_recent') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      // BigCommerce V2 expects: Tue, 20 Nov 2012 00:00:00 +0000
      const rfcDate = sevenDaysAgo.toUTCString().replace('GMT', '+0000')

      const response = await fetch(`${v2Url}/orders?min_date_created=${encodeURIComponent(rfcDate)}&limit=50&sort=date_created:desc`, {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json',
        }
      })

      if (!response.ok) {
        const errText = await response.text()
        return new Response(JSON.stringify({ error: `BigCommerce Error (${response.status}): ${errText}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      const orders = await response.json()
      return new Response(JSON.stringify(orders), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'check_status' && orderId) {
      const response = await fetch(`${v2Url}/orders/${orderId}`, {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json',
        }
      })

      if (!response.ok) {
        const errText = await response.text()
        return new Response(JSON.stringify({ error: `BigCommerce Error (${response.status}): ${errText}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      const order = await response.json()
      return new Response(JSON.stringify(order), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Invalid action')

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
