import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export function useAdminStatus() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
          setIsAdmin(data.isAdmin || false);
        } else {
          console.log('🔍 useAdminStatus: Response not ok');
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('🔍 useAdminStatus: Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
        console.log('🔍 useAdminStatus: Final state:', { isAdmin: isAdmin, isLoading: false });
      }
    }

    checkAdminStatus();
  }, [user, isLoaded]);

  return { isAdmin, isLoading };
}
