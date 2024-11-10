import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

const ActivityTracker = () => {
  const router = useRouter();
  const renewalInProgress = useRef(false);
  const lastRenewalTime = useRef(0);
  const CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes

  const checkAndRenewSession = useCallback(async () => {
    // Prevent concurrent renewals
    if (renewalInProgress.current) return;
    
    const now = Date.now();
    if (now - lastRenewalTime.current < CHECK_INTERVAL) return;

    try {
      // Check if session is close to expiry
      const expiryTime = new Date(Cookies.get('B1SESSION_EXPIRY')).getTime();
      const timeUntilExpiry = expiryTime - now;
      const fiveMinutes = 5 * 60 * 1000;
      
      if (timeUntilExpiry <= fiveMinutes && timeUntilExpiry > 0) {
        renewalInProgress.current = true;
        lastRenewalTime.current = now;

        const response = await fetch('/api/renewSAPB1Session', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentSession: Cookies.get('B1SESSION'),
            currentRouteId: Cookies.get('ROUTEID')
          })
        });

        if (!response.ok) {
          throw new Error('Session renewal failed');
        }

        // Session renewed successfully
        console.log('Session renewed successfully');
      }
    } catch (error) {
      console.error('Session renewal error:', error);
      toast.error('Session expired. Please login again.');
      router.push('/sign-in');
    } finally {
      renewalInProgress.current = false;
    }
  }, [router, CHECK_INTERVAL]); // Added CHECK_INTERVAL to dependencies

  // Check on mount and interval
  useEffect(() => {
    checkAndRenewSession();
    const intervalId = setInterval(checkAndRenewSession, CHECK_INTERVAL);
    return () => clearInterval(intervalId);
  }, [checkAndRenewSession, CHECK_INTERVAL]); // Added CHECK_INTERVAL to dependencies

  // Check on tab focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndRenewSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAndRenewSession]);

  return null;
};

export default ActivityTracker;
