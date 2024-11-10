import { Fragment, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { GeeksSEO } from "widgets";
import Link from 'next/link';
import { GKTippy } from "widgets";
import { performGlobalSearch } from '../../utils/searchUtils';
import { db } from '../../firebase';
import { ChevronRight, Mail, Search, WifiOff } from 'lucide-react';

const SearchPage = () => {
  const router = useRouter();
  const { q: searchQuery } = router.query;
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const categoryConfig = {
    customer: {
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      highlightBg: '#DBEAFE',
      highlightText: '#2563EB',
      icon: 'fe-user',
      label: 'Customers'
    },
    worker: {
      color: '#10B981',
      bgColor: '#ECFDF5',
      highlightBg: '#D1FAE5',
      highlightText: '#059669',
      icon: 'fe-briefcase',
      label: 'Workers'
    },
    job: {
      color: '#F59E0B',
      bgColor: '#FFFBEB',
      highlightBg: '#FEF3C7',
      highlightText: '#D97706',
      icon: 'fe-clipboard',
      label: 'Jobs'
    },
    followUp: {
      color: '#EF4444',
      bgColor: '#FEF2F2',
      highlightBg: '#FEE2E2',
      highlightText: '#DC2626',
      icon: 'fe-bell',
      label: 'Follow Ups'
    }
  };

   // Helper function to get category config safely
   const getCategoryConfig = (type) => {
    return categoryConfig[type] || {
      color: '#6b7280',
      bgColor: '#f3f4f6',
      highlightBg: '#f9fafb',
      highlightText: '#374151',
      icon: 'fe-file'
    };
  };

  const getTypeLabel = (type) => {
    return categoryConfig[type]?.label || type;
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine); // Set initial state

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery) {
        setSearchResults({ results: [], totalCount: 0 });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const results = await performGlobalSearch(db, searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults({ results: [], totalCount: 0 });
        if (error.message.includes('offline')) {
          setIsOffline(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchQuery]);


  const renderHighlightedText = (text, type) => {
    if (!text) return '';
    const config = getCategoryConfig(type);
    
    // If the text already contains HTML styling, extract just the text content
    if (text.includes('style=')) {
      // Create a temporary div to parse the HTML
      const temp = document.createElement('div');
      temp.innerHTML = text;
      text = temp.textContent || temp.innerText;
    }
    
    // Then apply the highlight styling
    return text.replace(
      /\[\[HIGHLIGHT\]\](.*?)\[\[\/HIGHLIGHT\]\]/g,
      (_, match) => `<span style="background-color: ${config.highlightBg}; color: ${config.highlightText}; padding: 0.1rem 0.3rem; border-radius: 0.2rem;">${match}</span>`
    );
  };
  
  return (
    <Fragment>
      <GeeksSEO title={`Search Results for "${searchQuery}" | SAS&ME - SAP B1 | Portal`} />

      {/* Header */}
      <div className="mb-4">
        <h3 className="mb-2">Search Results</h3>
        <div className="d-flex align-items-center text-muted mb-4">
          <Link 
            href="/dashboard"
            className="text-primary text-decoration-none"
          >
            Dashboard
          </Link>
          <i className="fe fe-chevron-right mx-2"></i>
          <span>Search</span>
        </div>

        {/* Categories */}
        {searchResults?.results?.length > 0 && (
          <div className="d-flex gap-2 flex-wrap">
            {Object.entries(searchResults.counts).map(([type, count]) => {
              if (!count) return null;
              
              const normalizedType = type.toLowerCase().replace(/s$/, ''); // Remove trailing 's'
              const categoryStyle = categoryConfig[normalizedType] || {
                color: '#6b7280',
                bgColor: '#f3f4f6',
                icon: 'fe-file'
              };
              const label = getTypeLabel(normalizedType);
              
              return (
                <GKTippy 
                  key={type}
                  content={`Total ${label} found`}
                  placement="top"
                >
                  <div
                    className="px-3 py-2 rounded d-flex align-items-center"
                    style={{
                      backgroundColor: categoryStyle.bgColor,
                      border: `1px solid ${categoryStyle.color}`,
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      cursor: 'help'
                    }}
                  >
                    <i 
                      className={`fe ${categoryStyle.icon} me-2`}
                      style={{ color: categoryStyle.color }}
                    />
                    <span style={{ color: categoryStyle.color }}>
                      {count} {label}
                    </span>
                  </div>
                </GKTippy>
              );
            })}
          </div>
        )}
      </div>

      {/* Results */}
      <Card className="mt-4">
        <Card.Body className="p-0">
          {isOffline ? (
            <div className="text-center p-5">
              <WifiOff size={48} className="text-muted mb-3" />
              <h4>You're currently offline</h4>
              <p className="text-muted mb-0">
                Please check your internet connection and try again
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center p-4">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mb-0">
                Searching far and wide for "{searchQuery}"...
              </p>
            </div>
          ) : (
            <>
              {searchResults?.results?.map((result, index) => {
                const normalizedType = result.type.toLowerCase().replace(/s$/, '');
                const config = categoryConfig[normalizedType] || {
                  color: '#6b7280',
                  bgColor: '#f3f4f6',
                  icon: 'fe-file'
                };
                
                return (
                  <Fragment key={result.id}>
                    <div 
                      className="p-4 hover-bg-light cursor-pointer"
                      onClick={() => router.push(result.link)}
                      style={{ borderLeft: `4px solid ${config.color}` }}
                    >
                      <div className="d-flex">
                        {/* Replace Square icon with category icon */}
                        <div className="me-3">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{ 
                              backgroundColor: config.bgColor,
                              width: '40px',
                              height: '40px',
                            }}
                          >
                            <i 
                              className={`fe ${config.icon}`}
                              style={{ color: config.color }}
                            />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-grow-1">
                          <h5 className="mb-1" dangerouslySetInnerHTML={{
                            __html: renderHighlightedText(result.title, result.type)
                          }} />
                          <div className="text-muted mb-2">
                            {result.id} | {result.phone || 'No Phone'}
                          </div>
                          {result.email && (
                            <div className="small text-muted">
                              <Mail size={16} className="me-2" />
                              <span dangerouslySetInnerHTML={{
                                __html: renderHighlightedText(result.email, result.type)
                              }} />
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="ms-3">
                          <ChevronRight size={20} className="text-muted" />
                        </div>
                      </div>
                    </div>
                    {index < searchResults.results.length - 1 && (
                      <div style={{ borderBottom: '1px solid #E5E7EB' }}></div>
                    )}
                  </Fragment>
                );
              })}

              {searchResults.results.length === 0 && (
                <div className="text-center p-5">
                  <Search size={48} className="text-muted mb-3" />
                  <h4>No results found for "{searchQuery}"</h4>
                  <p className="text-muted mb-0">
                    Try adjusting your search terms or browse categories instead
                  </p>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </Fragment>
  );
};

export default SearchPage;