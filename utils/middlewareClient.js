import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

export async function logMiddlewareActivity(activity, path) {
  try {
    const response = await fetch('/api/logMiddlewareActivity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activity,
        timestamp: new Date().toISOString(),
        workerId: document.cookie.split(';')
          .find(c => c.trim().startsWith('workerId='))
          ?.split('=')[1] || 'UNKNOWN',
        path
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to log activity: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to log middleware activity:', error);
  }
}

export async function checkAndRenewSession() {
  try {
    const expiryTime = getSessionExpiryTime();
    if (!expiryTime) return;

    const timeRemaining = expiryTime - Date.now();
    
    // If less than 5 minutes remaining, renew session silently
    if (timeRemaining < 5 * 60 * 1000) {
      console.log('🔄 Silent session renewal initiated');
      const response = await fetch('/api/renewSAPB1Session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.error('❌ Silent session renewal failed');
        return;
      }

      const data = await response.json();
      console.log('✅ Session renewed silently', data);
    }

    return formatTimeRemaining(timeRemaining);
  } catch (error) {
    console.error('❌ Error in session check:', error);
  }
}

export async function validateSession() {
  console.log('🔍 Validating session...');
  
  // Add a small delay to allow cookies to be set
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    console.log('📊 Current cookies:', cookies);

    // Check for essential cookies only
    const essentialCookies = [
      'uid',
      'workerId',
      'email'
    ];

    const missingCookies = essentialCookies.filter(
      cookieName => !cookies[cookieName]
    );

    if (missingCookies.length > 0) {
      console.log('⚠️ Missing essential cookies:', missingCookies);
      return false;
    }

    // If we have essential cookies but missing B1SESSION, wait a bit longer
    if (!cookies.B1SESSION || !cookies.B1SESSION_EXPIRY) {
      console.log('⏳ Waiting for B1SESSION cookies...');
      return true; // Return true to prevent immediate logout
    }

    console.log('✅ All cookies present');
    return true;
  } catch (error) {
    console.error('❌ Session validation error:', error);
    return true; // Return true to prevent immediate logout on error
  }
}

export const formatTimeRemaining = (timeRemaining) => {
  if (timeRemaining <= 0) {
    console.log('⚠️ Timer reached zero or negative:', timeRemaining);
    return '00:00:00';
  }

  const totalSeconds = Math.floor(timeRemaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export function initializeSessionTimer(setTimeRemaining) {
  console.log('🎬 Initializing session timer...');
  
  const updateTimer = () => {
    // Get expiry from cookie instead of localStorage
    const expiryTime = Cookies.get('B1SESSION_EXPIRY');
    
    if (!expiryTime) {
      console.warn('⚠️ No session expiry cookie found');
      return;
    }

    const remaining = new Date(expiryTime).getTime() - Date.now();
    const formattedTime = formatTimeRemaining(remaining);
    
    console.log(`⏱️ Timer update: ${formattedTime} (${remaining}ms remaining)`);
    setTimeRemaining(formattedTime);
    
    // Update DOM attribute for global access
    document.body.setAttribute('data-session-time', formattedTime);
  };

  // Run initial update
  updateTimer();

  // Set up interval for updates
  const timerInterval = setInterval(updateTimer, 1000);

  // Cleanup
  return () => {
    console.log('🧹 Timer cleanup completed');
    clearInterval(timerInterval);
  };
}

export async function logActivity(activity, details = {}) {
  try {
    const baseUrl = window.location.origin; // Get the base URL of your application
    const response = await fetch(`${baseUrl}/api/logActivity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activity,
        timestamp: new Date().toISOString(),
        ...details
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to log activity: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Initialize session renewal check
export const initializeSessionRenewalCheck = (router) => {
  console.log('🚀 Initializing session renewal check');
  let isRenewing = false;
  
  const updateTimerDisplay = () => {
    const expiryTime = Cookies.get('B1SESSION_EXPIRY');
    
    if (!expiryTime) {
      console.warn('⚠️ No session expiry found');
      return;
    }

    const timeUntilExpiry = new Date(expiryTime).getTime() - Date.now();
    const formattedTime = formatTimeRemaining(timeUntilExpiry);
    document.body.setAttribute('data-session-time', formattedTime);
  };

  const checkSession = async () => {
    const expiryTime = Cookies.get('B1SESSION_EXPIRY');
    
    if (!expiryTime) {
      console.warn('⚠️ No session expiry found');
      return;
    }

    const timeUntilExpiry = new Date(expiryTime).getTime() - Date.now();

    // Check if renewal is needed and not already renewing
    if (timeUntilExpiry < 5 * 60 * 1000 && !isRenewing) {
      try {
        isRenewing = true;
        const toastId = toast.loading('Renewing session...', {
          position: 'bottom-right'
        });
        
        const response = await fetch('/api/renewSAPB1Session', {
          method: 'POST',
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Session renewal failed');
        }

        const data = await response.json();
        if (data.success) {
          toast.success('Session renewed successfully', {
            id: toastId,
            position: 'bottom-right',
            duration: 3000,
            icon: '✅',
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
          });
          
          setTimeout(() => {
            isRenewing = false;
          }, 60 * 1000);
        }
      } catch (error) {
        console.error('❌ Session renewal error:', error);
        toast.error('Failed to renew session', {
          position: 'bottom-right',
          duration: 3000,
          icon: '❌',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
        isRenewing = false;
        handleSessionError(router);
      }
    }
  };

  // Update display every second
  const displayInterval = setInterval(updateTimerDisplay, 1000);
  
  // Check session every 30 seconds
  const checkInterval = setInterval(checkSession, 30 * 1000);
  
  // Initial calls
  updateTimerDisplay();
  checkSession();

  // Return cleanup function
  return () => {
    console.log('🧹 Cleaning up intervals');
    clearInterval(displayInterval);
    clearInterval(checkInterval);
  };
};

// Handle session errors
export const handleSessionError = (router) => {
  console.log('🚨 Handling session error');
  
  // Clear all cookies
  const cookies = document.cookie.split(';');
  cookies.forEach(cookie => {
    const [name] = cookie.split('=');
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });

  // Force reload to trigger middleware
  window.location.href = '/sign-in';
};

// Update session time display
export const updateSessionTimeDisplay = (timeRemaining) => {
  const formattedTime = formatTimeRemaining(timeRemaining);
  document.body.setAttribute('data-session-time', formattedTime);
};