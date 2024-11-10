// hooks/useWorkers.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { collection, getDocs, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';

export const useWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  // Setup real-time listener
  useEffect(() => {
    console.log('Setting up Firestore listener...');
    setLoading(true);

    try {
      const workersRef = collection(db, 'users');
      const q = query(workersRef);

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          console.log('Received Firestore update:', snapshot.size, 'documents');
          
          const workersData = snapshot.docs.map((doc, index) => ({
            ...doc.data(),
            id: doc.id,
            index: index + 1
          }));

          console.log('Processed workers data:', workersData);
          setWorkers(workersData);
          setLoading(false);
        },
        (error) => {
          console.error('Firestore error:', error);
          setError(error);
          setLoading(false);
        }
      );

      unsubscribeRef.current = unsubscribe;
      
      // Cleanup function
      return () => {
        console.log('Cleaning up Firestore listener...');
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (err) {
      console.error('Error in useWorkers setup:', err);
      setError(err);
      setLoading(false);
    }
  }, []); // Empty dependency array for single setup

  const fetchWorkers = useCallback(async (force = false) => {
    console.log('Manual fetch triggered, force:', force);
    setLoading(true);

    try {
      const workersRef = collection(db, 'workers');
      const snapshot = await getDocs(workersRef);
      
      console.log('Fetch response:', snapshot.size, 'documents');
      
      const workersData = snapshot.docs.map((doc, index) => ({
        ...doc.data(),
        id: doc.id,
        index: index + 1
      }));

      console.log('Fetched workers data:', workersData);
      setWorkers(workersData);
      setError(null);
      return workersData;
    } catch (err) {
      console.error('Error fetching workers:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    workers,
    loading,
    error,
    fetchWorkers
  };
};