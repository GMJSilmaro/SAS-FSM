import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    isLoading: true,
    companyInfo: null,
    error: null
  });

  useEffect(() => {
    const fetchCompanyInfo = async () => {
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

        setSettings({
          isLoading: false,
          companyInfo: companyData,
          error: null
        });
      } catch (error) {
        console.error('Error fetching company settings:', error);
        setSettings({
          isLoading: false,
          companyInfo: null,
          error: 'Failed to load company information'
        });
      }
    };

    fetchCompanyInfo();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 