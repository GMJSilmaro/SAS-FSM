import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "react-bootstrap";
import { ApexCharts } from "widgets";

// Import Firebase
import { db } from "../../../../../firebase";
import { collection, getDocs } from "firebase/firestore";

// Import your existing chart configuration
import { TaskSummaryChartOptions as baseChartOptions } from "data/charts/ChartData";

const TaskSummaryChart = () => {
  const [chartData, setChartData] = useState([
    {
      name: "Closed",
      type: "column",
      data: [],
    },
    {
      name: "New",
      type: "line",
      data: [],
    },
  ]);
  const [chartOptions, setChartOptions] = useState(baseChartOptions);

  useEffect(() => {
    // Fetch jobs data from Firebase
    const fetchJobsData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "jobs"));
        let closedJobsCount = [0, 0, 0, 0, 0, 0, 0]; // Array for Closed Jobs per day
        let newJobsCount = [0, 0, 0, 0, 0, 0, 0]; // Array for New Jobs per day

        querySnapshot.forEach((doc) => {
          const job = doc.data();
          const startDate = new Date(job.startDate);
          const dayOfWeek = startDate.getUTCDay(); // Get the day of the week (0-6, where 0 is Sunday)

          // Increment the corresponding day of the week index
          if (job.jobStatus === "Job Complete") {
            closedJobsCount[dayOfWeek]++;
          } else {
            newJobsCount[dayOfWeek]++;
          }
        });

        // Update chart data with counts, ensuring no undefined or null values
        setChartData([
          {
            name: "Closed",
            type: "column",
            data: closedJobsCount.map((count) => count || 0), // Fallback to 0 if count is falsy
          },
          {
            name: "New",
            type: "line",
            data: newJobsCount.map((count) => count || 0), // Fallback to 0 if count is falsy
          },
        ]);

        // Update chart options with x-axis categories
        setChartOptions((prevOptions) => ({
          ...prevOptions,
          xaxis: {
            categories: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], // Set x-axis categories
          },
        }));
      } catch (error) {
        console.error("Error fetching jobs data:", error);
        // Handle the error case by setting default data
        setChartData([
          {
            name: "Closed",
            type: "column",
            data: [0, 0, 0, 0, 0, 0, 0], // Default to empty data
          },
          {
            name: "New",
            type: "line",
            data: [0, 0, 0, 0, 0, 0, 0], // Default to empty data
          },
        ]);
      }
    };

    fetchJobsData();
  }, []);

  return (
    <Card>
      <Card.Body>
        <div className="d-flex justify-content-between">
          <div>
            <h4 className="mb-0">Jobs Summary</h4>
          </div>
        </div>
        <p className="mt-4 mb-0">New vs. Closed</p>
        {/* Render the chart if data is available, otherwise show loading message */}
        {chartData[0].data.length > 0 && chartData[1].data.length > 0 ? (
          <ApexCharts
            options={chartOptions}
            series={chartData}
            type="line" // Keeping the original mixed type chart
            height={350}
          />
        ) : (
          <p>Loading chart data...</p>
        )}
      </Card.Body>
    </Card>
  );
};

export default TaskSummaryChart;
