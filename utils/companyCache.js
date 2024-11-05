import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const CACHE_KEY = 'companyDetails';
const CACHE_TIMESTAMP_KEY = 'companyDetailsTimestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let cachedCompanyDetails = null;
let lastFetchTime = null;

export async function getCompanyDetails() {
  // Return cached data if it's still valid
  if (cachedCompanyDetails && lastFetchTime && (Date.now() - lastFetchTime < CACHE_DURATION)) {
    return cachedCompanyDetails;
  }

  try {
    // Try to get from both documents to ensure data consistency
    const companyDetailsRef = doc(db, 'companyDetails', 'companyInfo');
    const companyInfoRef = doc(db, 'companyInfo', 'default');
    
    const [detailsSnap, infoSnap] = await Promise.all([
      getDoc(companyDetailsRef),
      getDoc(companyInfoRef)
    ]);

    // Prefer companyDetails data, fall back to companyInfo
    const companyData = detailsSnap.exists() 
      ? detailsSnap.data() 
      : infoSnap.exists() 
        ? infoSnap.data() 
        : null;

    // Update cache
    cachedCompanyDetails = companyData;
    lastFetchTime = Date.now();

    return companyData;
  } catch (error) {
    console.error('Error fetching company details:', error);
    return null;
  }
} 