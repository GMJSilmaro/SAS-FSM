import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from 'firebase/firestore';

// Update the highlightText function to handle the search term properly
function highlightText(text, searchTerm) {
    if (!text || !searchTerm) return text || '';
    
    // Clean up the search term to treat it as a single term
    const cleanSearchTerm = searchTerm.trim();
    
    // Escape special characters in the search term
    const escapedSearchTerm = cleanSearchTerm
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\s+/g, '\\s+'); // Handle spaces in search term
    
    // Match the whole search term instead of individual characters
    return text.replace(
      new RegExp(`(${escapedSearchTerm})`, 'gi'),
      '[[HIGHLIGHT]]$1[[/HIGHLIGHT]]'
    );
  }

  export const performQuickSearch = async (db, searchQuery) => {
    const results = [];
    const searchQueryLower = searchQuery.trim().toLowerCase();
  
    try {
      // Search SAP customers first
      const sapCustomers = await fetch(`/api/getCustomersList?search=${encodeURIComponent(searchQuery)}&limit=10`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }).then(res => res.json());
  
      if (sapCustomers?.customers?.length) {
        sapCustomers.customers.forEach(customer => {
          // Add address fields to the search
          if (customer.CardName?.toLowerCase().includes(searchQueryLower) ||
              customer.CardCode?.toLowerCase().includes(searchQueryLower) ||
              customer.Address?.toLowerCase().includes(searchQueryLower) ||
              customer.Street?.toLowerCase().includes(searchQueryLower) ||
              customer.Block?.toLowerCase().includes(searchQueryLower) ||
              customer.ZipCode?.toLowerCase().includes(searchQueryLower) ||
              customer.City?.toLowerCase().includes(searchQueryLower)) {
            
            // Format the address for display
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
              title: highlightText(customer.CardName || 'Unnamed Customer', searchQuery),
              subtitle: `${highlightText(customer.CardCode || 'N/A', searchQuery)} | ${customer.Phone1 || 'No Phone'}`,
              address: highlightText(formattedAddress || 'No Address', searchQuery),
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

      // Search jobs and their follow-ups
      const jobsRef = collection(db, "jobs");
      const jobsSnapshot = await getDocs(query(jobsRef, where("followUpCount", ">", 0)));
      
      jobsSnapshot.forEach((doc) => {
        const jobData = doc.data();
        
        // Search through follow-ups within the job
        if (jobData.followUps) {
          Object.entries(jobData.followUps).forEach(([followUpId, followUp]) => {
            if (
              followUpId.toLowerCase().includes(searchQueryLower) ||
              followUp.notes?.toLowerCase().includes(searchQueryLower) ||
              followUp.type?.toLowerCase().includes(searchQueryLower) ||
              followUp.status?.toLowerCase().includes(searchQueryLower)
            ) {
              results.push({
                id: followUpId,
                type: 'followUp',
                title: highlightText(followUp.type || 'Untitled Follow-up', searchQuery),
                subtitle: `ID: ${highlightText(followUpId, searchQuery)} | ${followUp.status || 'No Status'}`,
                description: highlightText(followUp.notes || 'No notes', searchQuery),
                link: `/dashboard/follow-ups?followUpId=${followUpId}&status=${followUp.status}&type=${followUp.type}`,
                rawTitle: followUp.type || 'Untitled Follow-up',
                jobID: jobData.jobID,
                customerName: jobData.customerName,
                status: followUp.status,
                createdAt: followUp.createdAt
              });
            }
          });
        }

        // Existing job search logic
        if (
          jobData.jobName?.toLowerCase().includes(searchQueryLower) ||
          jobData.jobID?.toLowerCase().includes(searchQueryLower) ||
          jobData.customerName?.toLowerCase().includes(searchQueryLower)
        ) {
          results.push({
            id: doc.id,
            type: 'job',
            title: highlightText(jobData.jobName || 'Untitled Job', searchQuery),
            subtitle: `Job ID: ${highlightText(jobData.jobID, searchQuery)} | Customer: ${highlightText(jobData.customerName || 'N/A', searchQuery)}`,
            link: `/dashboard/jobs/${doc.id}`,
            rawTitle: jobData.jobName || 'Untitled Job'
          });
        }
      });

      // Search workers
      const workersRef = collection(db, "users");

      // Modified worker search to use a simpler query
      const workersSnapshot = await getDocs(query(
        workersRef,
        firestoreLimit(10)
      ));

      // No need for separate email query since we'll filter in memory
      const workerResults = new Map();

      workersSnapshot.docs.forEach((doc) => {
        if (!workerResults.has(doc.id)) {
          const workerData = doc.data();
          const searchableFields = [
            workerData.fullName,
            workerData.email,
            workerData.workerId
          ].map(field => (field || '').toLowerCase());

          // Check if any field contains the search query
          if (searchableFields.some(field => field.includes(searchQueryLower))) {
            workerResults.set(doc.id, {
              id: doc.id,
              type: 'worker',
              title: highlightText(workerData.fullName || 'Unnamed Worker', searchQuery),
              subtitle: `${highlightText(workerData.workerId || 'N/A', searchQuery)} | ${workerData.role || 'No Role'}`,
              link: `/workers/${doc.id}`,
              rawTitle: workerData.fullName || 'Unnamed Worker',
              email: highlightText(workerData.email || '', searchQuery),
              role: workerData.role
            });
          }
        }
      });

      // Add worker results to the main results array
      results.push(...workerResults.values());

      // Search follow-ups
      const followUpsRef = collection(db, "followUps");
      const followUpsSnapshot = await getDocs(query(followUpsRef, firestoreLimit(10)));
      followUpsSnapshot.forEach((doc) => {
        const followUpData = doc.data();
        // Check multiple fields
        if (
          followUpData.title?.toLowerCase().includes(searchQueryLower) ||
          followUpData.followUpID?.toLowerCase().includes(searchQueryLower) ||
          followUpData.description?.toLowerCase().includes(searchQueryLower)
        ) {
          results.push({
            id: doc.id,
            type: 'followUp',
            title: highlightText(followUpData.title || 'Untitled Follow-up', searchQuery),
            subtitle: `Follow-up ID: ${highlightText(followUpData.followUpID || 'N/A', searchQuery)}`,
            link: `/dashboard/follow-ups/${doc.id}`,
            rawTitle: followUpData.title || 'Untitled Follow-up'
          });
        }
      });

      // Sort results - prioritize SAP customers
      results.sort((a, b) => {
        const typeOrder = { customer: 1, job: 2, worker: 3, followUp: 4 };
        return typeOrder[a.type] - typeOrder[b.type];
      });

      return results.slice(0, 10);

    } catch (error) {
      console.error('Error performing quick search:', error);
      return [];
    }
  };
// Update the performGlobalSearch function to handle the full search
export const performGlobalSearch = async (db, searchQuery) => {
  try {
    const results = [];
    const searchQueryLower = searchQuery.trim().toLowerCase();

    // Search SAP customers with no limit for global search
    const sapCustomers = await fetch(`/api/getCustomersList?search=${encodeURIComponent(searchQuery)}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }).then(res => res.json());

    if (sapCustomers?.customers?.length) {
      sapCustomers.customers.forEach(customer => {
        // Add address fields to the search
        if (customer.CardName?.toLowerCase().includes(searchQueryLower) ||
            customer.CardCode?.toLowerCase().includes(searchQueryLower) ||
            customer.Address?.toLowerCase().includes(searchQueryLower) ||
            customer.Street?.toLowerCase().includes(searchQueryLower) ||
            customer.Block?.toLowerCase().includes(searchQueryLower) ||
            customer.ZipCode?.toLowerCase().includes(searchQueryLower) ||
            customer.City?.toLowerCase().includes(searchQueryLower)) {
          
          // Format the address for display
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
            title: highlightText(customer.CardName || 'Unnamed Customer', searchQuery),
            subtitle: `${highlightText(customer.CardCode || 'N/A', searchQuery)} | ${customer.Phone1 || 'No Phone'}`,
            address: highlightText(formattedAddress || 'No Address', searchQuery),
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

    // Search workers with no limit
    const workersRef = collection(db, "users");
    const workersSnapshot = await getDocs(query(workersRef));
    
    workersSnapshot.forEach((doc) => {
      const workerData = doc.data();
      if (
        workerData.fullName?.toLowerCase().includes(searchQueryLower) ||
        workerData.email?.toLowerCase().includes(searchQueryLower) ||
        workerData.workerId?.toLowerCase().includes(searchQueryLower)
      ) {
        results.push({
          id: doc.id,
          type: 'worker',
          title: highlightText(workerData.fullName || 'Unnamed Worker', searchQuery),
          subtitle: `${highlightText(workerData.workerId || 'N/A', searchQuery)} | ${workerData.role || 'No Role'}`,
          link: `/workers/${doc.id}`,
          rawTitle: workerData.fullName || 'Unnamed Worker',
          email: highlightText(workerData.email || '', searchQuery),
          role: workerData.role,
          workerId: workerData.workerId,
          profilePicture: workerData.profilePicture || '/images/avatar/NoProfile.png'
        });
      }
    });

    // Search jobs with no limit
    const jobsRef = collection(db, "jobs");
    const jobsSnapshot = await getDocs(query(jobsRef));
    jobsSnapshot.forEach((doc) => {
      const jobData = doc.data();
      if (
        jobData.jobName?.toLowerCase().includes(searchQueryLower) ||
        jobData.jobID?.toLowerCase().includes(searchQueryLower) ||
        jobData.customerName?.toLowerCase().includes(searchQueryLower)
      ) {
        results.push({
          id: doc.id,
          type: 'job',
          title: highlightText(jobData.jobName || 'Untitled Job', searchQuery),
          subtitle: `Job ID: ${highlightText(jobData.jobID, searchQuery)} | Customer: ${highlightText(jobData.customerName || 'N/A', searchQuery)}`,
          link: `/dashboard/jobs/${doc.id}`,
          rawTitle: jobData.jobName || 'Untitled Job',
          status: jobData.jobStatus,
          date: jobData.createdAt
        });
      }
    });

    // Search follow-ups with no limit
    const followUpsRef = collection(db, "followUps");
    const followUpsSnapshot = await getDocs(query(followUpsRef));
    followUpsSnapshot.forEach((doc) => {
      const followUpData = doc.data();
      if (
        followUpData.title?.toLowerCase().includes(searchQueryLower) ||
        followUpData.followUpID?.toLowerCase().includes(searchQueryLower) ||
        followUpData.description?.toLowerCase().includes(searchQueryLower)
      ) {
        results.push({
          id: doc.id,
          type: 'followUp',
          title: highlightText(followUpData.title || 'Untitled Follow-up', searchQuery),
          subtitle: `Follow-up ID: ${highlightText(followUpData.followUpID || 'N/A', searchQuery)}`,
          link: `/dashboard/follow-ups/${doc.id}`,
          rawTitle: followUpData.title || 'Untitled Follow-up',
          date: followUpData.dueDate,
          status: followUpData.status
        });
      }
    });

    // Sort results
    results.sort((a, b) => {
      const typeOrder = { customer: 1, worker: 2, job: 3, followUp: 4 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    return {
      results: results,
      totalCount: results.length,
      counts: {
        customers: results.filter(r => r.type === 'customer').length,
        workers: results.filter(r => r.type === 'worker').length,
        jobs: results.filter(r => r.type === 'job').length,
        followUps: results.filter(r => r.type === 'followUp').length
      }
    };
  } catch (error) {
    console.error('Error in performGlobalSearch:', error);
    return {
      results: [],
      totalCount: 0,
      counts: {
        customers: 0,
        workers: 0,
        jobs: 0,
        followUps: 0
      }
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