import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Secure Bridge for BigCommerce ROTM Orders - Updated 2026-03-30
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Initialize Supabase Client to verify the staff user
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      throw new Error('No Authorization header provided')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // 3. Verify the user is a logged-in staff member
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized: You must be logged in as staff')
    }

    // 4. Get BigCommerce Credentials from Secrets
    const STORE_HASH = Deno.env.get('BC_STORE_HASH')
    const ACCESS_TOKEN = Deno.env.get('BC_ACCESS_TOKEN')

    if (!STORE_HASH || !ACCESS_TOKEN) {
      throw new Error(`Configuration Error: Missing BigCommerce secrets (Hash: ${!!STORE_HASH}, Token: ${!!ACCESS_TOKEN})`)
    }

    // 5. Parse the request action
    const body = await req.json().catch(() => ({}))
    const { action, orderId } = body
    const v2Url = `https://api.bigcommerce.com/stores/${STORE_HASH}/v2`

    // 6. ACTION: Fetch Recent Orders
    if (action === 'fetch_recent') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const rfcDate = sevenDaysAgo.toUTCString().replace('GMT', '+0000')

      // 1. Fetch the list of recent orders
      const response = await fetch(`${v2Url}/orders?min_date_created=${encodeURIComponent(rfcDate)}&limit=50&sort=date_created:desc`, {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json',
        }
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`BigCommerce Error (${response.status}): ${errText}`)
      }

      const basicOrders = await response.json()
      
      // 2. Fetch FULL details for each order (specifically for shipping addresses)
      // We do this in parallel to keep it fast
      const fullOrders = await Promise.all(basicOrders.map(async (o: any) => {
        const detailRes = await fetch(`${v2Url}/orders/${o.id}`, {
          headers: {
            'X-Auth-Token': ACCESS_TOKEN,
            'Accept': 'application/json',
          }
        })
        const fullOrder = await detailRes.json()
        
        // Also fetch shipping addresses explicitly as V2 sometimes hides them in the main response
        const shipRes = await fetch(`${v2Url}/orders/${o.id}/shipping_addresses`, {
          headers: {
            'X-Auth-Token': ACCESS_TOKEN,
            'Accept': 'application/json',
          }
        })
        fullOrder.shipping_addresses = await shipRes.json()

        // NEW: Fetch line items (products) to see what subscription they bought
        const productsRes = await fetch(`${v2Url}/orders/${o.id}/products`, {
          headers: {
            'X-Auth-Token': ACCESS_TOKEN,
            'Accept': 'application/json',
          }
        })
        fullOrder.products = await productsRes.json()
        
        return fullOrder
      }))

      return new Response(JSON.stringify(fullOrders), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // 7. ACTION: Check Specific Order Status
    if (action === 'check_status' && orderId) {
      const response = await fetch(`${v2Url}/orders/${orderId}`, {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json',
        }
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`BigCommerce Error (${response.status}): ${errText}`)
      }

      const order = await response.json()
      return new Response(JSON.stringify(order), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // 8. ACTION: Add a $0.00 ROTM product to a BigCommerce order
    if (action === 'add_month_item' && orderId) {
      const { productName } = body;
      if (!productName) throw new Error("Missing productName");

      // We use a trailing slash and product_id: 0 for custom items to avoid redirects (405 errors)
      const response = await fetch(`${v2Url}/orders/${orderId.trim()}/products/`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          product_id: 0,
          name: productName,
          quantity: 1,
          price_inc_tax: 0.00,
          price_ex_tax: 0.00
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Failed to add product: ${errText}`)
      }

      const result = await response.json()
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    throw new Error(`Invalid action: ${action}`)

  } catch (error) {
    // CRITICAL: Always return 200 with an error body so the UI can show the message
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  }
})
