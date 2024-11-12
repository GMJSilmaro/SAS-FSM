'use client'

import React, { Fragment, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Col, Row, Card, Button, OverlayTrigger, Tooltip, Badge, Breadcrumb, Placeholder, Spinner, Form, Collapse, Modal } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { 
  Eye, 
  EnvelopeFill, 
  TelephoneFill, 
  GeoAltFill, 
  CurrencyExchange, 
  HouseFill, 
  CalendarRange, 
  CheckCircleFill,
  XLg,
  ChevronLeft, 
  ChevronRight,
  FilterCircle,
  Calendar,
  ListUl
} from 'react-bootstrap-icons';
import { GeeksSEO, PageHeading } from 'widgets'
import moment from 'moment';
import { 
  Search, 
  Filter as FeatherFilter,
  ChevronDown, 
  ChevronUp,
  ChevronRight as FeatherChevronRight,
  X as FeatherX
} from 'react-feather';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import toast from 'react-hot-toast';
import { TABLE_CONFIG } from 'constants/tableConfig';
import Link from 'next/link';
import { FaPlus } from 'react-icons/fa';


// Define flag components for each country
const SGFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28.35 18.9" style={{ width: '16px', height: '11px' }}>
    <rect width="28.35" height="9.45" fill="#EF3340"/>
    <rect y="9.45" width="28.35" height="9.45" fill="#fff"/>
    <circle cx="7.087" cy="9.45" r="5.67" fill="#fff"/>
    <path d="M7.087,5.67l1.147,3.531h3.712L8.959,11.142l1.147,3.531L7.087,13.23L4.069,14.673l1.147-3.531L2.228,9.201h3.712Z" fill="#EF3340"/>
  </svg>
);

const GBFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" style={{ width: '16px', height: '11px' }}>
    <clipPath id="t">
      <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/>
    </clipPath>
    <path d="M0,0 v30 h60 v-30 z" fill="#00247d"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
    <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#cf142b" strokeWidth="4"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#cf142b" strokeWidth="6"/>
  </svg>
);

const USFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 100" style={{ width: '16px', height: '11px' }}>
    <rect width="190" height="100" fill="#bf0a30"/>
    <rect y="7.69" width="190" height="7.69" fill="#fff"/>
    <rect y="23.08" width="190" height="7.69" fill="#fff"/>
    <rect y="38.46" width="190" height="7.69" fill="#fff"/>
    <rect y="53.85" width="190" height="7.69" fill="#fff"/>
    <rect y="69.23" width="190" height="7.69" fill="#fff"/>
    <rect y="84.62" width="190" height="7.69" fill="#fff"/>
    <rect width="76" height="53.85" fill="#002868"/>
    <g fill="#fff">
      {[...Array(9)].map((_, i) => 
        [...Array(11)].map((_, j) => (
          <circle key={`star-${i}-${j}`} cx={3.8 + j * 7.6} cy={3.8 + i * 5.38} r="2"/>
        ))
      )}
    </g>
  </svg>
);

const COUNTRY_CODE_MAP = {
  'Singapore': 'SG',
  'United Kingdom': 'GB',
  'United States': 'US',
};

const MAX_VISIBLE_ADDRESSES = 2; // Show first 2 addresses of each type

const copyToClipboard = (text, successMessage = 'Copied!') => {
  navigator.clipboard.writeText(text).then(() => {
    alert(successMessage);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
    alert('Failed to copy text');
  });
};

const fetchCustomers = async (page = 1, limit = 10, search = '', filters = {}, initialLoad = 'true') => {
  try {
    const timestamp = new Date().getTime();
    
    // Create a clean params object
    const params = {
      page: page.toString(),
      limit: limit.toString(),
      search,
      initialLoad,
      _: timestamp,
      ...filters
    };

    // Debug log
    console.log('Fetch Parameters:', {
      page,
      limit,
      search,
      filters,
      initialLoad
    });

    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    let url = `/api/getCustomersList?${queryParams.toString()}`;
    
    console.log('Fetching customers with URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Debug log
    console.log('Received data:', {
      customerCount: data.customers?.length,
      totalCount: data.totalCount,
      requestedLimit: limit
    });

    return {
      customers: data.customers || [],
      totalCount: data.totalCount || 0
    };
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

const formatAddress = (address) => {
  if (!address) return '-';
  
  // Combine address parts in a specific order
  const addressParts = [];
  
  // Add Street and Building (if they exist)
  if (address.Street) addressParts.push(address.Street);
  if (address.Building) addressParts.push(address.Building);
  
  // Add ZipCode and CountryName at the end
  const locationParts = [];
  if (address.ZipCode) locationParts.push(address.ZipCode);
  if (address.CountryName) locationParts.push(address.CountryName);
  
  // Combine all parts
  return [
    addressParts.join(' '),
    locationParts.join(', ')
  ].filter(Boolean).join(', ');
};

const formatMainAddress = (address) => {
  if (!address) return '-';
  
  const parts = [
    address.SiteID,
    address.Building,
    address.Block,
    address.Street,
    address.City,
    address.ZipCode,
    address.CountryName
  ];
  
  return parts.filter(part => part && String(part).trim()).join(', ');
};

const AddressCell = ({ address, type = "main" }) => {
  let FlagComponent = null;
  const countryCode = COUNTRY_CODE_MAP[address.Country];
  if (countryCode) {
    switch (countryCode) {
      case 'SG':
        FlagComponent = SGFlag;
        break;
      case 'GB':
        FlagComponent = GBFlag;
        break;
      case 'US':
        FlagComponent = USFlag;
        break;
    }
  }

  // Get icon based on address type
  const getIcon = () => {
    switch (type) {
      case 'billing':
        return <CurrencyExchange className="me-2 flex-shrink-0" />;
      case 'shipping':
        return <GeoAltFill className="me-2 flex-shrink-0" />;
      default:
        return <HouseFill className="me-2 flex-shrink-0" />;
    }
  };

  // Format address according to SAP arrangement
  const formattedAddress = [
    address.SiteID,
    address.Building,
    address.Block,
    address.Street,
    address.City,
    address.ZipCode,
    address.CountryName
  ].filter(part => part && String(part).trim()).join(', ');

  return (
    <div className="d-flex align-items-center">
      {getIcon()}
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip>{formattedAddress || 'No address available'}</Tooltip>}
      >
        <div className="text-truncate" style={{ maxWidth: '250px' }}>
          {formattedAddress || '-'}
        </div>
      </OverlayTrigger>
      {FlagComponent && (
        <div className="ms-2 flex-shrink-0">
          <FlagComponent />
        </div>
      )}
    </div>
  );
};

const FilterPanel = ({ filters, setFilters, onClear, loading, loadData }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (field, value) => {
    // Input validation based on field type
    switch (field) {
      case 'phone':
        // Only allow numbers and basic phone symbols
        if (!/^[0-9+\-\s]*$/.test(value)) {
          return; // Ignore invalid input
        }
        break;
      
      case 'email':
        // Allow all email characters
        if (!/^[a-zA-Z0-9.@]*$/.test(value)) {
          return; // Ignore invalid input
        }
        break;
      
      case 'customerCode':
        // Only allow numbers
        if (!/^\d*$/.test(value)) {
          return; // Ignore invalid input
        }
        break;
    }

    console.log(`Filter changed: ${field} = ${value}`); // Debug log
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      loadData(1);
    }
  };

  const handleSearch = async () => {
    try {
      // Validate email if present
      if (filters.email && !validateEmailSearch(filters.email)) {
        alert('Please enter a valid email address (e.g., example@domain.com)');
        return;
      }
      
      console.log('Search filters:', filters);
      await loadData(1);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center flex-grow-1">
            <OverlayTrigger
              placement="right"
              overlay={<Tooltip>Click to {isExpanded ? 'collapse' : 'expand'} search for customers</Tooltip>}
            >
              <div 
                className="d-flex align-items-center" 
                style={{ cursor: 'pointer' }}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <FilterCircle size={16} className="me-2 text-primary" />
                <h6 className="mb-0 me-2" style={{ fontSize: '1rem' }}>
                  Filter
                  {Object.values(filters).filter(value => value !== '').length > 0 && (
                    <Badge 
                      bg="primary" 
                      className="ms-2" 
                      style={{ 
                        fontSize: '0.75rem', 
                        verticalAlign: 'middle',
                        borderRadius: '12px',
                        padding: '0.25em 0.6em'
                      }}
                    >
                      {Object.values(filters).filter(value => value !== '').length}
                    </Badge>
                  )}
                </h6>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-muted" />
                ) : (
                  <ChevronDown size={16} className="text-muted" />
                )}
              </div>
            </OverlayTrigger>

            {/* Quick search when collapsed */}
            {!isExpanded && (
              <div className="ms-4 flex-grow-1" style={{ maxWidth: '300px' }}>
                <Form.Group className="mb-0">
                  <OverlayTrigger
                    placement="top"
                    overlay={<Tooltip>Quick search by customer name!</Tooltip>}
                  >
                    <Form.Control
                      size="sm"
                      type="text"
                      value={filters.customerName}
                      onChange={(e) => handleFilterChange('customerName', e.target.value)}
                      placeholder="Quick search by customer name Only!..."
                      style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                      onKeyPress={handleKeyPress}
                    />
                  </OverlayTrigger>
                </Form.Group>
              </div>
            )}
          </div>

          <div className="d-flex justify-content-end align-items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={onClear}
              disabled={loading}
              className="clear-btn d-flex align-items-center"
            >
              <FeatherX size={14} className="me-1" />
              Clear
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSearch}
              disabled={loading}
              className="search-btn d-flex align-items-center"
            >
              <Search size={14} className="me-1" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>
        <div style={{ 
          maxHeight: isExpanded ? '1000px' : '0',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          opacity: isExpanded ? 1 : 0
        }}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Customer Code:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Enter numbers only (e.g. 0001)</Tooltip>}
                >
                  <Form.Control
                    size="sm"
                    type="text"
                    value={filters.customerCode}
                    onChange={(e) => handleFilterChange('customerCode', e.target.value)}
                    placeholder="Enter customer code..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                    onKeyPress={handleKeyPress}
                  />
                </OverlayTrigger>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Customer Name:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Enter full or partial customer name</Tooltip>}
                >
                  <Form.Control
                    size="sm"
                    type="text"
                    value={filters.customerName}
                    onChange={(e) => handleFilterChange('customerName', e.target.value)}
                    placeholder="Search by customer name..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                    onKeyPress={handleKeyPress}
                  />
                </OverlayTrigger>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Email:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Enter full email address (e.g., example@domain.com)</Tooltip>}
                >
                  <Form.Control
                    size="sm"
                    type="email"
                    value={filters.email}
                    onChange={(e) => handleFilterChange('email', e.target.value)}
                    placeholder="Enter email address..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        if (!validateEmailSearch(filters.email)) {
                          alert('Please enter a valid email address (e.g., example@domain.com)');
                          return;
                        }
                        handleKeyPress(e);
                      }
                    }}
                  />
                </OverlayTrigger>
                {filters.email && !validateEmailSearch(filters.email) && (
                  <small className="text-danger d-block mt-1">
                    Please enter a valid email address
                  </small>
                )}
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Phone:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Enter numbers only (e.g. +65 1234 5678)</Tooltip>}
                >
                  <Form.Control
                    size="sm"
                    type="text"
                    value={filters.phone}
                    onChange={(e) => handleFilterChange('phone', e.target.value)}
                    placeholder="Enter phone number..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                    onKeyPress={handleKeyPress}
                  />
                </OverlayTrigger>
              </Form.Group>
             
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Address Search:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip>
                      Search in primary and mailing addresses, including postal codes
                    </Tooltip>
                  }
                >
                  <Form.Control
                    size="sm"
                    type="text"
                    value={filters.address}
                    onChange={(e) => handleFilterChange('address', e.target.value)}
                    placeholder="Search in addresses..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                    onKeyPress={handleKeyPress}
                  />
                </OverlayTrigger>
                {filters.address && (
                  <small className="text-muted d-block mt-1">
                    Searching in both primary and mailing addresses
                  </small>
                )}
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Contract Status:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Filter customers by their contract status</Tooltip>}
                >
                  <Form.Select
                    size="sm"
                    value={filters.contractStatus}
                    onChange={(e) => handleFilterChange('contractStatus', e.target.value)}
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                    onKeyPress={handleKeyPress}
                  >
                    <option value="">All Contract Status</option>
                    <option value="Y">With Contract</option>
                    <option value="N">No Contract</option>
                  </Form.Select>
                </OverlayTrigger>
              </Form.Group>
              <Row className="align-items-end">
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Country:</Form.Label>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Select customer's country</Tooltip>}
                    >
                      <Form.Select
                        size="sm"
                        value={filters.country}
                        onChange={(e) => handleFilterChange('country', e.target.value)}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                        onKeyPress={handleKeyPress}
                      >
                        <option value="">All Countries</option>
                        <option value="SG">Singapore</option>
                      </Form.Select>
                    </OverlayTrigger>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Status:</Form.Label>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Filter by customer account status</Tooltip>}
                    >
                      <Form.Select
                        size="sm"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                        onKeyPress={handleKeyPress}
                      >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </OverlayTrigger>
                  </Form.Group>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>
      </Card.Body>
      <style jsx global>{`
        .clear-btn, .search-btn {
          padding: 6px 12px !important;
          font-size: 14px !important;
          border-radius: 4px !important;
          transition: all 0.2s ease-in-out !important;
          border: none !important;
          position: relative;
          overflow: hidden;
        }

        .clear-btn {
          background-color: #FEE2E2 !important;
          color: #DC2626 !important;
        }

        .search-btn {
          background-color: #3B82F6 !important;
          color: white !important;
        }

        /* Hover animations */
        .clear-btn:hover, .search-btn:hover {
          transform: translateY(-1px);
        }

        .clear-btn:hover {
          background-color: #FEE2E2 !important;
          opacity: 0.9;
        }

        .search-btn:hover {
          background-color: #2563EB !important;
        }

        /* Active state animations */
        .clear-btn:active, .search-btn:active {
          transform: translateY(0);
        }

        /* Ripple effect */
        .clear-btn::after, .search-btn::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 120%;
          height: 120%;
          background: rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -50%) scale(0);
          border-radius: 50%;
          transition: transform 0.3s ease;
        }

        .clear-btn:active::after, .search-btn:active::after {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0;
        }

        /* Disabled state */
        .clear-btn:disabled, .search-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none !important;
        }

        /* Icon animations */
        .clear-btn svg, .search-btn svg {
          transition: transform 0.2s ease;
        }

        .clear-btn:hover svg {
          transform: rotate(90deg);
        }

        .search-btn:hover svg {
          transform: translateX(-2px);
        }
          /* Primary Button Style */
  .btn-primary.btn-icon-text {
    background-color: #3b82f6;
    color: white;
    border: none;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
    font-size: 0.875rem;
    padding: 0.5rem 0.875rem;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .btn-primary.btn-icon-text:hover {
    background-color: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2);
    color: white;
    text-decoration: none;
  }

  .btn-primary.btn-icon-text:hover .icon-left {
    transform: translateX(-2px);
  }

  .btn-primary.btn-icon-text .icon-left {
    transition: transform 0.2s ease;
  }

  /* Small button variant */
  .btn-sm.btn-icon-text {
    padding: 0.4rem 0.75rem;
    font-size: 0.812rem;
  }

  /* Ripple effect */
  .btn-icon-text {
    position: relative;
    overflow: hidden;
  }

  .btn-icon-text::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 120%;
    height: 120%;
    background: rgba(255, 255, 255, 0.2);
    transform: translate(-50%, -50%) scale(0);
    border-radius: 50%;
    transition: transform 0.5s ease;
  }

  .btn-icon-text:active::after {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
    .Toaster {
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 9999;
          }
          
          /* Custom toast styles */
          .toast-custom {
            background: white;
            color: black;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          }
          
          .toast-custom.success {
            border-left: 4px solid #10B981;
          }
          
          .toast-custom.error {
            border-left: 4px solid #EF4444;
          }
          
          .toast-custom.loading {
            border-left: 4px solid #3B82F6;
          }
      `}</style>
    </Card>
  );
};

// Add this new component for the addresses modal
const AddressesModal = ({ show, onHide, addresses, defaultAddress, billtoDefault, shiptoDefault }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3); // Default to 3 items

  // Simplified page size options
  const pageSizeOptions = [3, 5, 10];

  // Filter and split addresses
  const filteredAddresses = useMemo(() => {
    const filtered = addresses.filter(address => {
      const matchesSearch = searchTerm === '' || 
        Object.values(address).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesType = filterType === 'all' || 
        (filterType === 'billing' && address.AddressType === 'bo_BillTo') ||
        (filterType === 'shipping' && address.AddressType === 'bo_ShipTo');

      return matchesSearch && matchesType;
    });

    return {
      billing: filtered.filter(addr => addr.AddressType === 'bo_BillTo'),
      shipping: filtered.filter(addr => addr.AddressType === 'bo_ShipTo')
    };
  }, [addresses, searchTerm, filterType]);

  // Calculate if we should show both columns or just one
  const showBillingOnly = filterType === 'billing' || (filterType === 'all' && filteredAddresses.shipping.length === 0);
  const showShippingOnly = filterType === 'shipping' || (filterType === 'all' && filteredAddresses.billing.length === 0);
  const showBothColumns = !showBillingOnly && !showShippingOnly;

  // Calculate pagination based on visible content
  const totalPages = Math.ceil(
    Math.max(
      showBillingOnly ? filteredAddresses.billing.length : 0,
      showShippingOnly ? filteredAddresses.shipping.length : 0,
      showBothColumns ? Math.max(filteredAddresses.billing.length, filteredAddresses.shipping.length) : 0
    ) / itemsPerPage
  );

  // Get current page items
  const getCurrentPageItems = (items) => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  };

  const AddressTable = ({ addresses, type, billtoDefault, shiptoDefault }) => {
    console.log('AddressTable Props:', {
      type,
      billtoDefault,
      shiptoDefault,
      addresses: addresses.map(a => ({
        AddressName: a.AddressName,
        AddressType: a.AddressType,
        isDefault: type === 'shipping' ? 
          a.AddressName === shiptoDefault : 
          a.AddressName === billtoDefault
      }))
    });

    return (
      <div className="table-responsive" onClick={(e) => e.stopPropagation()}>
        <table className="table table-hover">
          <thead>
            <tr>
              <th>
                {type === 'billing' ? (
                  <div className="d-flex align-items-center">
                    <CurrencyExchange className="me-2" size={14} />
                    Building
                  </div>
                ) : (
                  <div className="d-flex align-items-center">
                    <GeoAltFill className="me-2" size={14} />
                    Building
                  </div>
                )}
              </th>
              <th>Address</th>
              <th>Default</th>
            </tr>
          </thead>
          <tbody>
            {addresses.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-4">
                  <div className="text-muted">
                    {type === 'billing' ? (
                      <div className="d-flex align-items-center justify-content-center">
                        <CurrencyExchange className="me-2" size={14} />
                        No billing addresses found
                      </div>
                    ) : (
                      <div className="d-flex align-items-center justify-content-center">
                        <GeoAltFill className="me-2" size={14} />
                        No shipping addresses found
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              getCurrentPageItems(addresses).map((address, index) => (
                <tr key={index}>
                  <td>
                    <div className="d-flex align-items-center">
                      {type === 'billing' ? (
                        <CurrencyExchange className="me-2 text-primary" size={14} />
                      ) : (
                        <GeoAltFill className="me-2 text-primary" size={14} />
                      )}
                      <span className="fw-bold text-primary">
                        {address.AddressName || '-'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="text-wrap" style={{ maxWidth: '200px' }}>
                      <HouseFill className="me-2 text-muted" size={14} />
                      {[
                        address.BuildingFloorRoom && address.BuildingFloorRoom !== address.AddressName ? address.BuildingFloorRoom : null,
                        address.Street,
                        address.ZipCode,
                        address.Country === 'SG' ? 'Singapore' : address.Country
                      ].filter(Boolean).join(', ')}
                    </div>
                  </td>
                  <td>
                    {type === 'billing' && address.AddressName === billtoDefault && (
                      <Badge bg="primary" className="d-flex align-items-center" style={{ width: 'fit-content' }}>
                        <CheckCircleFill className="me-1" size={12} />
                        Default
                      </Badge>
                    )}
                    {type === 'shipping' && address.AddressName === shiptoDefault && (
                      <Badge bg="primary" className="d-flex align-items-center" style={{ width: 'fit-content' }}>
                        <CheckCircleFill className="me-1" size={12} />
                        Default
                      </Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      onClick={(e) => e.stopPropagation()}
    >
      <Modal.Header closeButton onClick={(e) => e.stopPropagation()}>
        <Modal.Title>
          <Search size={18} className="me-2" />
          All Addresses
        </Modal.Title>
      </Modal.Header>
      <Modal.Body onClick={(e) => e.stopPropagation()}>
        {/* Search and Filter Controls */}
        <div className="mb-3">
          <Row className="g-2">
            <Col md={8}>
              <Form.Group>
                <div className="position-relative">
                  <Form.Control
                    type="text"
                    placeholder="Search addresses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="sm"
                  />
                  <Search 
                    size={14} 
                    className="position-absolute" 
                    style={{ 
                      top: '50%', 
                      right: '10px', 
                      transform: 'translateY(-50%)',
                      color: '#6c757d'
                    }}
                  />
                </div>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Select 
                size="sm"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Types</option>
                <option value="billing">Billing Only</option>
                <option value="shipping">Shipping Only</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <div className="d-flex align-items-center">
                <small className="text-muted me-2">Show:</small>
                <Form.Select
                  size="sm"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ width: '70px' }}
                >
                  {pageSizeOptions.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </Form.Select>
              </div>
            </Col>
          </Row>
        </div>

        {/* Results Summary */}
        <div className="mb-3 text-muted small d-flex align-items-center">
          <FilterCircle size={14} className="me-2" />
          Found {filteredAddresses.billing.length} billing and {filteredAddresses.shipping.length} shipping addresses
        </div>

        {/* Dynamic Content */}
        <Row>
          {getCurrentPageItems(filteredAddresses.billing).length > 0 && (filterType === 'all' || filterType === 'billing') && (
            <Col md={6} className="border-end">
              <h6 className="mb-3 d-flex align-items-center">
                <CurrencyExchange className="me-2" />
                Billing Addresses
                <Badge bg="secondary" className="ms-2">
                  {filteredAddresses.billing.length}
                </Badge>
              </h6>
              <AddressTable 
                addresses={filteredAddresses.billing} 
                type="billing"
                billtoDefault={billtoDefault}
                shiptoDefault={shiptoDefault}
              />
            </Col>
          )}

          {(filterType === 'all' || filterType === 'shipping') && (
            <Col md={getCurrentPageItems(filteredAddresses.billing).length > 0 ? 6 : 12}>
              <h6 className="mb-3 d-flex align-items-center">
                <GeoAltFill className="me-2" />
                Shipping Addresses
                <Badge bg="secondary" className="ms-2">
                  {filteredAddresses.shipping.length}
                </Badge>
              </h6>
              <AddressTable 
                addresses={filteredAddresses.shipping}
                type="shipping"
                billtoDefault={billtoDefault}
                shiptoDefault={shiptoDefault}
              />
            </Col>
          )}

          {filteredAddresses.billing.length === 0 && filteredAddresses.shipping.length === 0 && (
            <Col md={12}>
              <div className="text-center py-4 text-muted">
                <Search size={20} className="mb-2" />
                <p>No addresses found matching your search criteria</p>
              </div>
            </Col>
          )}
        </Row>

        {/* Updated Pagination Info */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="text-muted small">
              <ListUl size={14} className="me-2" />
              {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, Math.max(filteredAddresses.billing.length, filteredAddresses.shipping.length))} of {Math.max(filteredAddresses.billing.length, filteredAddresses.shipping.length)}
            </div>
            <div className="d-flex align-items-center">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="me-2"
              >
                <ChevronLeft size={14} className="me-1" />
                Previous
              </Button>
              <div className="mx-3 d-flex align-items-center">
                <Calendar size={14} className="me-2" />
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <FeatherChevronRight size={14} className="ms-1" />
              </Button>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer onClick={(e) => e.stopPropagation()}>
        <Button variant="secondary" onClick={(e) => {
          e.stopPropagation();
          onHide();
        }}>
          <XLg size={14} className="me-1" />
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Update ViewCustomers component to include filters state
const ViewCustomers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const [perPage, setPerPage] = useState(TABLE_CONFIG.PAGE_SIZES.DEFAULT);
  const [initialLoad, setInitialLoad] = useState(true);
  const [filters, setFilters] = useState({
    customerCode: '',
    customerName: '',
    email: '',
    phone: '',
    contractStatus: '',
    country: '',
    status: '',
    address: '' 
  });

  const columnHelper = createColumnHelper()

  const columns = [
    columnHelper.accessor((row, index) => ((currentPage - 1) * perPage) + index + 1, {
      id: 'index',
      header: '#',
      size: 50,
    }),
    columnHelper.accessor('CardCode', {
      header: 'Code',
      size: 100,
      cell: info => (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={`tooltip-${info.getValue()}`}>Click to copy customer code</Tooltip>}
        >
          <div 
            style={{fontWeight: 'bold', cursor: 'pointer'}} 
            onClick={() => copyToClipboard(info.getValue(), 'Customer code copied!')}
          >
            {info.getValue()}
          </div>
        </OverlayTrigger>
      )
    }),
    columnHelper.accessor('CardName', {
      header: 'Customer',
      size: 200,
      cell: info => (
        <div className="d-flex align-items-center">
          {info.getValue()}
        </div>
      )
    }),

    columnHelper.accessor('addresses', {
      header: 'Address Information',
      size: 400,
      cell: info => {
        const row = info.row.original;
        const [isExpanded, setIsExpanded] = useState(false);
        const [showModal, setShowModal] = useState(false);
        
        const bpAddresses = row.BPAddresses || [];
        const billingAddresses = bpAddresses.filter(addr => addr.AddressType === 'bo_BillTo');
        const shippingAddresses = bpAddresses.filter(addr => addr.AddressType === 'bo_ShipTo');
        
        const hasMoreAddresses = billingAddresses.length > MAX_VISIBLE_ADDRESSES || 
                                shippingAddresses.length > MAX_VISIBLE_ADDRESSES;

        // Find the mail address (default billing address)
        const mailAddress = billingAddresses.find(addr => addr.Default === 'Y') || billingAddresses[0];

        return (
          <div style={{ cursor: 'default' }}>
            {/* Mail Address Display */}
            {mailAddress && (
              <div className="d-flex align-items-center mb-2">
                <HouseFill className="me-2 flex-shrink-0" />
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Click to copy address</Tooltip>}
                >
                  <div 
                    className="fw-bold text-primary"
                    onClick={(e) => copyAddressToClipboard(mailAddress, e)}
                    style={{ cursor: 'pointer' }}
                  >
                    {mailAddress.AddressName || mailAddress.BuildingFloorRoom || '-'}
                  </div>
                </OverlayTrigger>
                {mailAddress.Country && (
                  <div className="ms-2">
                    <CountryFlag country={mailAddress.Country} />
                  </div>
                )}
              </div>
            )}

            {/* Dropdown Link with Guide Text */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              style={{ cursor: 'pointer' }}
            >
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    {isExpanded ? 'Click to collapse address list' : 'Click to expand and view all addresses'}
                  </Tooltip>
                }
              >
                <div className="d-flex align-items-center">
                  <FeatherChevronRight 
                    size={16} 
                    className="me-2" 
                    style={{ 
                      transform: isExpanded ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s ease'
                    }} 
                  />
                  <span className="text-primary">
                    {billingAddresses.length} Billing {billingAddresses.length === 1 ? 'Address' : 'Addresses'} & {' '}
                    {shippingAddresses.length} Shipping {shippingAddresses.length === 1 ? 'Address' : 'Addresses'}
                  </span>
                </div>
              </OverlayTrigger>
            </div>

            {/* Guide Text */}
            {!isExpanded && (
              <small className="text-muted d-block mt-1">
                <i>Click arrow to view address details</i>
              </small>
            )}

            {/* Expandable Content */}
            <Collapse in={isExpanded}>
              <div className="mt-2">
                {/* Billing Addresses Section */}
                {billingAddresses.length > 0 && (
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2 border-bottom pb-2">
                      <CurrencyExchange className="me-2 text-primary" size={16} />
                      <h6 className="mb-0 fw-bold">Billing Addresses</h6>
                      <Badge bg="secondary" className="ms-2">{billingAddresses.length}</Badge>
                    </div>
                    <small className="text-muted d-block mb-2">
                      <i>Showing {Math.min(billingAddresses.length, MAX_VISIBLE_ADDRESSES)} of {billingAddresses.length} billing addresses</i>
                    </small>
                    {billingAddresses.slice(0, MAX_VISIBLE_ADDRESSES).map((address, index) => (
                      <div key={index} className="mb-2 ps-3 border-start border-primary border-3">
                        <div className="d-flex align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center">
                              <CurrencyExchange className="me-2 text-primary" size={14} />
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>Click to copy address</Tooltip>}
                              >
                                <span 
                                  className="fw-bold text-primary"
                                  onClick={(e) => copyAddressToClipboard(address, e)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {address.AddressName || '-'}
                                </span>
                              </OverlayTrigger>
                              {address.AddressName === row.BilltoDefault && (
                                <Badge bg="primary" className="ms-2">Default</Badge>
                              )}
                              {address.Country && (
                                <div className="ms-2">
                                  <CountryFlag country={address.Country} />
                                </div>
                              )}
                            </div>
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Click to copy full address</Tooltip>}
                            >
                              <div 
                                className="ms-4 text-muted"
                                onClick={(e) => copyAddressToClipboard(address, e)}
                                style={{ cursor: 'pointer' }}
                              >
                                {[
                                  address.BuildingFloorRoom && address.BuildingFloorRoom !== address.AddressName ? address.BuildingFloorRoom : null,
                                  address.Street,
                                  address.ZipCode,
                                  address.Country === 'SG' ? 'Singapore' : address.Country
                                ].filter(Boolean).join(', ')}
                              </div>
                            </OverlayTrigger>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Shipping Addresses Section */}
                {shippingAddresses.length > 0 && (
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2 border-bottom pb-2">
                      <GeoAltFill className="me-2 text-primary" size={16} />
                      <h6 className="mb-0 fw-bold">Shipping Addresses</h6>
                      <Badge bg="secondary" className="ms-2">{shippingAddresses.length}</Badge>
                    </div>
                    <small className="text-muted d-block mb-2">
                      <i>Showing {Math.min(shippingAddresses.length, MAX_VISIBLE_ADDRESSES)} of {shippingAddresses.length} shipping addresses</i>
                    </small>
                    {shippingAddresses.slice(0, MAX_VISIBLE_ADDRESSES).map((address, index) => (
                      <div key={index} className="mb-2 ps-3 border-start border-primary border-3">
                        <div className="d-flex align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center">
                              <GeoAltFill className="me-2 text-primary" size={14} />
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>Click to copy address</Tooltip>}
                              >
                                <span 
                                  className="fw-bold text-primary"
                                  onClick={(e) => copyAddressToClipboard(address, e)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {address.AddressName || '-'}
                                </span>
                              </OverlayTrigger>
                              {address.AddressName === row.ShipToDefault && (
                                <Badge bg="primary" className="ms-2">Default</Badge>
                              )}
                              {address.Country && (
                                <div className="ms-2">
                                  <CountryFlag country={address.Country} />
                                </div>
                              )}
                            </div>
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Click to copy full address</Tooltip>}
                            >
                              <div 
                                className="ms-4 text-muted"
                                onClick={(e) => copyAddressToClipboard(address, e)}
                                style={{ cursor: 'pointer' }}
                              >
                                {[
                                  address.BuildingFloorRoom && address.BuildingFloorRoom !== address.AddressName ? address.BuildingFloorRoom : null,
                                  address.Street,
                                  address.ZipCode,
                                  address.Country === 'SG' ? 'Singapore' : address.Country
                                ].filter(Boolean).join(', ')}
                              </div>
                            </OverlayTrigger>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show More Button with Tooltip */}
                {hasMoreAddresses && (
                  <div className="mt-3 border-top pt-2">
                    <OverlayTrigger
                      placement="bottom"
                      overlay={<Tooltip>Click to view all addresses in detail</Tooltip>}
                    >
                      <Button
                        variant="link"
                        size="md"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowModal(true);
                        }}
                        className="p-0"
                      >
                        Show All Addresses
                      </Button>
                    </OverlayTrigger>
                  </div>
                )}
              </div>
            </Collapse>

            {/* Modal remains unchanged */}
            <AddressesModal
              show={showModal}
              onHide={() => setShowModal(false)}
              addresses={bpAddresses}
              billtoDefault={row.BilltoDefault}
              shiptoDefault={row.ShipToDefault}
            />
          </div>
        );
      }
    }),
    
    columnHelper.accessor('Phone1', {
      header: 'Phone',
      size: 100,
      cell: info => (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={`tooltip-phone-${info.getValue()}`}>Click to call</Tooltip>}
        >
          <a href={`tel:${info.getValue()}`} className="text-decoration-none">
            <TelephoneFill className="me-2" />
            {info.getValue()}
          </a>
        </OverlayTrigger>
      )
    }),
    columnHelper.accessor('EmailAddress', {
      header: 'Email',
      size: 200,
      cell: info => (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={`tooltip-email-${info.getValue()}`}>Click to send email</Tooltip>}
        >
          <a href={`mailto:${info.getValue()}`} className="text-decoration-none">
            <EnvelopeFill className="me-2" />
            {info.getValue()}
          </a>
        </OverlayTrigger>
      )
    }),
    columnHelper.accessor('U_ContractEndDate', {
      header: 'Contract Duration',
      size: 180,
      cell: info => {
        if (info.row.original.U_Contract !== 'Y' || !info.row.original.U_ContractStartDate || !info.row.original.U_ContractEndDate) {
          return '-';
        }
        const startDate = moment(info.row.original.U_ContractStartDate);
        const endDate = moment(info.row.original.U_ContractEndDate);
        const now = moment();
        const duration = moment.duration(endDate.diff(now));
        const months = Math.floor(duration.asMonths());
        const days = Math.floor(duration.asDays() % 30);
        const hours = Math.floor(duration.asHours() % 24);
        const minutes = Math.floor(duration.asMinutes() % 60);
        
        let durationText = '';
        if (months > 0) {
          durationText = `${months} month${months > 1 ? 's' : ''} left`;
        } else if (days > 0) {
          durationText = `${days} day${days > 1 ? 's' : ''} left`;
        } else if (hours > 0) {
          durationText = `${hours} hour${hours > 1 ? 's' : ''} left`;
        } else {
          durationText = `${minutes} minute${minutes > 1 ? 's' : ''} left`;
        }
        
        return (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id={`tooltip-duration-${info.getValue()}`}>
              Start: {startDate.format('DD/MM/YYYY')}
              <br />
              End: {endDate.format('DD/MM/YYYY')}
            </Tooltip>}
          >
            <span>
              <CalendarRange className="me-2" />
              {durationText}
            </span>
          </OverlayTrigger>
        );
      }
    }),
    columnHelper.accessor('U_Contract', {
      header: 'Contract',
      size: 130,
      cell: info => (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={`tooltip-contract-${info.getValue()}`}>
            {info.getValue() === 'Y' ? 'This customer has a contract with us' : 'This customer does not have a contract with us'}
          </Tooltip>}
        >
          <div>
            <CurrencyExchange className="me-2 text-primary" size={14} />
            <Badge 
              bg={info.getValue() === 'Y' ? 'primary' : 'secondary'}
              style={{ 
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              {info.getValue() === 'Y' ? 'Yes' : 'No'}
            </Badge>
          </div>
        </OverlayTrigger>
      )
    }),

    columnHelper.accessor(() => null, {
      id: 'actions',
      header: 'Actions',
      size: 130,
      cell: info => (
        <div className="d-flex gap-2">
          <OverlayTrigger
            placement="left"
            overlay={
              <Tooltip>
                View complete details for customer #{info.row.original.CardCode}
              </Tooltip>
            }
          >
            <Link
              href={`/customers/view/${info.row.original.CardCode}`}
              className="btn btn-primary btn-icon-text btn-sm"
              style={{ textDecoration: "none" }}
            >
              <Eye size={14} className="icon-left" />
              View
            </Link>
          </OverlayTrigger>
        </div>
      )
    }),
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: perPage,
      },
    },
    manualPagination: true,
    pageCount: Math.ceil(totalRows / perPage),
    onPaginationChange: updater => {
      if (typeof updater === 'function') {
        const newPageIndex = updater({ pageIndex: currentPage - 1, pageSize: perPage }).pageIndex
        handlePageChange(newPageIndex + 1)
      }
    },
  })

  const loadData = useCallback(async (page, forceInitial = false) => {
    if (loading) return;
    
    console.log('LoadData called with:', { page, perPage, forceInitial }); // Debug log
    
    setLoading(true);
    setError(null);
    
    try {
      const apiParams = {
        ...filters,
        contractStatus: undefined,
        U_Contract: filters.contractStatus
      };

      const activeFilters = Object.fromEntries(
        Object.entries(apiParams)
          .filter(([_, value]) => value !== '' && value !== undefined)
      );
      
      const { customers, totalCount } = await fetchCustomers(
        page,
        perPage,
        activeFilters.customerName || '',
        activeFilters,
        forceInitial ? 'true' : initialLoad.toString()
      );
      
      setData(customers);
      setTotalRows(totalCount);
      
    } catch (err) {
      console.error('Error loading customers:', err);
      setError('Failed to load customers. Please try again.');
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [perPage, initialLoad, filters, loading]);

  // Keep only the initial load effect
  useEffect(() => {
    if (initialLoad) {
      loadData(1);
    }
  }, [loadData, initialLoad]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadData(page);
  };

  const handleViewDetails = (customer) => {
    console.log('Viewing customer:', customer); // Debug log
    localStorage.setItem('viewCustomerToast', customer.CardName);
    router.push(`/customers/view/${customer.CardCode}`);
  };

  const handlePerRowsChange = async (newPerPage) => {
    // Show loading toast with single spinner
    const loadingToast = toast.loading(
      <div className="d-flex align-items-center">
        <div className="me-3">
          <div className="fw-bold">Updating View</div>
          <small>Loading {newPerPage} entries...</small>
        </div>
       
      </div>,
      {
        style: {
          ...TOAST_STYLES.BASE,
          ...TOAST_STYLES.LOADING
        }
      }
    );

    // Remove the loading state from the dropdown since we have the toast
    try {
      setPerPage(newPerPage);
      setCurrentPage(1);

      const apiParams = {
        ...filters,
        contractStatus: undefined,
        U_Contract: filters.contractStatus
      };

      const activeFilters = Object.fromEntries(
        Object.entries(apiParams)
          .filter(([_, value]) => value !== '' && value !== undefined)
      );

      const { customers, totalCount } = await fetchCustomers(
        1,
        newPerPage,
        activeFilters.customerName || '',
        activeFilters,
        'false'
      );

      setData(customers);
      setTotalRows(totalCount);

      // Success toast
      toast.success(
        <div>
          <div className="fw-bold">View Updated Successfully</div>
          <small>Now showing {newPerPage} entries per page</small>
          {Object.keys(activeFilters).length > 0 && (
            <small className="d-block mt-1">
              <i className="fas fa-filter me-1"></i>
              Maintained {Object.keys(activeFilters).length} active filter{Object.keys(activeFilters).length !== 1 ? 's' : ''}
            </small>
          )}
        </div>,
        {
          duration: 5000,
          style: {
            ...TOAST_STYLES.BASE,
            ...TOAST_STYLES.SUCCESS
          }
        }
      );

    } catch (err) {
      console.error('Error updating page size:', err);
      
      toast.error(
        <div>
          <div className="fw-bold">Update Failed</div>
          <small>Could not change the number of entries</small>
          <small className="d-block mt-1 text-danger">
            <i className="fas fa-exclamation-circle me-1"></i>
            {err.message}
          </small>
        </div>,
        {
          duration: 5000,
          style: {
            ...TOAST_STYLES.BASE,
            ...TOAST_STYLES.ERROR
          }
        }
      );
    } finally {
      toast.dismiss(loadingToast);
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      customerCode: '',
      customerName: '',
      email: '',
      phone: '',
      contractStatus: '',
      country: '',
      status: '',
      address: ''
    });
    setCurrentPage(1);
    setInitialLoad(true);
    loadData(1, true);
  };

  // Add this customStyles object near the top of your file
  const customStyles = {
    table: {
      style: {
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        width: "100%",
        tableLayout: "fixed",
      },
    },
    headRow: {
      style: {
        backgroundColor: "#f8fafc",
        borderTopLeftRadius: "8px",
        borderTopRightRadius: "8px",
        borderBottom: "1px solid #e2e8f0",
        minHeight: "52px",
      },
    },
    headCells: {
      style: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#475569",
        paddingLeft: "16px",
        paddingRight: "16px",
      },
    },
    cells: {
      style: {
        fontSize: "14px",
        color: "#64748b",
        paddingLeft: "16px",
        paddingRight: "16px",
        paddingTop: "12px",
        paddingBottom: "12px",
      },
    },
    rows: {
      style: {
        minHeight: "60px",
        "&:hover": {
          backgroundColor: "#f1f5f9",
          cursor: "pointer",
          transition: "all 0.2s",
        },
      },
    },
    pagination: {
      style: {
        borderTop: "1px solid #e2e8f0",
        minHeight: "56px",
      },
      pageButtonsStyle: {
        borderRadius: "4px",
        height: "32px",
        padding: "4px 8px",
        margin: "0 4px",
      },
    },
  };

  return (
    <Fragment>
      <GeeksSEO title="View Customers | SAS&ME - SAP B1 | Portal" />
      <Row>
        <Col lg={12} md={12} sm={12}>
          <div 
            style={{
              background: 'linear-gradient(90deg, #4171F5 0%, #3DAAF5 100%)',
              padding: '1.5rem 2rem',
              borderRadius: '0 0 24px 24px',
              marginTop: '-39px',
              marginLeft: '10px',
              marginRight: '10px',
              marginBottom: '20px'
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div className="d-flex flex-column">
                {/* Title and Subtitle */}
                <div className="mb-3">
                  <h1 
                    className="mb-2" 
                    style={{ 
                      fontSize: '28px',
                      fontWeight: '600',
                      color: '#FFFFFF',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    Customers List
                  </h1>
                  <p 
                    className="mb-2" 
                    style={{ 
                      fontSize: '16px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontWeight: '400',
                      lineHeight: '1.5'
                    }}
                  >
                    Manage and view all your customer accounts, addresses, and contract details in one place
                  </p>
                  <div 
                    className="d-flex align-items-center gap-2"
                    style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      marginTop: '8px'
                    }}
                  >
                    <i className="fe fe-info" style={{ fontSize: '16px' }}></i>
                    <span>
                      View-only access. Customer data is maintained in SAP Business One
                    </span>
                  </div>
                </div>

                {/* Badges */}
                <div className="d-flex align-items-center gap-2 mb-4">
                  <span 
                    className="badge" 
                    style={{ 
                      background: '#FFFFFF',
                      color: '#4171F5',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}
                  >
                    Customer Management
                  </span>
                  <span 
                    className="badge" 
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}
                  >
                    <i className="fe fe-eye me-1"></i>
                    View Only
                  </span>
                </div>

                {/* Breadcrumb */}
                <nav 
                  style={{ 
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <div className="d-flex align-items-center">
                    <i className="fe fe-home" style={{ color: 'rgba(255, 255, 255, 0.7)' }}></i>
                    <Link 
                      href="/dashboard" 
                      className="text-decoration-none ms-2" 
                      style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      Dashboard
                    </Link>
                    <span className="mx-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>/</span>
                    <i className="fe fe-users" style={{ color: '#FFFFFF' }}></i>
                    <span className="ms-2" style={{ color: '#FFFFFF' }}>
                      Customers
                    </span>
                  </div>
                </nav>
              </div>

              {/* Action Button - Removed since it's view only */}
              <div>
                <OverlayTrigger
                  placement="left"
                  overlay={
                    <Tooltip>
                      Customer creation is managed in SAP Business One
                    </Tooltip>
                  }
                >
                  <Button 
                    variant="light" 
                    style={{
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: '0.6',
                      cursor: 'not-allowed',
                      fontSize: '14px'
                    }}
                  >
                    <FaPlus size={14} />
                    <span>Add Customer</span>
                  </Button>
                </OverlayTrigger>
              </div>
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        
        <Col md={12} xs={12} className="mb-5">
        <FilterPanel 
                filters={filters}
                setFilters={setFilters}
                onClear={handleClearFilters}
                loading={loading}
                loadData={loadData}
              />
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              {error && <div className="alert alert-danger mb-4">{error}</div>}
              
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <span className="text-muted me-2">Show:</span>
                  <div className="position-relative" style={{ width: '90px' }}>
                    <Form.Select
                      size="sm"
                      value={perPage}
                      onChange={(e) => handlePerRowsChange(Number(e.target.value))}
                      className="me-2"
                      disabled={loading}
                    >
                      {TABLE_CONFIG.PAGE_SIZES.OPTIONS.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </Form.Select>
                  </div>
                  <span className="text-muted">entries per page</span>
                </div>
                <div className="text-muted">
                  <ListUl size={14} className="me-2" />
                  {loading ? (
                    <small>Loading...</small>
                  ) : (
                    `Showing ${((currentPage - 1) * perPage) + 1}-${Math.min(currentPage * perPage, totalRows)} of ${totalRows}`
                  )}
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th 
                            key={header.id}
                            style={{
                              width: header.getSize(),
                              cursor: header.column.getCanSort() ? 'pointer' : 'default',
                            }}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={columns.length} className="text-center py-5">
                          <Spinner animation="border" variant="primary" className="me-2" />
                          <span className="text-muted">Please wait while fetching all customers...</span>
                        </td>
                      </tr>
                    ) : table.getRowModel().rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="text-center py-5">
                          <div className="text-muted mb-2">No customers found</div>
                          <small>Try adjusting your search terms</small>
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="me-2 prev-btn d-flex align-items-center"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </Button>

                <div className="mx-3 d-flex align-items-center">
                  <Calendar size={14} className="me-2 text-primary" />
                  <span style={{ fontSize: '14px', color: '#6B7280' }}>
                    Page {currentPage} of {Math.ceil(totalRows / perPage)}
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="next-btn d-flex align-items-center"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <div className="Toaster">
        
      </div>
      <style jsx global>{`
      /* Button Base Styles */
      .btn-icon-text {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;
        font-size: 0.875rem;
        padding: 0.5rem 0.875rem;
        border-radius: 6px;
        transition: all 0.2s ease;
      }

      .btn-icon-text .icon-left {
        transition: transform 0.2s ease;
      }

      /* Soft Variant Styles */
      .btn-soft-danger {
        background-color: #fee2e2;
        color: #dc2626;
        border: 1px solid transparent;
      }

      .btn-soft-danger:hover {
        background-color: #dc2626;
        color: white;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(220, 38, 38, 0.15);
      }

      .btn-soft-danger:hover .icon-left {
        transform: rotate(90deg);
      }

      /* Create Button Style */
      .create-customer-button {
        background-color: #ffffff;
        color: #4171F5;
        transition: all 0.2s ease;
      }

      .create-customer-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
      }

      .create-customer-button:active {
        transform: translateY(0);
      }

      /* Card Animations */
      .card {
        transition: all 0.2s ease;
      }

      .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      /* Table Row Hover Effects */
      .table-row-hover:hover {
        background-color: #f1f5f9;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      /* View Button Hover Effects */
      .btn-icon-text:hover {
        background-color: #2563eb !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2) !important;
        color: white !important;
        text-decoration: none;
      }

      .btn-icon-text:hover .icon-left {
        transform: translateX(-2px);
      }

      /* Tooltip Styles */
      .tooltip-inner {
        max-width: 300px;
        padding: 8px 12px;
        background-color: #1e293b;
        border-radius: 6px;
        font-size: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .tooltip.show {
        opacity: 1;
      }

      /* Navigation Button Styles */
      .prev-btn,
      .next-btn {
        transition: all 0.2s ease;
      }

      .prev-btn:hover,
      .next-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .prev-btn:active,
      .next-btn:active {
        transform: translateY(0);
      }
    `}</style>
    </Fragment>
  )
}

export default ViewCustomers

// Helper function to format SAP address
const formatSAPAddress = (address) => {
    if (!address) return '-';
    
    // Format according to SAP B1 address display format
    let formattedAddress = '';
    
    // Building/Floor/Room + Address Name 2 (if exists)
    if (address.BuildingFloorRoom) {
      formattedAddress = address.BuildingFloorRoom;
      if (address.AddressName2) {
        formattedAddress += ` ${address.AddressName2}`;
      }
    }
    
    // Add Street and other components
    const additionalParts = [
      address.Street && `${address.Street}`,
      address.ZipCode,
      address.Country === 'SG' ? 'Singapore' : 
      address.Country === 'GB' ? 'United Kingdom' : 
      address.Country === 'US' ? 'United States' : 
      address.Country
    ].filter(Boolean);
    
    if (additionalParts.length > 0) {
      formattedAddress += formattedAddress ? `, ${additionalParts.join(', ')}` : additionalParts.join(', ');
    }
    
    return formattedAddress;
  };
  

// Country flag component
const CountryFlag = ({ country }) => {
  switch (country) {
    case 'SG':
      return <SGFlag />;
    case 'GB':
      return <GBFlag />;
    case 'US':
      return <USFlag />;
    default:
      return null;
  }
};

// Add this utility function at the top with your other utility functions
const copyAddressToClipboard = (address, e) => {
  e.stopPropagation(); // Prevent cell collapse
  
  // Format address for copying
  const formattedAddress = [
    address.AddressName,
    address.BuildingFloorRoom && address.BuildingFloorRoom !== address.AddressName ? address.BuildingFloorRoom : null,
    address.Street,
    address.ZipCode,
    address.Country === 'SG' ? 'Singapore' : address.Country
  ].filter(Boolean).join(', ');

  navigator.clipboard.writeText(formattedAddress).then(() => {
    // You could use a toast notification here instead of alert
    alert('Address copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy address: ', err);
    alert('Failed to copy address');
  });
};

// Add a new validation function
const validateEmailSearch = (email) => {
  if (!email) return true; // Empty is valid
  
  // Basic email format check
  const emailRegex = /^[a-zA-Z0-9.]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Add these toast style constants at the top of your file
const TOAST_STYLES = {
  BASE: {
    background: '#fff',
    padding: '16px',
    borderRadius: '4px',
    maxWidth: '400px'
  },
  SUCCESS: {
    color: '#28a745',
    borderLeft: '6px solid #28a745'
  },
  WARNING: {
    color: '#856404',
    borderLeft: '6px solid #ffc107'
  },
  ERROR: {
    color: '#dc3545',
    borderLeft: '6px solid #dc3545'
  },
  LOADING: {
    color: '#0d6efd',
    borderLeft: '6px solid #0d6efd'
  }
};
