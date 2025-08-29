
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateMeetingRequest {
  title: string;
  startDateTime: string;
  endDateTime: string;
  participants: string[];
  description?: string;
}

interface UpdateMeetingRequest extends CreateMeetingRequest {
  teamsEventId: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Teams meeting function called:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get current user to use as organizer
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user profile to get email
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const userEmail = profile?.['Email ID'] || user.email;
    if (!userEmail) {
      throw new Error('User email not found');
    }

    // Get Microsoft Graph credentials
    const clientId = Deno.env.get('MICROSOFT_GRAPH_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_GRAPH_CLIENT_SECRET');
    const tenantId = Deno.env.get('MICROSOFT_GRAPH_TENANT_ID');

    if (!clientId || !clientSecret || !tenantId) {
      throw new Error('Microsoft Graph credentials not configured');
    }

    // Get access token
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('Token request failed:', tokenData);
      throw new Error(`Failed to get access token: ${tokenData.error_description}`);
    }

    const accessToken = tokenData.access_token;
    const { method } = req;
    const requestData = await req.json();

    if (method === 'POST') {
      // Create Teams event using specific user endpoint instead of /me
      const { title, startDateTime, endDateTime, participants, description } = requestData as CreateMeetingRequest;

      // Ensure participants is an array, default to empty array if undefined
      const safeParticipants = Array.isArray(participants) ? participants : [];

      const eventData = {
        subject: title,
        body: {
          contentType: 'HTML',
          content: description || '',
        },
        start: {
          dateTime: startDateTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'UTC',
        },
        attendees: safeParticipants.map((email: string) => ({
          emailAddress: {
            address: email,
            name: email.split('@')[0],
          },
          type: 'required',
        })),
        isOnlineMeeting: true,
        onlineMeetingProvider: 'teamsForBusiness',
      };

      console.log('Creating Teams event with data:', JSON.stringify(eventData, null, 2));
      console.log('Using organizer email:', userEmail);

      // Use the specific user's endpoint instead of /me
      const createResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${userEmail}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const eventResult = await createResponse.json();
      
      if (!createResponse.ok) {
        console.error('Create event failed:', eventResult);
        throw new Error(`Failed to create Teams event: ${eventResult.error?.message || 'Unknown error'}`);
      }

      console.log('Teams event created successfully:', eventResult.id);

      return new Response(JSON.stringify({
        success: true,
        eventId: eventResult.id,
        joinUrl: eventResult.onlineMeeting?.joinUrl || null,
        webLink: eventResult.webLink,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } else if (method === 'PUT') {
      // Update Teams event
      const { title, startDateTime, endDateTime, participants, description, teamsEventId } = requestData as UpdateMeetingRequest;

      // Ensure participants is an array, default to empty array if undefined
      const safeParticipants = Array.isArray(participants) ? participants : [];

      const updateData = {
        subject: title,
        body: {
          contentType: 'HTML',
          content: description || '',
        },
        start: {
          dateTime: startDateTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'UTC',
        },
        attendees: safeParticipants.map((email: string) => ({
          emailAddress: {
            address: email,
            name: email.split('@')[0],
          },
          type: 'required',
        })),
      };

      console.log('Updating Teams event:', teamsEventId);

      const updateResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${userEmail}/events/${teamsEventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!updateResponse.ok) {
        const errorResult = await updateResponse.json();
        console.error('Update event failed:', errorResult);
        throw new Error(`Failed to update Teams event: ${errorResult.error?.message || 'Unknown error'}`);
      }

      console.log('Teams event updated successfully');

      return new Response(JSON.stringify({
        success: true,
        message: 'Event updated successfully',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } else if (method === 'DELETE') {
      // Cancel Teams event
      const { teamsEventId } = requestData;

      if (!teamsEventId) {
        throw new Error('Teams event ID is required for cancellation');
      }

      console.log('Cancelling Teams event:', teamsEventId);

      const deleteResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${userEmail}/events/${teamsEventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        const errorResult = await deleteResponse.json();
        console.error('Delete event failed:', errorResult);
        throw new Error(`Failed to cancel Teams event: ${errorResult.error?.message || 'Unknown error'}`);
      }

      console.log('Teams event cancelled successfully');

      return new Response(JSON.stringify({
        success: true,
        message: 'Event cancelled successfully',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in create-teams-meeting function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
