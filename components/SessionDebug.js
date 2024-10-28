import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

const SessionDebug = () => {
  const [sessionInfo, setSessionInfo] = useState({});

  useEffect(() => {
    const updateInfo = () => {
      const b1Session = Cookies.get('B1SESSION');
      const b1SessionExpiry = Cookies.get('B1SESSION_EXPIRY');
      
      setSessionInfo({
        hasB1Session: !!b1Session,
        expiryTime: b1SessionExpiry ? new Date(b1SessionExpiry).toLocaleString() : 'No expiry',
        timeUntilExpiry: b1SessionExpiry 
          ? Math.floor((new Date(b1SessionExpiry).getTime() - Date.now()) / 1000 / 60)
          : 'N/A'
      });
    };

    updateInfo();
    const interval = setInterval(updateInfo, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-sm">
      <h3 className="font-bold mb-2">Session Debug</h3>
      <pre>{JSON.stringify(sessionInfo, null, 2)}</pre>
    </div>
  );
};

export default SessionDebug;