import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export function useAdminStatus() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Debug: Log state changes
  console.log('🔍 useAdminStatus: State changed:', { isAdmin, isLoading });
  
  // Track when isAdmin actually changes
  useEffect(() => {
    console.log('🔍 useAdminStatus: isAdmin state changed to:', isAdmin);
  }, [isAdmin]);

  useEffect(() => {
    async function checkAdminStatus() {
      console.log('🔍 useAdminStatus: Checking admin status', { isLoaded, user: !!user });
      
      if (!isLoaded || !user) {
        console.log('🔍 useAdminStatus: User not loaded or not signed in');
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 useAdminStatus: Fetching admin status...');
        const response = await fetch('/api/profile/check-admin');
        console.log('🔍 useAdminStatus: Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 useAdminStatus: Response data:', data);
          const adminStatus = data.isAdmin || false;
          console.log('🔍 useAdminStatus: Setting admin status to:', adminStatus);
          console.log('🔍 useAdminStatus: About to call setIsAdmin with:', adminStatus);
          setIsAdmin(adminStatus);
          console.log('🔍 useAdminStatus: setIsAdmin called');
        } else {
          console.log('🔍 useAdminStatus: Response not ok, status:', response.status);
          console.log('🔍 useAdminStatus: Setting admin status to FALSE due to error');
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('🔍 useAdminStatus: Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminStatus();
  }, [user, isLoaded]);

  return { isAdmin, isLoading };
}
