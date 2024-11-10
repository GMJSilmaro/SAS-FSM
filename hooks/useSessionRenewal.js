import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { handleSessionError } from '../utils/middlewareClient';

export const useSessionRenewal = () => {
  const router = useRouter();
  const isRenewing = useRef(false);
  const lastRenewalTime = useRef(0);

  useEffect(() => {
    if (router.pathname.includes('/authentication')) {
      return;
    }

    const checkSession = async () => {
      const expiryTime = Cookies.get('B1SESSION_EXPIRY');
      
      if (!expiryTime) {
        handleSessionError(router);
        return;
      }

      const timeUntilExpiry = new Date(expiryTime).getTime() - Date.now();
      const timeSinceLastRenewal = Date.now() - lastRenewalTime.current;

      // Force logout if session has expired
      if (timeUntilExpiry <= 0) {
        handleSessionError(router);
        return;
      }

      // Only renew if:
      // 1. Less than 5 minutes remaining
      // 2. Not currently renewing
      // 3. Last renewal was more than 1 minute ago
      if (timeUntilExpiry < 5 * 60 * 1000 && 
          !isRenewing.current && 
          timeSinceLastRenewal > 60 * 1000) {
        try {
          isRenewing.current = true;
          console.log('🔄 Initiating session renewal...');

          const response = await fetch('/api/renewSAPB1Session', {
            method: 'POST',
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error('Session renewal failed');
          }

          const data = await response.json();
          if (data.success) {
            console.log('✅ Session renewed successfully');
            lastRenewalTime.current = Date.now();
            isRenewing.current = false;
          }
        } catch (error) {
          console.error('Session renewal error:', error);
          isRenewing.current = false;
          handleSessionError(router);
        }
      }
    };

    // Check every 30 seconds
    const intervalId = setInterval(checkSession, 30 * 1000);
    checkSession(); // Initial check

    return () => {
      clearInterval(intervalId);
      isRenewing.current = false;
    };
  }, [router]);
}; 