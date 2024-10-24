import { useEffect } from 'react';
import { setCookie } from 'cookies-next';

const ActivityTracker = () => {
  useEffect(() => {
    let timeoutId;

    const updateLastActivity = () => {
      setCookie('LAST_ACTIVITY', Date.now().toString(), {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
      });
    };

    const resetTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(updateLastActivity, 1000); // Debounce to avoid excessive updates
    };

    // Track mouse movement
    window.addEventListener('mousemove', resetTimer);
    // Track keyboard activity
    window.addEventListener('keydown', resetTimer);

    // Initial update
    updateLastActivity();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return null;
};

export default ActivityTracker;
