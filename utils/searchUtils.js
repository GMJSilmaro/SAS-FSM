import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from 'firebase/firestore';

// Update the highlightText function
function highlightText(text, searchTerm) {
  if (!text || !searchTerm) return text || '';
  
  // Remove existing highlight tags if they exist
  text = text.replace(/\[\[HIGHLIGHT\]\]|\[\[\/HIGHLIGHT\]\]/g, '');
  
  // Clean up the search term
  const cleanSearchTerm = searchTerm.trim();
  
  // Escape special characters in the search term
  const escapedSearchTerm = cleanSearchTerm
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');
  
  // Use a span with background highlight instead of [[HIGHLIGHT]] tags
  return text.replace(
    new RegExp(`(${escapedSearchTerm})`, 'gi'),
    '<span class="search-highlight">$1</span>'
  );
}

// Add this CSS to your global styles or component
const searchHighlightStyle = `
  .search-highlight {
    background-color: #fff3cd;
    padding: 0.1rem 0.2rem;
    border-radius: 0.2rem;
    font-weight: 500;
  }
`;

const fetchCustomers = async (searchQuery, limit = null) => {
    try {
      const queryParams = new URLSearchParams({
        search: searchQuery,
        ...(limit && { limit: limit.toString() })
      });

      const response = await fetch(`/api/getCustomersList?${queryParams}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      // First try to get the response as text
      const textResponse = await response.text();
      
      try {
        // Then parse it as JSON
        return JSON.parse(textResponse);
      } catch (parseError) {
        console.error('Invalid JSON response:', textResponse);
        return { customers: [] };
      }
    } catch (error) {
      if (error.name === 'TimeoutError') {
        console.warn('Customer API request timed out');
      } else {
        console.warn('Error fetching customers:', error);
      }
      return { customers: [] };
    }
  };

  export const globalQuickSearch = async (db, searchQuery, isQuickSearch = false) => {
    const results = [];
    const searchQueryLower = searchQuery.trim().toLowerCase();

    try {
      // Search SAP customers with better error handling
      let sapCustomers = { customers: [] };
      try {
        const response = await fetch(`/api/getCustomersList?search=${encodeURIComponent(searchQuery)}${isQuickSearch ? '&limit=10' : ''}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const textResponse = await response.text();
        sapCustomers = JSON.parse(textResponse);
      } catch (error) {
        console.warn('Error fetching customers:', error);
      }

      // Process customers
      if (sapCustomers?.customers?.length) {
        sapCustomers.customers.forEach(customer => {
          if (customer.CardName?.toLowerCase().includes(searchQueryLower) ||
              customer.CardCode?.toLowerCase().includes(searchQueryLower) ||
              customer.Address?.toLowerCase().includes(searchQueryLower) ||
              customer.Street?.toLowerCase().includes(searchQueryLower) ||
              customer.Block?.toLowerCase().includes(searchQueryLower) ||
              customer.ZipCode?.toLowerCase().includes(searchQueryLower) ||
              customer.City?.toLowerCase().includes(searchQueryLower)) {
            
            const addressParts = [
              customer.Street,
              customer.Block,
              customer.City,
              customer.ZipCode
            ].filter(Boolean);
            const formattedAddress = addressParts.join(', ');

            results.push({
              id: customer.CardCode,
              type: 'customer',
              title: customer.CardName || 'Unnamed Customer',
              subtitle: `${customer.CardCode || 'N/A'} | ${customer.Phone1 || 'No Phone'}`,
              address: formattedAddress || 'No Address',
              link: `/dashboard/customers/${customer.CardCode}`,
              rawTitle: customer.CardName || 'Unnamed Customer',
              isSAPCustomer: true,
              contractStatus: customer.U_Contract === 'Y' ? 'With Contract' : 'No Contract',
              email: customer.EmailAddress,
              phone: customer.Phone1
            });
          }
        });
      }

      // Search other collections with limits for quick search
      const collections = [
        {
          ref: collection(db, "jobs"),
          type: 'job',
          searchFields: [
            'jobName', 
            'jobID', 
            'jobStatus', 
            'customerName',
            'description',
            'location',
            'assignedWorkers.workerName',
            'followUps'
          ],
          limit: isQuickSearch ? 10 : null,
          processDocument: (doc, searchQueryLower) => {
            const data = doc.data();
            const results = [];
            
            // Check job fields first
            if (data.jobName?.toLowerCase().includes(searchQueryLower) ||
                data.jobID?.toLowerCase().includes(searchQueryLower) ||
                data.jobStatus?.toLowerCase().includes(searchQueryLower) ||
                data.customerName?.toLowerCase().includes(searchQueryLower)) {
              results.push({
                id: doc.id,
                type: 'job',
                title: highlightText(data.jobName || 'Untitled Job', searchQuery),
                subtitle: `${highlightText(data.jobID || 'No ID', searchQuery)} | ${data.customerName || 'No Customer'}`,
                link: `/dashboard/jobs/${data.jobID}`,
                rawTitle: data.jobName || 'Untitled Job',
                status: data.jobStatus,
                date: data.createdAt,
                customerName: data.customerName,
                priority: data.priority
              });
            }

            // Check followUps
            if (data.followUps) {
              Object.entries(data.followUps).forEach(([followUpId, followUp]) => {
                if (followUp.notes?.toLowerCase().includes(searchQueryLower) ||
                    followUp.status?.toLowerCase().includes(searchQueryLower) ||
                    followUp.type?.toLowerCase().includes(searchQueryLower)) {
                  results.push({
                    id: followUpId,
                    type: 'followUp',
                    title: highlightText(followUp.notes || 'Untitled Follow-up', searchQuery),
                    subtitle: `${highlightText(followUp.type || 'No Type', searchQuery)} | ${followUp.status || 'No Status'} | ${data.jobID}`,
                    link: `/dashboard/jobs/${data.jobID}?followUp=${followUpId}`,
                    rawTitle: followUp.notes || 'Untitled Follow-up',
                    status: followUp.status,
                    date: followUp.createdAt,
                    jobID: data.jobID,
                    jobName: data.jobName,
                    customerName: data.customerName
                  });
                }
              });
            }

            return results;
          }
        },
        {
          ref: collection(db, "users"),
          type: 'worker',
          searchFields: [
            'fullName', 
            'email', 
            'workerId',
            'role',
            'department',
            'status'
          ],
          limit: isQuickSearch ? 10 : null
        },
       
      ];

      // Process each collection
      for (const col of collections) {
        const q = col.limit 
          ? query(col.ref, firestoreLimit(col.limit))
          : query(col.ref);
        
        const snapshot = await getDocs(q);
        
        snapshot.forEach(doc => {
          if (col.processDocument) {
            // Use custom document processor if provided
            const processedResults = col.processDocument(doc, searchQueryLower);
            results.push(...processedResults);
          } else {
            // Use default processing for other collections
            const data = doc.data();
            if (col.searchFields.some(field => 
              data[field]?.toLowerCase().includes(searchQueryLower)
            )) {
              results.push({
                id: doc.id,
                type: col.type,
                title: highlightText(data.title || data.jobName || data.fullName || 'Untitled', searchQuery),
                subtitle: getSubtitleForType(col.type, data, searchQuery),
                link: getLinkForType(col.type, doc.id, data),
                rawTitle: data.title || data.jobName || data.fullName || 'Untitled',
                status: data.status || data.jobStatus,
                date: data.dueDate || data.createdAt
              });
            }
          }
        });
      }

      // Sort results
      results.sort((a, b) => {
        const typeOrder = { customer: 1, job: 2, worker: 3, followUp: 4 };
        return typeOrder[a.type] - typeOrder[b.type];
      });

      // Return different formats based on search type
      if (isQuickSearch) {
        return results.slice(0, 10);
      }

      return {
        results,
        totalCount: results.length,
        counts: {
          customers: results.filter(r => r.type === 'customer').length,
          workers: results.filter(r => r.type === 'worker').length,
          jobs: results.filter(r => r.type === 'job').length,
          followUps: results.filter(r => r.type === 'followUp').length
        }
      };

    } catch (error) {
      console.error('Error in globalQuickSearch:', error);
      return isQuickSearch ? [] : {
        results: [],
        totalCount: 0,
        counts: { customers: 0, workers: 0, jobs: 0, followUps: 0 }
      };
    }
  };

const renderHighlightedText = (text) => {
    if (!text) return '';
    
    const parts = text.split(/\[\[HIGHLIGHT\]\]|\[\[\/HIGHLIGHT\]\]/);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span 
            key={index}
            className="bg-light-primary text-primary"
            style={{ 
              padding: '0.1rem 0.3rem',
              borderRadius: '0.2rem',
              fontWeight: '600'
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

// Add these helper functions
const getCategoryConfig = (type) => {
  const configs = {
    customer: {
      highlightBg: '#e6f4ff',
      highlightText: '#0066cc',
      icon: 'fe-users'
    },
    worker: {
      highlightBg: '#e6ffe6',
      highlightText: '#008000',
      icon: 'fe-user-check'
    },
    job: {
      highlightBg: '#fff3e6',
      highlightText: '#cc6600',
      icon: 'fe-briefcase'
    },
    followUp: {
      highlightBg: '#ffe6e6',
      highlightText: '#cc0000',
      icon: 'fe-clock'
    }
  };
  
  return configs[type.toLowerCase()] || configs.customer;
};

const getTypeLabel = (type) => {
  const labels = {
    customer: 'Customer',
    worker: 'Worker',
    job: 'Job',
    followUp: 'Follow-up'
  };
  
  return labels[type] || type;
};

// Add this helper function for subtitles
const getSubtitleForType = (type, data, searchQuery) => {
  switch (type) {
    case 'customer':
      return `${data.CardCode || 'No ID'} | ${data.Phone1 || 'No Phone'}`;
    case 'worker':
      return `${data.workerId || 'No ID'} | ${data.role || 'No Role'} | ${data.status || 'Active'}`;
    case 'job':
      return `${data.jobID || 'No ID'} | ${data.jobStatus || 'No Status'} | ${data.customerName || 'No Customer'}`;
    case 'followUp':
      return `${data.type || 'No Type'} | ${data.status || 'No Status'} | Job: ${data.jobID || 'No Job'}`;
    default:
      return '';
  }
};

// Add this helper function at the top of your file
const getLinkForType = (type, id, data) => {
  switch (type) {
    case 'customer':
      return `/dashboard/customers/${data.CardCode || id}`;
    case 'worker':
      return `/workers/view/${data.workerId || id}`;
    case 'job':
      return `/dashboard/jobs/${data.jobID || id}`;
    case 'followUp':
      return `/dashboard/jobs/${data.jobID}?followUp=${id}`;
    default:
      return '#';
  }
};



// Update the search processing function
const processSearchResults = (doc, col, searchQuery) => {
  const data = doc.data();
  let title = '';
  
  switch (col.type) {
    case 'worker':
      // Properly format worker name from parts
      title = [
        data.firstName || '',
        data.middleName || '',
        data.lastName || ''
      ].filter(Boolean).join(' ') || data.fullName || 'Unnamed Worker';
      break;
      
    case 'followUp':
      // Clean up followUp title
      title = data.type || 'Follow-up';
      if (data.notes) {
        title += `: ${data.notes}`;
      }
      break;
      
    case 'job':
      title = data.jobName || 'Untitled Job';
      break;
      
    case 'customer':
      title = data.CardName || data.customerName || 'Unnamed Customer';
      break;
      
    default:
      title = data.title || 'Untitled';
  }

  return {
    id: doc.id,
    type: col.type,
    title: highlightText(title, searchQuery),
    subtitle: getFormattedSubtitle(col.type, data),
    link: getLinkForType(col.type, doc.id, data),
    status: data.status || data.jobStatus,
    email: data.email || data.EmailAddress,
    address: getFormattedAddress(data),
    workerId: data.workerId || data.CardCode,
    role: data.role || data.jobType
  };
};

// Add helper function to format subtitle
const getFormattedSubtitle = (type, data) => {
  switch (type) {
    case 'worker':
      return `${data.workerId || 'No ID'} | ${data.role || 'Worker'} | ${data.status || 'Active'}`;
    case 'job':
      return `${data.jobID || 'No ID'} | ${data.customerName || 'No Customer'}`;
    case 'followUp':
      return `${data.type || 'Follow-up'} | ${data.status || 'No Status'} | ${data.jobID || 'No Job'}`;
    case 'customer':
      return `${data.CardCode || 'No ID'} | ${data.Phone1 || 'No Phone'}`;
    default:
      return '';
  }
};

// Add helper function to format address
const getFormattedAddress = (data) => {
  if (!data) return '';
  
  const addressParts = [
    data.Street,
    data.Block,
    data.City,
    data.ZipCode
  ].filter(Boolean);
  
  return addressParts.length > 0 ? addressParts.join(', ') : '';
};