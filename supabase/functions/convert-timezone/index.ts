import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TimezoneConversionRequest {
  localDateTime: string; // Format: "YYYY-MM-DD HH:mm"
  timezone: string; // Format: "UTC+05:30"
  duration: number; // Duration in minutes
  operation: 'toUTC' | 'fromUTC';
}

interface TimezoneConversionResponse {
  utcStart: string;
  utcEnd: string;
  localStart?: string;
  localEnd?: string;
  debug: {
    input: any;
    offsetMinutes: number;
    conversion: string;
  };
}

// Parse timezone offset from string (e.g., "UTC+05:30" -> 330 minutes)
const parseTimezoneOffset = (timezoneString: string): number => {
  const match = timezoneString.match(/UTC([+-])(\d{1,2}):?(\d{0,2})/);
  if (!match) {
    throw new Error(`Invalid timezone format: ${timezoneString}`);
  }
  
  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2]);
  const minutes = parseInt(match[3] || '0');
  
  return sign * (hours * 60 + minutes);
};

// Convert local datetime to UTC
const convertToUTC = (localDateTime: string, timezoneOffset: number): Date => {
  // Parse local datetime (format: "YYYY-MM-DD HH:mm")
  const [datePart, timePart] = localDateTime.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Create date in local timezone
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  
  // Convert to UTC by subtracting the timezone offset
  const utcDate = new Date(localDate.getTime() - (timezoneOffset * 60 * 1000));
  
  return utcDate;
};

// Convert UTC datetime to local
const convertFromUTC = (utcDateTime: string, timezoneOffset: number): Date => {
  const utcDate = new Date(utcDateTime);
  
  // Convert to local by adding the timezone offset
  const localDate = new Date(utcDate.getTime() + (timezoneOffset * 60 * 1000));
  
  return localDate;
};

const handler = async (req: Request): Promise<Response> => {
  console.log('🌍 Timezone conversion function called:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { localDateTime, timezone, duration, operation } = await req.json() as TimezoneConversionRequest;
    
    console.log('🔄 Timezone Conversion Request:', {
      localDateTime,
      timezone,
      duration,
      operation
    });

    const timezoneOffset = parseTimezoneOffset(timezone);
    
    if (operation === 'toUTC') {
      // Convert local time to UTC for storage
      const utcStartDate = convertToUTC(localDateTime, timezoneOffset);
      const utcEndDate = new Date(utcStartDate.getTime() + (duration * 60 * 1000));
      
      const response: TimezoneConversionResponse = {
        utcStart: utcStartDate.toISOString(),
        utcEnd: utcEndDate.toISOString(),
        debug: {
          input: { localDateTime, timezone, duration },
          offsetMinutes: timezoneOffset,
          conversion: `Local ${localDateTime} (${timezone}) → UTC ${utcStartDate.toISOString()}`
        }
      };
      
      console.log('✅ Local → UTC Conversion:', response);
      
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
      
    } else if (operation === 'fromUTC') {
      // Convert UTC time from storage to local for display
      const localStartDate = convertFromUTC(localDateTime, timezoneOffset);
      const localEndDate = new Date(localStartDate.getTime() + (duration * 60 * 1000));
      
      const response: TimezoneConversionResponse = {
        utcStart: localDateTime, // Input was UTC
        utcEnd: new Date(new Date(localDateTime).getTime() + (duration * 60 * 1000)).toISOString(),
        localStart: localStartDate.toISOString(),
        localEnd: localEndDate.toISOString(),
        debug: {
          input: { utcDateTime: localDateTime, timezone, duration },
          offsetMinutes: timezoneOffset,
          conversion: `UTC ${localDateTime} → Local ${localStartDate.toISOString()} (${timezone})`
        }
      };
      
      console.log('✅ UTC → Local Conversion:', response);
      
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    throw new Error(`Invalid operation: ${operation}`);
    
  } catch (error: any) {
    console.error('❌ Timezone conversion error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Timezone conversion failed',
      details: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);