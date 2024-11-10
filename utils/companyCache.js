import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const COMPANY_CACHE_KEY = 'companyDetails';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const getCompanyDetails = async () => {
  try {
    // Check localStorage first
    const cachedData = localStorage.getItem(COMPANY_CACHE_KEY);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      
      // Check if cache is still valid
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }

    // If no valid cache, fetch from Firestore
    const companyDoc = await getDoc(doc(db, 'company', 'details'));
    if (companyDoc.exists()) {
      const companyData = companyDoc.data();
      
      // Cache the result
      localStorage.setItem(COMPANY_CACHE_KEY, JSON.stringify({
        data: companyData,
        timestamp: Date.now()
      }));
      
      return companyData;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching company details:', error);
    return null;
  }
}; 