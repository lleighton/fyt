// Supabase Edge Function: Send push notification when a group invitation is created
// Deploy with: supabase functions deploy send-group-invite-notification

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface GroupInviteNotificationPayload {
  invite_id: string
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

    const { invite_id } = await req.json() as GroupInviteNotificationPayload

    if (!invite_id) {
      return new Response(JSON.stringify({ error: 'invite_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get invite details with push token
    const { data: inviteData, error } = await supabase.rpc('get_group_invite_push_token', {
      p_invite_id: invite_id,
    })

    if (error) {
      console.error('Error fetching invite:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!inviteData || inviteData.length === 0) {
      return new Response(JSON.stringify({ message: 'No push token for invitee' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const invite = inviteData[0]

    if (!invite.push_token || !invite.push_token.startsWith('ExponentPushToken')) {
      return new Response(JSON.stringify({ message: 'Invalid or missing push token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Build push message
    const message: PushMessage = {
      to: invite.push_token,
      sound: 'default',
      title: `Group Invitation`,
      body: `${invite.inviter_name || 'Someone'} invited you to join "${invite.group_name}"`,
      data: {
        inviteId: invite_id,
        type: 'group_invite',
      },
      channelId: 'groups',
    }

    // Send to Expo Push API
    const pushResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([message]),
    })

    const pushResult = await pushResponse.json()
    console.log('Push result:', pushResult)

    return new Response(JSON.stringify({
      success: true,
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
