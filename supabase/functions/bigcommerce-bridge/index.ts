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
      throw new Error('Missing BigCommerce credentials')
    }

    const { action, orderId } = await req.json()
    const baseUrl = `https://api.bigcommerce.com/stores/${STORE_HASH}/v3`
    const v2Url = `https://api.bigcommerce.com/stores/${STORE_HASH}/v2`

    // 4. Handle Actions
    if (action === 'fetch_recent') {
      // Fetch orders from the last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const rfcDate = sevenDaysAgo.toISOString()

      // BigCommerce V2 Orders API is often better for simple listing
      const response = await fetch(`${v2Url}/orders?min_date_created=${rfcDate}&limit=50&sort=date_created:desc`, {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json',
        }
      })

      const orders = await response.json()
      
      // We also need to fetch products for these orders to see if they are ROTM
      // But for a first "Read-Only" test, let's just return the orders
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
