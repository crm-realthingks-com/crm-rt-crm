
import { useMemo } from 'react';
import { useUserDisplayNames } from './useUserDisplayNames';

export const useLeadOwnerDisplayName = (leadOwnerId: string | null | undefined) => {
  const userIds = useMemo(() => leadOwnerId ? [leadOwnerId] : [], [leadOwnerId]);
  const { displayNames, loading } = useUserDisplayNames(userIds);
  
  const displayName = useMemo(() => {
    if (!leadOwnerId) return '';
    return displayNames[leadOwnerId] || 'Loading...';
  }, [leadOwnerId, displayNames]);

  return { displayName, loading };
};
