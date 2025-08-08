
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LeadImportRow {
  'Lead Name': string;
  'Company Name': string;
  'Position': string;
  'Email': string;
  'Phone Number': string;
  'LinkedIn': string;
  'Website': string;
  'Lead Source': string;
  'Industry': string;
  'Region': string;
  'Status': string;
  'Description': string;
  'Lead Owner': string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    const { action, data } = await req.json()

    if (action === 'export') {
      console.log('Exporting leads for user:', user.id)
      
      const { data: leads, error } = await supabaseClient
        .from('leads')
        .select('*')
        .order('created_time', { ascending: false })

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ success: true, data: leads }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (action === 'import') {
      console.log('Importing leads for user:', user.id)
      
      const { csvData } = data
      if (!csvData || !Array.isArray(csvData)) {
        throw new Error('Invalid CSV data provided')
      }

      // Valid dropdown values matching the Add Lead form
      const validSources = ['Website', 'LinkedIn', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Event', 'Partner', 'Advertisement', 'Other']
      const validIndustries = ['Automotive', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Real Estate', 'Other']
      const validRegions = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Australia', 'Other']
      const validStatuses = ['New', 'Contacted', 'Qualified']

      const validateDropdownValue = (value: string, validValues: string[]): string => {
        if (!value || value.trim() === '') return ''
        const trimmedValue = value.trim()
        const matchedValue = validValues.find(v => v.toLowerCase() === trimmedValue.toLowerCase())
        return matchedValue || ''
      }

      let success = 0
      let duplicates = 0
      let errors = 0
      const messages: string[] = []

      for (let i = 0; i < csvData.length; i++) {
        const rowData = csvData[i] as LeadImportRow
        
        try {
          // Map to database fields exactly as they appear in the Add Lead form
          const lead = {
            lead_name: rowData['Lead Name'] || '',
            company_name: rowData['Company Name'] || '',
            position: rowData['Position'] || null,
            email: rowData['Email'] || null,
            phone_no: rowData['Phone Number'] || null,
            linkedin: rowData['LinkedIn'] || null,
            website: rowData['Website'] || null,
            contact_source: validateDropdownValue(rowData['Lead Source'] || '', validSources) || null,
            industry: validateDropdownValue(rowData['Industry'] || '', validIndustries) || null,
            country: validateDropdownValue(rowData['Region'] || '', validRegions) || null,
            status: validateDropdownValue(rowData['Status'] || 'New', validStatuses) || 'New',
            description: rowData['Description'] || null,
            created_by: user.id,
            modified_by: user.id,
            contact_owner: user.id
          }

          // Validate required fields
          if (!lead.lead_name || lead.lead_name.trim() === '') {
            messages.push(`Row ${i + 1}: Lead Name is required`)
            errors++
            continue
          }

          if (!lead.company_name || lead.company_name.trim() === '') {
            messages.push(`Row ${i + 1}: Company Name is required`)
            errors++
            continue
          }

          // Check for duplicates
          const { data: existingLeads } = await supabaseClient
            .from('leads')
            .select('id')
            .eq('lead_name', lead.lead_name)
            .eq('company_name', lead.company_name)
            .limit(1)

          if (existingLeads && existingLeads.length > 0) {
            duplicates++
            continue
          }

          // Insert lead
          const { error: insertError } = await supabaseClient
            .from('leads')
            .insert([lead])

          if (insertError) {
            console.error(`Row ${i + 1}: Insert error:`, insertError)
            messages.push(`Row ${i + 1}: ${insertError.message}`)
            errors++
          } else {
            success++
          }

        } catch (rowError: any) {
          console.error(`Row ${i + 1}: Processing error:`, rowError)
          messages.push(`Row ${i + 1}: ${rowError.message}`)
          errors++
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          result: {
            success,
            duplicates,
            errors,
            messages
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    throw new Error('Invalid action specified')

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
