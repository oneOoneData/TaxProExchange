import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export function useAdminStatus() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!isLoaded || !user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/profile/check-admin');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin || false);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminStatus();
  }, [user, isLoaded]);

  return { isAdmin, isLoading };
}
