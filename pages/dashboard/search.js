import React, { Fragment, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { GeeksSEO } from "widgets";
import Link from 'next/link';
import { GKTippy } from "widgets";
import { globalQuickSearch } from '../../utils/searchUtils';
import { db } from '../../firebase';
import { doc as firestoreDoc, getDoc } from 'firebase/firestore';
import { ChevronRight, Mail, Search, WifiOff } from 'lucide-react';

const SearchPage = () => {
  const router = useRouter();
  const { q: searchQuery } = router.query;
  const [searchResults, setSearchResults] = useState({ results: [], totalCount: 0, counts: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [legendItems, setLegendItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  const getStatusTag = (status) => {
    // Find matching legend item (case-insensitive)
    const legendItem = legendItems.find(item => 
      item.status.toLowerCase() === status.toLowerCase()
    );
    
    // Use legend color if found, otherwise use default colors
    const style = legendItem ? {
      backgroundColor: legendItem.color,
      color: '#FFFFFF'
    } : {
      backgroundColor: '#9e9e9e',
      color: '#FFFFFF'
    };

    return (
      <span
        className="ms-2 px-2 py-1 rounded-pill"
        style={{
          ...style,
          fontSize: '0.75rem',
          fontWeight: '500'
        }}
      >
        {status}
      </span>
    );
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
    const fetchLegendItems = async () => {
      try {
        const legendRef = firestoreDoc(db, 'settings', 'jobStatuses');
        const legendDoc = await getDoc(legendRef);
        if (legendDoc.exists()) {
          setLegendItems(legendDoc.data().items || []);
        }
      } catch (error) {
        console.error('Error fetching legend items:', error);
      }
    };

    fetchLegendItems();
  }, []);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setIsOffline(false);
      setCurrentPage(1); // Reset to first page on new search
      
      if (!searchQuery?.trim()) {
        setSearchResults({ results: [], totalCount: 0, counts: {} });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Try to get cached results first
        const cachedQuery = localStorage.getItem('searchQuery');
        const cachedResults = localStorage.getItem('searchResults');
        
        if (cachedQuery === searchQuery && cachedResults) {
          setSearchResults(JSON.parse(cachedResults));
          setIsLoading(false);
          
          // Refresh results in background
          const freshResults = await globalQuickSearch(db, searchQuery, false);
          setSearchResults(freshResults);
          localStorage.setItem('searchResults', JSON.stringify(freshResults));
        } else {
          const results = await globalQuickSearch(db, searchQuery, false);
          setSearchResults(results);
          localStorage.setItem('searchResults', JSON.stringify(results));
          localStorage.setItem('searchQuery', searchQuery);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults({ results: [], totalCount: 0, counts: {} });
        if (!navigator.onLine) {
          setIsOffline(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchQuery]);

  const renderHighlightedText = (text) => {
    if (!text) return '';
    
    // Clean up any remaining [[HIGHLIGHT]] tags
    text = text.replace(/\[\[HIGHLIGHT\]\]|\[\[\/HIGHLIGHT\]\]/g, '');
    
    return (
      <span dangerouslySetInnerHTML={{ __html: text }} />
    );
  };

  const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return null;

    return (
      <div className="d-flex justify-content-between align-items-center p-3 border-top">
        <div className="text-muted small">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => {
              // Show first page, last page, current page, and pages around current
              return (
                page === 1 ||
                page === totalPages ||
                Math.abs(currentPage - page) <= 1
              );
            })
            .map((page, index, array) => (
              <React.Fragment key={page}>
                {index > 0 && array[index - 1] !== page - 1 && (
                  <span className="btn btn-sm disabled">...</span>
                )}
                <button
                  className={`btn btn-sm ${
                    currentPage === page
                      ? 'btn-primary'
                      : 'btn-outline-primary'
                  }`}
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </button>
              </React.Fragment>
            ))}
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Calculate current items to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = searchResults.results.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0); // Scroll to top when page changes
  };

  return (
    <Fragment>
      <GeeksSEO title={`Search Results for "${searchQuery}" | SAS&ME - SAP B1 | Portal`} />

      {/* Header */}
      <div className="mb-4">
        <h3 className="mb-2">Search</h3>
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

      {/* Add this section right after the breadcrumb and before the results */}
      <div className="mb-4">
        <h4 className="mb-3">Search Results for "{searchQuery}"</h4>
        {searchResults?.results?.length > 0 ? (
          <p className="text-muted">
            Found {searchResults.totalCount} results matching your search
          </p>
        ) : !isLoading && (
          <p className="text-muted">
            No results found for this search term. Try different keywords.
          </p>
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
                Searching far and wide for "{searchQuery} keywords"...
              </p>
            </div>
          ) : (
            <>
              {currentItems.map((result, index) => {
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
                          <div className="d-flex align-items-center">
                            <h5 className="mb-1">
                              <span dangerouslySetInnerHTML={{
                                __html: typeof result.title === 'string' ? result.title : 'Untitled'
                              }} />
                            </h5>
                            {result.type === 'job' && result.status && getStatusTag(result.status)}
                          </div>
                          <div className="text-muted mb-2">
                            {result.subtitle}
                          </div>
                          {result.email && (
                            <div className="small text-muted">
                              <Mail size={16} className="me-2" />
                              <span>{result.email}</span>
                            </div>
                          )}
                          {result.address && (
                            <div className="small text-muted mt-1">
                              <i className="fe fe-map-pin me-2"></i>
                              <span>{result.address}</span>
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="ms-3">
                          <ChevronRight size={20} className="text-muted" />
                        </div>
                      </div>
                    </div>
                    {index < currentItems.length - 1 && (
                      <div style={{ borderBottom: '1px solid #E5E7EB' }}></div>
                    )}
                  </Fragment>
                );
              })}

              <Pagination
                totalItems={searchResults.results.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />

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