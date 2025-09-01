import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';
import { format as formatDate, addMinutes, isAfter } from 'date-fns';

// IANA timezone options for the form with formatted display
export const IANA_TIMEZONES = [
  { label: 'UTC-10:00 (HST)', value: 'Pacific/Honolulu' },
  { label: 'UTC-09:00 (AKST)', value: 'America/Anchorage' },
  { label: 'UTC-08:00 (PST)', value: 'America/Los_Angeles' },
  { label: 'UTC-07:00 (MST)', value: 'America/Denver' },
  { label: 'UTC-06:00 (CST)', value: 'America/Chicago' },
  { label: 'UTC-05:00 (EST)', value: 'America/New_York' },
  { label: 'UTC-04:00 (AST)', value: 'America/Halifax' },
  { label: 'UTC-03:30 (NST)', value: 'America/St_Johns' },
  { label: 'UTC-03:00 (BRT)', value: 'America/Sao_Paulo' },
  { label: 'UTC+00:00 (GMT)', value: 'Europe/London' },
  { label: 'UTC+01:00 (CET)', value: 'Europe/Paris' },
  { label: 'UTC+01:00 (CET)', value: 'Europe/Berlin' },
  { label: 'UTC+02:00 (EET)', value: 'Europe/Athens' },
  { label: 'UTC+03:00 (MSK)', value: 'Europe/Moscow' },
  { label: 'UTC+04:00 (GST)', value: 'Asia/Dubai' },
  { label: 'UTC+05:30 (IST)', value: 'Asia/Kolkata' },
  { label: 'UTC+08:00 (CST)', value: 'Asia/Shanghai' },
  { label: 'UTC+09:00 (JST)', value: 'Asia/Tokyo' },
  { label: 'UTC+11:00 (AEDT)', value: 'Australia/Sydney' },
  { label: 'UTC+13:00 (NZDT)', value: 'Pacific/Auckland' },
];

// Default timezone (EET)
export const DEFAULT_TIMEZONE = 'Europe/Athens';

/**
 * Get the browser's IANA timezone
 */
export const getBrowserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Convert local date and time to UTC using IANA timezone
 */
export const convertLocalToUTC = (
  date: Date,
  time: string,
  timezone: string
): { utcStart: Date; utcEnd: Date } => {
  // Parse time string (HH:mm format)
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create local datetime in the specified timezone
  const localDateTime = new Date(date);
  localDateTime.setHours(hours, minutes, 0, 0);
  
  // Convert to UTC using date-fns-tz
  const utcStart = fromZonedTime(localDateTime, timezone);
  
  return {
    utcStart,
    utcEnd: utcStart // End will be calculated based on duration
  };
};

/**
 * Convert UTC datetime back to local timezone
 */
export const convertUTCToLocal = (
  utcDateTime: Date,
  timezone: string
): { localDate: Date; timeString: string } => {
  // Convert UTC to zoned time
  const localDateTime = toZonedTime(utcDateTime, timezone);
  
  // Extract date and time components
  const localDate = new Date(localDateTime.getFullYear(), localDateTime.getMonth(), localDateTime.getDate());
  const timeString = formatDate(localDateTime, 'HH:mm');
  
  return {
    localDate,
    timeString
  };
};

/**
 * Check if a local datetime is in the past
 */
export const isLocalDateTimeInPast = (
  date: Date,
  time: string,
  timezone: string
): boolean => {
  const { utcStart } = convertLocalToUTC(date, time, timezone);
  return !isAfter(utcStart, new Date());
};

/**
 * Format datetime with timezone info for display
 */
export const formatDateTimeWithTimezone = (
  utcDateTime: Date,
  timezone: string,
  duration: number
): string => {
  const { localDate, timeString } = convertUTCToLocal(utcDateTime, timezone);
  const endTime = toZonedTime(addMinutes(utcDateTime, duration), timezone);
  const endTimeString = formatDate(endTime, 'HH:mm');
  
  const formattedDate = formatDate(localDate, 'MMM dd, yyyy');
  const timezoneAbbr = format(utcDateTime, 'zzz', { timeZone: timezone });
  
  return `${formattedDate} · ${timeString} - ${endTimeString} (${timezoneAbbr})`;
};

/**
 * Generate timezone display string in format: UTC±HH:MM (Abbreviation)
 */
export const generateTimezoneDisplay = (timezone: string): string => {
  try {
    const now = new Date();
    const utcTime = now.getTime();
    const localTime = new Date(now.toLocaleString("en-US", { timeZone: timezone })).getTime();
    const offsetMs = localTime - utcTime;
    const offsetHours = Math.floor(Math.abs(offsetMs) / (1000 * 60 * 60));
    const offsetMinutes = Math.floor((Math.abs(offsetMs) % (1000 * 60 * 60)) / (1000 * 60));
    const sign = offsetMs >= 0 ? '+' : '-';
    
    // Get timezone abbreviation
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const abbr = parts.find(part => part.type === 'timeZoneName')?.value || timezone.split('/').pop()?.replace('_', ' ') || 'UTC';
    
    return `UTC${sign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')} (${abbr})`;
  } catch (error) {
    console.error('Error generating timezone display:', error);
    return timezone;
  }
};

/**
 * Get next available time slot (30-minute intervals)
 */
export const getNextAvailableTimeSlot = (
  date?: Date,
  timezone?: string
): string => {
  const now = new Date();
  const targetDate = date || now;
  const tz = timezone || getBrowserTimezone();
  
  // Convert current time to target timezone
  const localNow = toZonedTime(now, tz);
  const targetLocalDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const todayLocalDate = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
  
  // If target date is today
  if (targetLocalDate.getTime() === todayLocalDate.getTime()) {
    const currentHour = localNow.getHours();
    const currentMinute = localNow.getMinutes();
    
    // Round up to next 30-minute interval
    let nextMinute = currentMinute < 30 ? 30 : 0;
    let nextHour = currentMinute < 30 ? currentHour : currentHour + 1;
    
    // Handle hour overflow
    if (nextHour >= 24) {
      nextHour = 9; // Start at 9 AM for next day
      nextMinute = 0;
    }
    
    return `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
  }
  
  // For future dates, start at 9:00 AM
  return "09:00";
};

/**
 * Generate time slots for a day (30-minute intervals)
 */
export const generateTimeSlots = (): string[] => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
};

/**
 * Get available time slots for a specific date and timezone
 */
export const getAvailableTimeSlots = (
  selectedDate: Date,
  timezone: string
): string[] => {
  const allSlots = generateTimeSlots();
  const now = new Date();
  const localNow = toZonedTime(now, timezone);
  const selectedLocalDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const todayLocalDate = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
  
  // If selected date is today, filter out past slots
  if (selectedLocalDate.getTime() === todayLocalDate.getTime()) {
    return allSlots.filter(timeString => {
      return !isLocalDateTimeInPast(selectedDate, timeString, timezone);
    });
  }
  
  // For future dates, all slots are available
  return allSlots;
};

/**
 * Check for meeting conflicts in a time range
 */
export const checkMeetingConflicts = (
  meetings: any[],
  startTime: Date,
  endTime: Date,
  excludeMeetingId?: string
): boolean => {
  return meetings.some(meeting => {
    if (excludeMeetingId && meeting.id === excludeMeetingId) return false;
    
    const meetingStart = new Date(meeting.start_time_utc || meeting.start_datetime);
    const meetingEnd = new Date(meeting.end_time_utc || meeting.end_datetime);
    
    // Check for overlap
    return (startTime < meetingEnd && endTime > meetingStart);
  });
};

/**
 * Suggest next available slot after conflicts
 */
export const suggestNextAvailableSlot = (
  meetings: any[],
  preferredStart: Date,
  duration: number,
  timezone: string
): { date: Date; time: string } | null => {
  const localPreferred = toZonedTime(preferredStart, timezone);
  let currentSlot = new Date(localPreferred);
  
  // Try slots for next 7 days
  for (let day = 0; day < 7; day++) {
    const dayToCheck = new Date(currentSlot);
    dayToCheck.setDate(dayToCheck.getDate() + day);
    
    const availableSlots = getAvailableTimeSlots(dayToCheck, timezone);
    
    for (const timeSlot of availableSlots) {
      const { utcStart } = convertLocalToUTC(dayToCheck, timeSlot, timezone);
      const utcEnd = addMinutes(utcStart, duration);
      
      if (!checkMeetingConflicts(meetings, utcStart, utcEnd)) {
        return {
          date: dayToCheck,
          time: timeSlot
        };
      }
    }
  }
  
  return null;
};