import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

export function useAdminStatus() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  const checkAdminStatus = useCallback(async () => {
    if (!isLoaded || !user || hasChecked) {
      return;
    }

    try {
      const response = await fetch('/api/profile/check-admin');
      
      if (response.ok) {
        const data = await response.json();
        const adminStatus = data.isAdmin || false;
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
      setHasChecked(true);
    }
  }, [isLoaded, user, hasChecked]);

  useEffect(() => {
    if (!isLoaded) {
      // Keep loading true while Clerk loads
      setIsLoading(true);
      return;
    }
    
    if (!user) {
      // No user, not admin, but done loading
      setIsAdmin(false);
      setIsLoading(false);
      setHasChecked(false);
      return;
    }

    if (!hasChecked) {
      checkAdminStatus();
    }
  }, [isLoaded, user, hasChecked, checkAdminStatus]);

  return { isAdmin, isLoading };
}
