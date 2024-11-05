import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { format } from 'date-fns';

const CACHE_KEY = 'notifications';
const CACHE_TIMESTAMP_KEY = 'notificationsTimestamp';
const CACHE_DURATION = 300000; // 5 minutes

const formatTimestamp = (timestamp) => {
  if (!timestamp) return Date.now();
  
  // If it's a Firestore timestamp
  if (timestamp?.toMillis) {
    return timestamp.toMillis();
  }
  
  // If it's already a number (milliseconds)
  if (typeof timestamp === 'number') {
    return timestamp;
  }
  
  // If it's a date object
  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }
  
  // Default fallback
  return Date.now();
};

// Helper function to convert Firestore timestamp to serializable format
const serializeNotification = (notification) => {
  try {
    let timestamp;
    console.log('Serializing notification timestamp:', notification.timestamp);

    if (!notification.timestamp) {
      console.log('No timestamp found, using current time');
      timestamp = Date.now();
    } else if (notification.timestamp?.toDate) {
      timestamp = notification.timestamp.toDate().getTime();
    } else if (notification.timestamp?.seconds) {
      timestamp = notification.timestamp.seconds * 1000;
    } else if (typeof notification.timestamp === 'number') {
      timestamp = notification.timestamp;
    } else {
      console.log('Using fallback timestamp');
      timestamp = Date.now();
    }

    return {
      ...notification,
      timestamp
    };
  } catch (error) {
    console.error('Error serializing notification:', error);
    return {
      ...notification,
      timestamp: Date.now()
    };
  }
};

// Helper function to convert serialized timestamp back to Date
const deserializeNotification = (notification) => {
  try {
    const timestamp = notification.timestamp;
    console.log('Deserializing timestamp:', timestamp);

    return {
      ...notification,
      timestamp: {
        toDate: () => new Date(timestamp),
        toMillis: () => timestamp,
        seconds: Math.floor(timestamp / 1000)
      }
    };
  } catch (error) {
    console.error('Error deserializing notification:', error);
    const fallbackTime = Date.now();
    return {
      ...notification,
      timestamp: {
        toDate: () => new Date(fallbackTime),
        toMillis: () => fallbackTime,
        seconds: Math.floor(fallbackTime / 1000)
      }
    };
  }
};

export const getNotifications = async (db, workerId, limitCount = 20) => {
  try {
    // Check localStorage first
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cachedData && cachedTimestamp) {
      const isExpired = Date.now() - parseInt(cachedTimestamp) > CACHE_DURATION;
      if (!isExpired) {
        console.log('Using cached notifications');
        const parsedData = JSON.parse(cachedData);
        return parsedData.map(deserializeNotification);
      }
    }

    // If no cache or expired, fetch from Firebase
    console.log('Fetching fresh notifications from Firebase');
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("workerId", "in", [workerId, "all"]),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Serialize before caching
    const serializedNotifications = notifications.map(serializeNotification);
    localStorage.setItem(CACHE_KEY, JSON.stringify(serializedNotifications));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const updateNotificationCache = (notifications) => {
  try {
    const serializedNotifications = notifications.map(serializeNotification);
    localStorage.setItem(CACHE_KEY, JSON.stringify(serializedNotifications));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error updating notification cache:', error);
  }
};

export const invalidateNotificationCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Error invalidating notification cache:', error);
  }
};

export const getUnreadCount = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const notifications = JSON.parse(cachedData).map(deserializeNotification);
      return notifications.filter(n => !n.read).length;
    }
    return 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}; 