// Supabase Edge Function: Send push notification when a tag is created
// Deploy with: supabase functions deploy send-tag-notification

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface TagNotificationPayload {
  tag_id: string
}

interface PushMessage {
  to: string
  sound: string
  title: string
  body: string
  data: Record<string, any>
  channelId?: string
}

Deno.serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    const { tag_id } = await req.json() as TagNotificationPayload

    if (!tag_id) {
      return new Response(JSON.stringify({ error: 'tag_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get recipients with push tokens
    const { data: recipients, error } = await supabase.rpc('get_tag_recipient_push_tokens', {
      p_tag_id: tag_id,
    })

    if (error) {
      console.error('Error fetching recipients:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!recipients || recipients.length === 0) {
      return new Response(JSON.stringify({ message: 'No recipients with push tokens' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Build push messages
    const messages: PushMessage[] = recipients
      .filter((r: any) => r.push_token && r.push_token.startsWith('ExponentPushToken'))
      .map((r: any) => ({
        to: r.push_token,
        sound: 'default',
        title: `${r.sender_name} tagged you!`,
        body: `Can you beat ${r.tag_value} ${r.exercise_name}? You have 24 hours!`,
        data: {
          tagId: tag_id,
          type: 'tag_received',
        },
        channelId: 'tags',
      }))

    if (messages.length === 0) {
      return new Response(JSON.stringify({ message: 'No valid push tokens' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Send to Expo Push API
    const pushResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    const pushResult = await pushResponse.json()
    console.log('Push result:', pushResult)

    return new Response(JSON.stringify({
      success: true,
      sent: messages.length,
      result: pushResult,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
