import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import useAuth from '../../utils/useAuth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { Dropdown } from 'react-bootstrap';

const db = getFirestore();

// Import widget/custom components
import { GeeksSEO, StatRightIcon } from 'widgets';

// Import sub components
import { PopularInstructor, Activity } from 'sub-components';

// import node module libraries
import { Fragment } from 'react';
import { Row, Col } from 'react-bootstrap';

// import sub components
import { RecentActivity, TaskStats, TaskSummaryChart, TaskCompletionStatusChart, TaskbySectionsChart, UpcomingTaskList }  from 'sub-components';


// Import ApexCharts dynamically (Next.js specific)
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <Link
    href=""
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="btn-icon btn btn-ghost btn-sm rounded-circle"
  >
    {children}
  </Link>
));

CustomToggle.displayName = 'CustomToggle';

const ChartActionMenu = () => {
  return (
    <div>
      <Dropdown>
        <Dropdown.Toggle as={CustomToggle}>
          <i className="fe fe-more-vertical text-muted"></i>
        </Dropdown.Toggle>
        <Dropdown.Menu align="end">
          <Dropdown.Header>SETTINGS</Dropdown.Header>
          <Dropdown.Item eventKey="1">
            <i className="fe fe-external-link dropdown-item-icon "></i> Export
          </Dropdown.Item>
          <Dropdown.Item eventKey="2">
            <i className="fe fe-mail dropdown-item-icon "></i> Email Report
          </Dropdown.Item>
          <Dropdown.Item eventKey="3">
            <i className="fe fe-download dropdown-item-icon "></i> Download
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

const Overview = () => {
  useAuth();

  const [userCount, setUserCount] = useState(null);
  const [jobCount, setJobCount] = useState({
    open: { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 },
    closed: { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 },
    scheduled: { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 },
    cancelled: { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 }
  });
  
  const [totalJobCount, setTotalJobCount] = useState(0);

  
  const [scheduleCount, setScheduleCount] = useState(null);
  const [eventStatuses, setEventStatuses] = useState({
    available: 0,
    onLeave: 0,
    medicalLeave: 0,
    publicHoliday: 0,
  });

  useEffect(() => {
    const fetchUserCount = async () => {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const count = snapshot.docs.length;
      setUserCount(count);
    };

    fetchUserCount();
  }, []);

  // useEffect(() => {
  //   const fetchJobsCount = async () => {
  //     const jobsRef = collection(db, 'jobs');
  //     const snapshot = await getDocs(jobsRef);
  
  //     const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  //     const jobCounts = {
  //       open: { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 },
  //       closed: { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 },
  //       scheduled: { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 },
  //       cancelled: { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 }
  //     };
  
  //     snapshot.docs.forEach(doc => {
  //       const jobData = doc.data();
  //       const status = jobData.jobStatus;
  //       const startDate = jobData.startDate ? new Date(jobData.startDate) : null;
  
  //       if (startDate) {
  //         const day = daysOfWeek[startDate.getDay()];
  
  //         if (status === 'C') {
  //           jobCounts.open[day] += 1;
  //         } else if (status === 'JC') {
  //           jobCounts.closed[day] += 1;
  //         } else if (status === 'S') {
  //           jobCounts.scheduled[day] += 1;
  //         } else if (status === 'CA') {
  //           jobCounts.cancelled[day] += 1;
  //         }
  //       }
  //     });
  
  //     setJobCount(jobCounts);
  //   };
  
  //   fetchJobsCount();
  // }, []);
  
  useEffect(() => {
    const fetchJobsCount = async () => {
      const jobsRef = collection(db, 'jobs');
      const snapshot = await getDocs(jobsRef);
  
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const jobCounts = {
        open: { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 },
        closed: { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 },
        scheduled: { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 },
        cancelled: { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 }
      };
  
      let totalJobs = 0;
  
      snapshot.docs.forEach(doc => {
        const jobData = doc.data();
        const status = jobData.jobStatus;
        const startDate = jobData.startDate ? new Date(jobData.startDate) : null;
  
        if (startDate) {
          const day = daysOfWeek[startDate.getDay()];
  
          if (status === 'C') {
            jobCounts.open[day] += 1;
          } else if (status === 'JC') {
            jobCounts.closed[day] += 1;
          } else if (status === 'S') {
            jobCounts.scheduled[day] += 1;
          } else if (status === 'CA') {
            jobCounts.cancelled[day] += 1;
          }
        }
  
        totalJobs += 1;
      });
  
      setJobCount(jobCounts);
      setTotalJobCount(totalJobs);
    };
  
    fetchJobsCount();
  }, []);
  

  useEffect(() => {
    const fetchSchedulesCount = async () => {
      const schedulesRef = collection(db, 'events');
      const snapshot = await getDocs(schedulesRef);
      const count = snapshot.docs.length;
      setScheduleCount(count);
    };

    fetchSchedulesCount();
  }, []);

  useEffect(() => {
    const fetchEventStatuses = async () => {
      const eventsRef = collection(db, 'events');
      const snapshot = await getDocs(eventsRef);
      const statuses = {
        available: 0,
        onLeave: 0,
        medicalLeave: 0,
        publicHoliday: 0,
      };

      snapshot.docs.forEach(doc => {
        const status = doc.data().extendedProps.status;
        if (status === 'Available') statuses.available += 1;
        else if (status === 'On Leave') statuses.onLeave += 1;
        else if (status === 'Medical Leave') statuses.medicalLeave += 1;
        else if (status === 'Public Holiday') statuses.publicHoliday += 1;
      });

      setEventStatuses(statuses);
    };

    fetchEventStatuses();
  }, []);

  const pieChartOptions = {
    chart: {
      type: 'pie',
    },
    colors: ['#28a745', '#FF0000', '#FFA500', '#FFFF00'], // Lime, Red, Orange, Yellow
    labels: ['Available', 'On Leave', 'Medical Leave', 'Public Holiday'],
  };

  const pieChartSeries = [
    eventStatuses.available,
    eventStatuses.onLeave,
    eventStatuses.medicalLeave,
    eventStatuses.publicHoliday,
  ];

  const stackedChartOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: {
        show: true,
      },
      zoom: {
        enabled: true,
      },
    },
    colors: ['#28a745', '#dc3545'], // Green for Open, Red for Closed
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: 'bottom',
            offsetX: -10,
            offsetY: 0,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        horizontal: false,
      },
    },
    xaxis: {
      type: 'category',
      categories: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    legend: {
      position: 'right',
      offsetY: 40,
    },
    fill: {
      opacity: 1,
    },
  };
  

  const openClosedSeries = [
    {
      name: 'Open Jobs',
      data: [
        jobCount.open.Sunday,
        jobCount.open.Monday,
        jobCount.open.Tuesday,
        jobCount.open.Wednesday,
        jobCount.open.Thursday,
        jobCount.open.Friday,
        jobCount.open.Saturday
      ]
    },
    {
      name: 'Closed Jobs',
      data: [
        jobCount.closed.Sunday,
        jobCount.closed.Monday,
        jobCount.closed.Tuesday,
        jobCount.closed.Wednesday,
        jobCount.closed.Thursday,
        jobCount.closed.Friday,
        jobCount.closed.Saturday
      ]
    }
  ];
  

  const scheduledCancelledSeries = [
    {
      name: 'Scheduled Jobs',
      data: [
        jobCount.scheduled.Sunday,
        jobCount.scheduled.Monday,
        jobCount.scheduled.Tuesday,
        jobCount.scheduled.Wednesday,
        jobCount.scheduled.Thursday,
        jobCount.scheduled.Friday,
        jobCount.scheduled.Saturday
      ]
    },
    {
      name: 'Cancelled Jobs',
      data: [
        jobCount.cancelled.Sunday,
        jobCount.cancelled.Monday,
        jobCount.cancelled.Tuesday,
        jobCount.cancelled.Wednesday,
        jobCount.cancelled.Thursday,
        jobCount.cancelled.Friday,
        jobCount.cancelled.Saturday
      ]
    }
  ];
  

  return (
    <Fragment>
       <GeeksSEO title="Overview | SAS - SAP B1 Portal" />

    <TaskStats />

    <Row>
      <Col xl={8} md={14} xs={12} className="mb-4">
        {/* task summary chart  */}
        <TaskSummaryChart />
      </Col>
      <Col xl={4} md={12} xs={12} className="mb-4">
        {/* task completion status chart  */}
        {/* <TaskCompletionStatusChart /> */}
        {/* recent activities section  */}
					<RecentActivity />
      </Col>
    </Row>
    {/* <Row>
      <Col xl={4} xs={12} className="mb-4 mb-xl-0">
      
        <TaskCompletionStatusChart />
      </Col>
      <Col xl={8} xs={12} className="mb-4 mb-xl-0">
        
        <UpcomingTaskList />
      </Col>
    </Row> */}
  </Fragment>

  );
};

export default Overview;