import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface FeedItem {
  id: string;
  type: 'deal' | 'contact' | 'meeting';
  title: string;
  description: string;
  created_by: string | null;
  created_at: string;
  amount?: number;
  customer?: string;
  modified_at?: string;
}

export const useFeedsData = () => {
  const { data: feeds, isLoading, error } = useQuery({
    queryKey: ['feeds-data'],
    queryFn: async (): Promise<FeedItem[]> => {
      console.log('Fetching feeds data...');
      
      // Get recent deals
      const { data: dealsData } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      console.log('Deals data:', dealsData);

      // Get recent contacts
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      console.log('Contacts data:', contactsData);

      // Get recent meetings
      const { data: meetingsData } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      console.log('Meetings data:', meetingsData);

      const feedItems: FeedItem[] = [];

      // Process deals
      dealsData?.forEach(deal => {
        feedItems.push({
          id: deal.id,
          type: 'deal',
          title: `Deal: ${deal.deal_name}`,
          description: `Stage: ${deal.stage}`,
          created_by: deal.user_id,
          created_at: deal.created_at,
          amount: deal.total_contract_value || deal.close_amount,
          customer: deal.company_name,
          modified_at: deal.updated_at
        });
      });

      // Process contacts
      contactsData?.forEach(contact => {
        feedItems.push({
          id: contact.id,
          type: 'contact',
          title: `Contact: ${contact.contact_name}`,
          description: `Company: ${contact.company}`,
          created_by: contact.user_id,
          created_at: contact.created_at,
          customer: contact.position,
          modified_at: contact.updated_at
        });
      });

      // Process meetings
      meetingsData?.forEach(meeting => {
        feedItems.push({
          id: meeting.id,
          type: 'meeting',
          title: `Meeting: ${meeting.title}`,
          description: meeting.description || '',
          created_by: meeting.user_id,
          created_at: meeting.created_at,
          customer: `${meeting.start_time} - ${meeting.location}`,
          modified_at: meeting.updated_at
        });
      });

      // Sort by creation date
      feedItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('Final feed items:', feedItems);
      
      return feedItems.slice(0, 50); // Return top 50 items
    },
  });

  const revertChange = async (feedId: string, feedType: string) => {
    try {
      console.log(`Reverting ${feedType} with ID: ${feedId}`);
      
      if (feedType === 'deal') {
        const { error } = await supabase
          .from('deals')
          .delete()
          .eq('id', feedId);
        
        if (error) throw error;
      } else if (feedType === 'contact') {
        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', feedId);
        
        if (error) throw error;
      } else if (feedType === 'meeting') {
        const { error } = await supabase
          .from('meetings')
          .delete()
          .eq('id', feedId);
        
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error reverting change:', error);
      return false;
    }
  };

  return { feeds, isLoading, error, revertChange };
};
