// hooks/useWorkers.js
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const CACHE_KEY = 'workers-cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const processWorkersData = (workersData) => {
    return workersData.map((doc, index) => ({
      id: doc.id,
      index: index + 1,
      ...doc.data(),
      joinDate: doc.data().timestamp ? new Date(doc.data().timestamp.toDate()) : new Date(),
    }));
  };

  const fetchWorkers = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check cache if not ignoring
      if (!forceRefresh) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setWorkers(data);
            setLoading(false);
            return;
          }
        }
      }

      // Fetch fresh data
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const workersData = processWorkersData(snapshot.docs);

      // Update cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: workersData,
        timestamp: Date.now()
      }));

      console.log('Fetched workers:', workersData); // Debug log

      setWorkers(workersData);
    } catch (err) {
      console.error("Error fetching workers:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
  }, []);

  return {
    workers,
    loading,
    error,
    fetchWorkers,
    clearCache
  };
};