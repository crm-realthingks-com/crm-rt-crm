
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting admin-delete-user function');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user.user) {
      console.error('Invalid token or user not found:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token or unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.user.email);

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Attempting to delete user:', userId);

    // Delete all related data first to avoid foreign key constraints
    try {
      // Delete from all tables that might reference this user
      const tablesToClean = [
        'profiles',
        'deals', 
        'contacts',
        'leads',
        'meetings',
        'meeting_outcomes',
        'dashboard_preferences',
        'yearly_revenue_targets'
      ];

      for (const table of tablesToClean) {
        try {
          // Try different possible foreign key column names
          const possibleColumns = ['id', 'user_id', 'created_by', 'modified_by', 'contact_owner'];
          
          for (const column of possibleColumns) {
            const { error } = await supabaseAdmin
              .from(table)
              .delete()
              .eq(column, userId);
            
            if (!error) {
              console.log(`Successfully cleaned ${table}.${column} for user ${userId}`);
            }
          }
        } catch (tableError) {
          console.warn(`Error cleaning table ${table}:`, tableError);
          // Continue with other tables even if one fails
        }
      }
    } catch (cleanupError) {
      console.warn('Error during data cleanup:', cleanupError);
      // Don't fail the whole operation, continue with user deletion
    }

    // Now attempt to delete the user from auth
    let retryCount = 0;
    const maxRetries = 3;
    let deleteError = null;

    while (retryCount < maxRetries) {
      try {
        console.log(`Delete attempt ${retryCount + 1} for user ${userId}`);
        
        const { data: deletedUser, error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
          deleteError = error;
          console.error(`Delete attempt ${retryCount + 1} failed:`, error);
          
          // If it's a database constraint error, wait a bit and retry
          if (error.message?.includes('Database error') && retryCount < maxRetries - 1) {
            console.log(`Waiting 1 second before retry ${retryCount + 2}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            retryCount++;
            continue;
          }
          
          throw error;
        }

        console.log('User deleted successfully from auth');
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'User deleted successfully',
            user: deletedUser 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        deleteError = error;
        retryCount++;
        
        if (retryCount < maxRetries) {
          console.log(`Retry ${retryCount} after error:`, error);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // If we get here, all retries failed
    console.error('All delete attempts failed:', deleteError);
    return new Response(
      JSON.stringify({ 
        error: deleteError?.message || 'Failed to delete user after multiple attempts',
        details: deleteError,
        retries: maxRetries
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in admin-delete-user:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
