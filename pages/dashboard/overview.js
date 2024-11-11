// imports.js
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Badge,
  Dropdown,
} from "react-bootstrap";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import Swal from "sweetalert2";
import Cookies from "js-cookie";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { useRouter } from "next/router";
import { FaBell, FaPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { memo } from 'react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

// Constants
const TIME_FILTERS = ["Today", "This Week", "This Month", "This Year"];
const CHART_COLORS = {
  completed: "#008000",
  pending: "#f6c23e",
  emergency: "#e74a3b",
  maintenance: "#1cc88a",
  installation: "#FFB800", // Bright yellow for installation
  repair: "#36B9CC",       // Turquoise for repair
  other: "#858796",        // Gray for other/unknown types
  default: "#858796"       // Default gray color
};

const FilterButtons = memo(({ currentFilter, onFilterChange }) => {
  return (
    <div className="d-flex gap-2">
      {TIME_FILTERS.map((filter) => (
        <Button
          key={filter}
          onClick={() => onFilterChange(filter)}
          variant={currentFilter === filter ? "light" : "outline-light"}
          className="filter-button"
          style={{
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s ease",
          }}
        >
          {filter}
        </Button>
      ))}
    </div>
  );
});

// Optionally add a display name for debugging purposes
FilterButtons.displayName = 'FilterButtons';

// LoadingOverlay Component
const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

// Helper Functions
const getDateRange = (period) => {
  // Create dates in local timezone
  const now = new Date();
  const start = new Date();
  const end = new Date();

  // Reset hours for consistent comparison
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "Today":
      // No additional modification needed - already set for today
      break;
    case "This Week":
      // Get Monday of current week
      const dayOfWeek = start.getDay();
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      start.setDate(diff);
      end.setDate(start.getDate() + 6);
      break;
    case "This Month":
      start.setDate(1);
      end.setMonth(start.getMonth() + 1, 0);
      break;
    case "This Year":
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      break;
    default:
      // Default to today
      break;
  }

  return { start, end };
};

const useFirebaseCache = () => {
  const cache = useRef(new Map());
  const lastFetch = useRef(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const fetchWithCache = useCallback(async (key, fetchFn) => {
    const now = Date.now();
    const cached = cache.current.get(key);

    if (cached && now - lastFetch.current < CACHE_DURATION) {
      console.log('Using cached data for:', key);
      return cached;
    }

    console.log('Fetching fresh data for:', key);
    const data = await fetchFn();
    cache.current.set(key, data);
    lastFetch.current = now;
    return data;
  }, []);

  return { fetchWithCache };
};

// Main Component
const Overview = () => {
  // Router
  const router = useRouter();

  // State Management
  const [timeFilter, setTimeFilter] = useState("Today");
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [allJobs, setAllJobs] = useState([]);
  const [lastLoginTime, setLastLoginTime] = useState(null);

  // Dashboard Metrics
  const [newJobsCount, setNewJobsCount] = useState(0);
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [taskGrowth, setTaskGrowth] = useState(0);
  const [activeWorkers, setActiveWorkers] = useState(0);

    // Add cache hook
    const { fetchWithCache } = useFirebaseCache();


    // Add new state for filtered metrics
    const [filteredMetrics, setFilteredMetrics] = useState({
      totalTasks: 0,
      activeWorkers: 0,
      pendingTasks: 0,
      completedTasks: 0,
      taskGrowth: 0
    });

  // Chart Data
  const [performanceData, setPerformanceData] = useState({
    labels: [],
    datasets: [
      {
        label: "Completed",
        data: [],
        backgroundColor: CHART_COLORS.completed,
      },
      {
        label: "Pending/Created",
        data: [],
        backgroundColor: CHART_COLORS.pending,
      },
    ],
  });

  const [taskDistributionData, setTaskDistributionData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
      },
    ],
  });

  // Memoized Values
  const chartOptions = useMemo(
    () => ({
      bar: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 12, family: "'Inter', sans-serif" } },
          },
          y: {
            beginAtZero: true,
            grid: {
              borderDash: [2],
              drawBorder: false,
              color: "rgba(0, 0, 0, 0.05)",
            },
            ticks: { font: { size: 12, family: "'Inter', sans-serif" } },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              font: { size: 12, family: "'Inter', sans-serif" },
              usePointStyle: true,
              padding: 20,
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleFont: { size: 13, family: "'Inter', sans-serif" },
            bodyFont: { size: 12, family: "'Inter', sans-serif" },
            padding: 12,
            cornerRadius: 8,
          },
        },
      },
      pie: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              font: { size: 12, family: "'Inter', sans-serif" },
              usePointStyle: true,
              padding: 20,
              generateLabels: (chart) => {
                const { labels, datasets } = chart.data;
                return labels.map((label, index) => ({
                  text: `${label} (${datasets[0].data[index]})`,
                  fillStyle: datasets[0].backgroundColor[index],
                  strokeStyle: '#ffffff',
                  lineWidth: 1,
                  hidden: false,
                  index
                }));
              }
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.formattedValue;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.raw / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      },
    }),
    []
  );

// Enhanced updateDashboardStats function
const updateDashboardStats = useCallback((filteredJobs, dateRange) => {
  console.log('Starting updateDashboardStats with:', {
    totalJobs: filteredJobs.length,
    dateRange: {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString()
    }
  });

  try {
    // Calculate total tasks
    const totalFilteredTasks = filteredJobs.length;
    setTotalTasks(totalFilteredTasks);
    console.log('Total Tasks:', totalFilteredTasks);

    // Calculate active workers
    const uniqueWorkers = new Set(
      filteredJobs.flatMap(job => 
        job.assignedWorkers
          ?.filter(worker => job.jobStatus === "In Progress")
          ?.map(worker => worker.id) || []
      )
    );
    setActiveWorkers(uniqueWorkers.size);
    console.log('Active Workers:', uniqueWorkers.size);

    // Calculate pending tasks
    const pendingCount = filteredJobs.filter(
      (job) => job.jobStatus === "Created" || job.jobStatus === "In Progress"
    ).length;
    setPendingTasks(pendingCount);
    console.log('Pending Tasks:', pendingCount);

    // Calculate completed tasks
    const completedCount = filteredJobs.filter(
      (job) => job.jobStatus === "Completed" || job.jobStatus === "Job Complete"
    ).length;
    setCompletedToday(completedCount);
    console.log('Completed Tasks:', completedCount);

    // Calculate active jobs
    const activeCount = filteredJobs.filter(
      (job) => job.jobStatus === "In Progress"
    ).length;
    setActiveJobsCount(activeCount);
    console.log('Active Jobs:', activeCount);

    // Calculate new jobs (created in last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newCount = filteredJobs.filter(
      (job) => 
        job.jobStatus === "Created" && 
        job.createdAt >= twentyFourHoursAgo
    ).length;
    setNewJobsCount(newCount);
    console.log('New Jobs:', newCount);

    // Calculate growth rate
    const previousPeriodStart = new Date(dateRange.start);
    const periodDuration = dateRange.end.getTime() - dateRange.start.getTime();
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDuration);

    const previousJobs = filteredJobs.filter(
      (job) =>
        job.createdAt >= previousPeriodStart &&
        job.createdAt < dateRange.start
    );

    const growth =
      previousJobs.length === 0
        ? filteredJobs.length > 0
          ? 100
          : 0
        : Math.round(
            ((filteredJobs.length - previousJobs.length) /
              previousJobs.length) *
              100
          );
    setTaskGrowth(growth);
    console.log('Growth Rate:', growth);

    // Update filtered metrics state
    const newMetrics = {
      totalTasks: totalFilteredTasks,
      activeWorkers: uniqueWorkers.size,
      pendingTasks: pendingCount,
      completedTasks: completedCount,
      taskGrowth: growth
    };
    setFilteredMetrics(newMetrics);
    console.log('Updated Metrics:', newMetrics);

  } catch (error) {
    console.error('Error in updateDashboardStats:', error);
    toast.error("Error updating dashboard statistics");
  }
}, []);

// Enhanced updateChartData function
const updateChartData = useCallback((filteredJobs, period) => {
  console.log('updateChartData called with:', {
    filteredJobsCount: filteredJobs.length,
    period
  });

  let performanceLabels = [];
  let completedData = [];
  let pendingData = [];
  let inProgressData = [];

  if (period === "Today") {
    // Hourly data for today
    performanceLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const hourlyData = Array(24).fill(0).map(() => ({
      completed: 0,
      pending: 0,
      inProgress: 0
    }));

    filteredJobs.forEach(job => {
      if (job.createdAt) {
        const hour = new Date(job.createdAt).getHours();
        switch (job.jobStatus) {
          case "Completed":
          case "Job Complete":
            hourlyData[hour].completed++;
            break;
          case "Created":
            hourlyData[hour].pending++;
            break;
          case "In Progress":
            hourlyData[hour].inProgress++;
            break;
        }
      }
    });

    completedData = hourlyData.map(h => h.completed);
    pendingData = hourlyData.map(h => h.pending);
    inProgressData = hourlyData.map(h => h.inProgress);

  } else if (period === "This Week") {
    // Daily data for the week
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    performanceLabels = days;
    const dailyData = days.map(() => ({
      completed: 0,
      pending: 0,
      inProgress: 0
    }));

    filteredJobs.forEach(job => {
      if (job.createdAt) {
        const dayIndex = new Date(job.createdAt).getDay();
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Adjust Sunday from 0 to 6
        
        switch (job.jobStatus) {
          case "Completed":
          case "Job Complete":
            dailyData[adjustedIndex].completed++;
            break;
          case "Created":
            dailyData[adjustedIndex].pending++;
            break;
          case "In Progress":
            dailyData[adjustedIndex].inProgress++;
            break;
        }
      }
    });

    completedData = dailyData.map(d => d.completed);
    pendingData = dailyData.map(d => d.pending);
    inProgressData = dailyData.map(d => d.inProgress);

  } else if (period === "This Month") {
    // Weekly data for the month
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
    performanceLabels = weeks;
    const weeklyData = weeks.map(() => ({
      completed: 0,
      pending: 0,
      inProgress: 0
    }));

    filteredJobs.forEach(job => {
      if (job.createdAt) {
        const date = new Date(job.createdAt);
        const weekIndex = Math.floor((date.getDate() - 1) / 7);
        
        switch (job.jobStatus) {
          case "Completed":
          case "Job Complete":
            weeklyData[weekIndex].completed++;
            break;
          case "Created":
            weeklyData[weekIndex].pending++;
            break;
          case "In Progress":
            weeklyData[weekIndex].inProgress++;
            break;
        }
      }
    });

    completedData = weeklyData.map(w => w.completed);
    pendingData = weeklyData.map(w => w.pending);
    inProgressData = weeklyData.map(w => w.inProgress);

  } else if (period === "This Year") {
    // Monthly data for the year
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    performanceLabels = months;
    const monthlyData = months.map(() => ({
      completed: 0,
      pending: 0,
      inProgress: 0
    }));

    filteredJobs.forEach(job => {
      if (job.createdAt) {
        const monthIndex = new Date(job.createdAt).getMonth();
        
        switch (job.jobStatus) {
          case "Completed":
          case "Job Complete":
            monthlyData[monthIndex].completed++;
            break;
          case "Created":
            monthlyData[monthIndex].pending++;
            break;
          case "In Progress":
            monthlyData[monthIndex].inProgress++;
            break;
        }
      }
    });

    completedData = monthlyData.map(m => m.completed);
    pendingData = monthlyData.map(m => m.pending);
    inProgressData = monthlyData.map(m => m.inProgress);
  }

  // Update performance chart data
  setPerformanceData({
    labels: performanceLabels,
    datasets: [
      {
        label: "Completed",
        data: completedData,
        backgroundColor: CHART_COLORS.completed,
      },
      {
        label: "Created",
        data: pendingData,
        backgroundColor: CHART_COLORS.pending,
      },
      {
        label: "In Progress",
        data: inProgressData,
        backgroundColor: CHART_COLORS.maintenance,
      },
    ],
  });

  // Update task distribution chart
  const jobTypes = filteredJobs.reduce((acc, job) => {
    let typeName = 'Other';
    
    if (job.jobContactType) {
      if (typeof job.jobContactType === 'string') {
        typeName = job.jobContactType;
      } else if (job.jobContactType.name) {
        typeName = job.jobContactType.name;
      }
    }

    // Normalize the type name
    typeName = typeName.charAt(0).toUpperCase() + typeName.slice(1).toLowerCase();
    acc[typeName] = (acc[typeName] || 0) + 1;
    return acc;
  }, {});

  // Sort job types by count
  const sortedTypes = Object.entries(jobTypes)
    .sort(([, a], [, b]) => b - a)
    .reduce((obj, [key, value]) => ({
      ...obj,
      [key]: value
    }), {});

  // Create color map for job types
  const typeColors = Object.keys(sortedTypes).map(type => {
    const lowerType = type.toLowerCase();
    // If type is "Other" or unknown, use gray
    if (lowerType === 'other' || !CHART_COLORS[lowerType]) {
      return CHART_COLORS.other;
    }
    return CHART_COLORS[lowerType];
  });

  setTaskDistributionData({
    labels: Object.keys(sortedTypes),
    datasets: [{
      data: Object.values(sortedTypes),
      backgroundColor: typeColors,
      borderWidth: 1,
      borderColor: '#ffffff',
      hoverBorderColor: '#ffffff',
      hoverBorderWidth: 2,
    }],
  });

}, []);

// Enhanced filter jobs function with better date handling
const filterJobsByDateRange = useCallback((jobs, dateRange) => {
  console.log('Filtering jobs with date range:', {
    start: dateRange.start.toISOString(),
    end: dateRange.end.toISOString(),
    totalJobs: jobs.length
  });

  const filteredJobs = jobs.filter((job) => {
    // Skip invalid dates
    if (!job.createdAt || !(job.createdAt instanceof Date)) {
      console.log('Skipping job with invalid date:', job.id);
      return false;
    }

    // Normalize job date to start of day for consistent comparison
    const jobDate = new Date(job.createdAt);
    
    // Check if job is within range
    const isInRange = jobDate >= dateRange.start && jobDate <= dateRange.end;

    if (!isInRange) {
      console.log('Job outside range:', {
        jobId: job.id,
        jobDate: jobDate.toISOString(),
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString()
      });
    }

    return isInRange;
  });

  console.log('Filtered jobs result:', {
    totalJobs: jobs.length,
    filteredJobs: filteredJobs.length,
    period: dateRange.start.toLocaleDateString() + ' to ' + dateRange.end.toLocaleDateString()
  });

  return filteredJobs;
}, []);

// Optimize data fetching
const fetchInitialData = useCallback(async () => {
  try {
    setIsInitialLoading(true);

    // Cache user details fetch
    const currentEmail = Cookies.get("email");
    if (currentEmail) {
      const userData = await fetchWithCache(`user-${currentEmail}`, async () => {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", currentEmail));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : querySnapshot.docs[0].data();
      });

      if (userData) {
        setUserDetails(userData);
        if (userData.timestamp) {
          setLastLoginTime(new Date(
            userData.timestamp.seconds * 1000 + 
            userData.timestamp.nanoseconds / 1000000
          ));
        }
      }
    }

    // Cache jobs fetch
    const jobs = await fetchWithCache('all-jobs', async () => {
      const jobsRef = collection(db, "jobs");
      const jobsQuery = query(jobsRef, orderBy("createdAt", "desc"));
      const jobsSnapshot = await getDocs(jobsQuery);
      
      return jobsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.seconds ? 
          new Date(doc.data().createdAt.seconds * 1000) :
          new Date(doc.data().formattedStartDateTime || null)
      })).filter(job => job.createdAt && !isNaN(job.createdAt.getTime()));
    });

    setAllJobs(jobs);

    // Initial calculations
    const dateRange = getDateRange("Today");
    const filteredJobs = filterJobsByDateRange(jobs, dateRange);
    updateDashboardStats(filteredJobs, dateRange);
    updateChartData(filteredJobs, "Today");

  } catch (error) {
    console.error("Error in fetchInitialData:", error);
    toast.error("Error loading dashboard data");
  } finally {
    setIsInitialLoading(false);
  }
}, [fetchWithCache]);

// Optimize useEffect
useEffect(() => {
  fetchInitialData();
}, [fetchInitialData]);

// Memoize stats calculation
const calculateStats = useMemo(() => ({
  pendingCount: allJobs.filter(job => 
    job.jobStatus === "Created" || job.jobStatus === "In Progress"
  ).length,
  completedCount: allJobs.filter(job => 
    job.jobStatus === "Completed" || job.jobStatus === "Job Complete"
  ).length,
  activeCount: allJobs.filter(job => 
    job.jobStatus === "In Progress"
  ).length
}), [allJobs]);

// Modified handleTimeFilterChange
const handleTimeFilterChange = useCallback((period) => {
  console.log('Time filter changed to:', period);
  setTimeFilter(period);
  setIsLoading(true);

  try {
    const dateRange = getDateRange(period);
    console.log('Date range:', {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString()
    });

    const filteredJobs = filterJobsByDateRange(allJobs, dateRange);
    console.log('Filtered jobs:', filteredJobs.length);

    // State updates will automatically be batched in React 18
    updateDashboardStats(filteredJobs, dateRange);
    updateChartData(filteredJobs, period);

  } catch (error) {
    console.error("Error updating dashboard:", error);
    toast.error("Error updating filter");
  } finally {
    setIsLoading(false);
  }
}, [allJobs, filterJobsByDateRange, updateDashboardStats, updateChartData]);
// Navigation handlers
const handleNewTask = () => router.push("/jobs/create");

const addWelcomeAlertStyles = (popup) => {
  const style = document.createElement("style");
  style.textContent = `
    .welcome-container {
      display: flex;
      gap: 24px;
      height: 600px;
      width: 100%;
      background: white;
      position: relative;
    }

    .welcome-left {
      width: 300px;
      flex-shrink: 0;
      padding: 24px;
      border-right: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      background: white;
    }

    .welcome-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      max-width: 800px;
      position: relative;
      overflow: hidden;
    }

    .welcome-header-fixed {
      position: sticky;
      top: 0;
      background: white;
      padding: 16px 20px;
      z-index: 10;
      border-bottom: 1px solid #e5e7eb;
    }

    .welcome-title {
      text-align: left;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title-row h2 {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
    }

    .subtitle {
      color: #64748b;
      font-size: 14px;
      margin: 4px 0 0 32px;
    }

    .features-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      padding-bottom: 20px;
    }

    .feature-item {
      background: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      border: 1px solid #e5e7eb;
      height: 100%;
      min-height: 180px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .feature-item.highlight {
      background: linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%);
      color: white;
    }

    .feature-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .feature-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .feature-content h4 {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      color: inherit;
    }

    .feature-content p {
      font-size: 13px;
      margin: 0;
      line-height: 1.4;
      color: inherit;
      opacity: 0.9;
    }

    .feature-tags {
      margin-top: 8px;
    }

    .tag {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .tag.new {
      background: #dcfce7;
      color: #166534;
    }

    .feature-item.highlight .tag.new {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .tag.improved {
      background: #e0f2fe;
      color: #075985;
    }

    .feature-item.highlight .tag.improved {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .close-button {
      position: absolute;
      top: 16px;
      right: 16px;
      background: transparent;
      border: none;
      color: #64748b;
      padding: 4px;
      cursor: pointer;
      z-index: 10;
      transition: all 0.2s ease;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-button:hover {
      background: #f1f5f9;
      color: #1e293b;
      transform: rotate(90deg);
    }

    .user-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .avatar-img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      margin-bottom: 16px;
    }

    .user-info h2 {
      font-size: 18px;
      margin: 0;
      color: #1e293b;
    }

    .user-role {
      color: #64748b;
      font-size: 14px;
      margin: 4px 0;
    }

    .last-login {
      font-size: 13px;
      color: #64748b;
    }

    .stats-row {
      display: flex;
      gap: 16px;
      margin-top: 24px;
    }

    .stat-item {
      flex: 1;
      text-align: center;
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .stat-item h3 {
      font-size: 24px;
      margin: 0;
      color: #1e293b;
    }

    .stat-item p {
      font-size: 13px;
      color: #64748b;
      margin: 4px 0 0;
    }

    .features-container::-webkit-scrollbar {
      width: 8px;
    }

    .features-container::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 4px;
    }

    .features-container::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    .features-container::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
    
    
.feature-item {
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  border: 1px solid #e5e7eb;
  height: 100%;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.feature-item.highlight {
  background: linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%);
  color: white;
}

.feature-item.highlight::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
  transform: rotate(45deg);
  animation: shine 3s infinite;
}

@keyframes shine {
  0% { transform: translateX(-30%) translateY(-30%) rotate(45deg); }
  100% { transform: translateX(30%) translateY(30%) rotate(45deg); }
}

.tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.tag.new {
  background: #dcfce7;
  color: #166534;
  animation: sparkle 1.5s infinite;
}

.tag.improved {
  background: #e0f2fe;
  color: #075985;
  animation: pulse 2s infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; transform: scale(1.05); }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.feature-item.highlight .tag.new,
.feature-item.highlight .tag.improved {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.feature-item.highlight:hover {
  background: linear-gradient(135deg, #2563EB 0%, #0891B2 100%);
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.feature-icon {
  font-size: 24px;
  margin-bottom: 8px;
  transition: transform 0.3s ease;
}

.feature-item:hover .feature-icon {
  transform: scale(1.1);
}

.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  color: #64748b;
  padding: 4px;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: #f1f5f9;
  color: #1e293b;
  transform: rotate(90deg);
}

.stats-row {
  display: flex;
  gap: 16px;
  margin-top: 24px;
  animation: fadeInUp 0.5s ease-out;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-container {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.user-header {
  animation: slideDown 0.5s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tooltip-container {
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
  position: relative;
  cursor: pointer;
}

.tooltip-container::before {
  content: "Stay updated with our latest features and improvements. We regularly enhance our platform to provide you with better tools and capabilities.";
  position: absolute;
  top: -10px;
  right: -10px;
  transform: translateX(100%);
  background-color: #1e293b;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  width: 250px;
  white-space: normal;
  z-index: 1000;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
}

.tooltip-container::after {
  content: "";
  position: absolute;
  top: 50%;
  right: -16px;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-right-color: #1e293b;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
}

.tooltip-container:hover::before,
.tooltip-container:hover::after {
  opacity: 1;
  visibility: visible;
}
  `;
  document.head.appendChild(style);

  const closeButton = document.createElement("button");
  closeButton.className = "close-button";
  closeButton.innerHTML = `
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  `;
  closeButton.onclick = () => Swal.close();
  popup.querySelector(".welcome-container").appendChild(closeButton);
};

const handleWhatsNewClick = () => {
  const userName = userDetails?.fullName || userDetails?.displayName || "User";
  const userRole = userDetails?.role || "User";
  const userAvatar = userDetails?.profilePicture || "/default-avatar.png";
  const lastLogin = lastLoginTime
    ? lastLoginTime.toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "First time login";

  Swal.fire({
    html: `
      <div class="welcome-container">
        <div class="welcome-left">
          <div class="user-header">
            <img src="${userAvatar}" class="avatar-img" alt="Profile"/>
            <div class="user-info">
              <h2>Welcome back, ${userName}!</h2>
              <p class="user-role">${userRole}</p>
              
            </div>
          </div>

          ${newJobsCount > 0 ? `
            <div class="stats-row">
              <div class="stat-item">
                <h3>${newJobsCount}</h3>
                <p>New Jobs</p>
              </div>
              <div class="stat-item">
                <h3>${activeJobsCount}</h3>
                <p>Active Jobs</p>
              </div>
            </div>
          ` : `
            <div class="stats-row">
              <div class="stat-item">
                <h3>${activeJobsCount}</h3>
                <p>Active Jobs</p>
              </div>
            </div>
          `}
        </div>

        <div class="welcome-right">
          <div class="welcome-header-fixed">
            <div class="welcome-title">
              <div class="title-row">
                <h2>
                  <span role="img" aria-label="celebration">🎉</span>
                  What's New!
                   <div class="tooltip-container">
                    <i class="fas fa-question-circle"></i>
                  </div>
                </h2>
              </div>
              <p class="subtitle">Discover our latest features and improvements</p>
            </div>
          </div>
          <div class="features-container">
            <div class="features-grid">
              <div class="feature-item highlight">
                <div class="feature-icon">🚀</div>
                <div class="feature-content">
                  <h4>Enhanced Dashboard 2.0</h4>
                  <p>Experience our most powerful insights yet.</p>
                  <div class="feature-tags">
                    <span class="tag new">New</span>
                  </div>
                </div>
              </div>

              <div class="feature-item highlight">
                <div class="feature-icon">🏢</div>
                <div class="feature-content">
                  <h4>Customer Sub-Locations</h4>
                  <p>Search multiple locations per customer with enhanced hierarchy.</p>
                  <div class="feature-tags">
                    <span class="tag new">New</span>
                  </div>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon">🔍</div>
                <div class="feature-content">
                  <h4>Smart Global Search</h4>
                  <p>Enhanced search with filters and real-time suggestions.</p>
                  <div class="feature-tags">
                    <span class="tag improved">Improved</span>
                  </div>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon">🔐</div>
                <div class="feature-content">
                  <h4>Advanced Authentication</h4>
                  <p>Enhanced session management with security controls and auto-renewal.</p>
                  <div class="feature-tags">
                    <span class="tag improved">Improved</span>
                  </div>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon">✨</div>
                <div class="feature-content">
                  <h4>UI Refresh</h4>
                  <p>Modern interface with improved accessibility and navigation.</p>
                  <div class="feature-tags">
                    <span class="tag improved">Improved</span>
                  </div>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon">⚡</div>
                <div class="feature-content">
                  <h4>Performance Boost</h4>
                  <p>Faster page loads and smoother transitions.</p>
                  <div class="feature-tags">
                    <span class="tag improved">Improved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    showConfirmButton: false,
    width: "1000px",
    padding: 0,
    customClass: {
      popup: "welcome-popup",
    },
    didRender: (popup) => {
      addWelcomeAlertStyles(popup);
    },
  });
};

return (
  <div className="dashboard-wrapper">
    <LoadingOverlay isLoading={isLoading || isInitialLoading} />
    
    {/* Header Section */}
    <div className="dashboard-header">
      <div
        style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
          padding: "1.5rem 2rem",
          borderRadius: "0 0 24px 24px",
          marginTop: "-40px",
          marginBottom: "20px",
        }}
      >
        <div className="d-flex flex-column gap-4">
          {/* Header Content */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 className="h3 text-white fw-bold mb-1">
                Field Services Dashboard
              </h1>
              <p className="mb-0 text-white">
                Welcome back,{" "}
                <span className="fw-medium">
                  {userDetails?.fullName || "NA"}
                </span>{" "}
                👋
              </p>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-3 align-items-center">
              <Button
                onClick={handleWhatsNewClick}
                className="whats-new-button"
                variant="outline-light"
              >
                <FaBell size={16} />
                <span>What's New</span>
              </Button>

              <Button
                onClick={handleNewTask}
                className="create-job-button"
                variant="light"
              >
                <FaPlus size={16} />
                <span>Create Job</span>
              </Button>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="d-flex justify-content-between align-items-center">
            <FilterButtons
              currentFilter={timeFilter}
              onFilterChange={handleTimeFilterChange}
            />
          </div>
        </div>
      </div>
    </div>

    {/* Dashboard Content */}
    <Container>
   
            {/* Stats Row */}
            <Row className="g-4 mb-4">
          {/* Total Jobs Card */}
          <Col lg={3} sm={6}>
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1">Total Jobs ({timeFilter})</p>
                    <h3 className="mb-1">{totalTasks}</h3>
                    <span className={`text-${taskGrowth >= 0 ? 'success' : 'danger'}`}>
                      <i className={`fas fa-arrow-${taskGrowth >= 0 ? 'up' : 'down'} me-1`}></i>
                      {Math.abs(taskGrowth)}% {taskGrowth >= 0 ? 'increase' : 'decrease'}
                    </span>
                  </div>
                  <div className="stat-icon">
                    <i className="fas fa-tasks text-primary"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Active Workers Card */}
          <Col lg={3} sm={6}>
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1">Active Workers ({timeFilter})</p>
                    <h3 className="mb-1">{activeWorkers}</h3>
                    <Badge bg={activeWorkers > 0 ? "success" : "warning"}>
                      {activeWorkers > 0 ? 'Active' : 'No Active Workers'}
                    </Badge>
                  </div>
                  <div className="stat-icon">
                    <i className="fas fa-users text-success"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Pending Jobs Card */}
          <Col lg={3} sm={6}>
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1">Pending Jobs ({timeFilter})</p>
                    <h3 className="mb-1">{pendingTasks}</h3>
                    <Badge bg={pendingTasks > 5 ? "danger" : "warning"}>
                      {pendingTasks > 5 ? 'Critical' : 'Urgent'}
                    </Badge>
                  </div>
                  <div className="stat-icon">
                    <i className="fas fa-clock text-warning"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Completed Jobs Card */}
          <Col lg={3} sm={6}>
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1">Completed ({timeFilter})</p>
                    <h3 className="mb-1">{completedToday}</h3>
                    <Badge 
                      bg={
                        completedToday >= totalTasks * 0.7 ? "success" :
                        completedToday >= totalTasks * 0.4 ? "info" : 
                        "warning"
                      }
                    >
                      {completedToday >= totalTasks * 0.7 ? 'Excellent' :
                       completedToday >= totalTasks * 0.4 ? 'On Track' :
                       'Needs Attention'}
                    </Badge>
                  </div>
                  <div className="stat-icon">
                    <i className="fas fa-check-circle text-info"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

      {/* Charts Row */}
      <Row className="g-4">
        <Col lg={8}>
          <Card>
            <Card.Body>
              <h5 className="mb-4">Performance Overview</h5>
              <div style={{ height: "350px" }}>
                <Bar data={performanceData} options={chartOptions.bar} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Body>
              <h5 className="mb-4">Field Service Distribution</h5>
              <div style={{ height: "300px" }}>
                <Pie data={taskDistributionData} options={chartOptions.pie} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  </div>
);
};

export default Overview;