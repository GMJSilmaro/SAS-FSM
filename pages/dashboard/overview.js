import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  InputGroup,
  Card,
  Badge,
  Dropdown,
  Modal,
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
  onSnapshot,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { useRouter } from "next/router";
import { performGlobalSearch } from "../../utils/searchUtils";
import { ListGroup } from "react-bootstrap";
import {
  FaBriefcase,
  FaUser,
  FaSearch,
  FaTimes,
  FaDownload,
  FaPlus,
  FaBell,
} from "react-icons/fa";
import styles from "../../styles/Overview.module.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Toaster, toast } from "react-hot-toast"; // Add this import at the top
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const Overview = () => {
  const [timeFilter, setTimeFilter] = useState("Today");
  const [userDetails, setUserDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const router = useRouter();
  const [newJobsCount, setNewJobsCount] = useState(0);
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);
  const [sessionTime, setSessionTime] = useState("--:--:--");
  const [lastLoginTime, setLastLoginTime] = useState(null);
  const [totalTasks, setTotalTasks] = useState(0);
  const [activeWorkers, setActiveWorkers] = useState(0); // Changed from activeTechnicians

  const [pendingTasks, setPendingTasks] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [taskGrowth, setTaskGrowth] = useState(0);

  // Add these state variables at the top with your other useState declarations
  const [performanceData, setPerformanceData] = useState({
    labels: [],
    datasets: [
      {
        label: "Completed",
        data: [],
        backgroundColor: "#4e73df",
      },
      {
        label: "Pending/Created",
        data: [],
        backgroundColor: "#f6c23e",
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

  // Add loading state
  const [isLoading, setIsLoading] = useState(false);

  // Add loading indicator to your UI
  const LoadingOverlay = () =>
    isLoading && (
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

  // Update session time from DOM attribute
  useEffect(() => {
    const updateSessionTime = () => {
      const time =
        document.body.getAttribute("data-session-time") || "--:--:--";
      setSessionTime(time);
    };

    // Initial update
    updateSessionTime();

    // Update every second
    const interval = setInterval(updateSessionTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Add this useEffect to load the last login time
  useEffect(() => {
    // Get last login from localStorage
    const storedLastLogin = localStorage.getItem("lastLoginTime");
    if (storedLastLogin) {
      setLastLoginTime(new Date(storedLastLogin));
    }
  }, []);

  const showWelcomeAlert = async () => {
    const userName =
      userDetails?.fullName || userDetails?.displayName || "User";
    const userRole = userDetails?.role || "User";
    const userAvatar = userDetails?.profilePicture || "/default-avatar.png";

    const lastLogin = lastLoginTime
      ? new Date(lastLoginTime).toLocaleString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "First time login";

    const result = await Swal.fire({
      html: `
        <div class="welcome-container">
          <button class="close-button">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div class="welcome-left">
            <div class="user-header">
              <img src="${userAvatar}" class="avatar-img" alt="Profile"/>
              <div class="user-info">
                <h2>Welcome back, ${userName}!</h2>
                <p class="user-role">${userRole}</p>
                <p class="last-login">
                  <span class="login-label">Last Login:</span>
                  <span class="login-time">${lastLogin}</span>
                </p>
              </div>
            </div>

            ${
              newJobsCount > 0
                ? `
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
            `
                : `
              <div class="stats-row">
                <div class="stat-item">
                  <h3>${activeJobsCount}</h3>
                  <p>Active Jobs</p>
                </div>
              </div>
            `
            }
          </div>

          <div class="welcome-right">
            <div class="welcome-header-fixed">
              <div class="welcome-title">
              <div class="title-row">
                <h2>
                    <span role="img" aria-label="celebration">🎉</span>
                    What's New!
                    <div class="tooltip-container" id="whatsNewTooltip">
                    <i class="fas fa-question-circle"></i>
                  </div>
                </h2>
              </div>
              <p class="subtitle">Discover our latest features and improvements</p>
              </div>
            </div>
            <div class="features-container">
              <div class="features-grid">
                <!-- First Row -->
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

                <!-- Second Row -->
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

          /* Responsive styles */
          @media (max-width: 768px) {
            .features-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 480px) {
            .features-grid {
              grid-template-columns: 1fr;
            }
          }

          /* Tag styles */
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

          .begin-button {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: auto;
            padding: 8px 16px;
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            color: #1e293b;
            cursor: pointer;
            transition: all 0.2s ease;
            width: fit-content;
          }

          .begin-button:hover {
            background: #f1f5f9;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }

          .begin-button svg {
            width: 16px;
            height: 16px;
            transition: transform 0.2s ease;
          }

          .begin-button:hover svg {
            transform: translateX(4px);
          }

          .section-title {
            text-align: center;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #1e293b;
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

          .tag.coming {
            background: #f0f4ff;
            color: #3730a3;
            animation: glow 2s infinite;
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

          @keyframes glow {
            0%, 100% { box-shadow: 0 0 5px rgba(79, 70, 229, 0.2); }
            50% { box-shadow: 0 0 15px rgba(79, 70, 229, 0.4); }
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
            animation: shine 3s infinite;
          }

          @keyframes shine {
            0% { transform: translateX(-30%) translateY(-30%) rotate(45deg); }
            100% { transform: translateX(30%) translateY(30%) rotate(45deg); }
          }

          /* Ensure proper stacking context for animations */
          .feature-item {
            position: relative;
            overflow: hidden;
          }

          .feature-item.highlight:hover {
            background: linear-gradient(135deg, #2563EB 0%, #0891B2 100%);
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

          .close-button svg {
            width: 24px;
            height: 24px;
          }

          .timer-progress {
            background: rgba(59, 130, 246, 0.1);
            height: 3px;
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
          }

          .timer-progress:before {
            background: linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%);
          }

          /* Ensure proper positioning for close button */
          .welcome-popup {
            position: relative;
          }

          .features-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .feature-item {
            padding: 20px;
            min-height: 140px;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            min-height: 110px;
          }

          .feature-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }

          /* Compact text sizes */
          .feature-content h4 { font-size: 14px; }
          .feature-content p { font-size: 12px; }
          .tag { font-size: 11px; }

          .feature-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }

          .feature-content h4 {
            font-size: 14px;
            font-weight: 600;
            margin: 0;
            color: #1e293b;
          }

          .feature-content p {
            font-size: 12px;
            color: #64748b;
            margin: 0;
            line-height: 1.4;
          }

          .feature-tags {
            margin-top: 8px;
          }

          .tag {
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 11px;
            font-weight: 500;
          }

          .tag.new {
            background: #dcfce7;
            color: #166534;
          }

          .tag.improved {
            background: #e0f2fe;
            color: #075985;
          }

          /* Highlight cards */
          .feature-item.highlight {
            background: linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%);
            color: white;
          }

          .feature-item.highlight h4,
          .feature-item.highlight p {
            color: white;
          }

          /* Responsive */
          @media (max-width: 768px) {
            .features-list {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 576px) {
            .features-list {
              grid-template-columns: 1fr;
            }
          }

          /* Add these new styles */
          .session-info {
            margin-top: 20px;
            padding: 16px;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
          }

          .info-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #64748b;
            font-size: 14px;
          }

          .info-item strong {
            color: #1e293b;
            font-weight: 600;
          }

          .info-item svg {
            color: #3b82f6;
          }

          .user-role {
            color: #64748b;
            font-size: 14px;
            margin: 4px 0;
          }

          .last-login {
            font-size: 13px;
            color: #64748b;
            margin-top: 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
          }

          .login-label {
            color: #94a3b8;
            font-weight: 500;
          }

          .login-time {
            color: #64748b;
          }

          .user-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          }

          .user-info h2 {
            font-size: 18px;
            margin-bottom: 2px;
            color: #1e293b;
          }

          .welcome-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          }

          .tooltip-container {
            position: relative;
            cursor: pointer;
            color: #64748b;
          }

          .tooltip-container:hover::before {
            content: "Stay updated with our latest features and improvements. We regularly enhance our platform to provide you with better tools and capabilities.";
            position: absolute;
            top: 50%;
            right: calc(100% + 10px);
            transform: translateY(-50%);
            background-color: #1e293b;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            width: 250px;
            white-space: normal;
            z-index: 1000;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }

          .tooltip-container:hover::after {
            content: "";
            position: absolute;
            top: 50%;
            right: calc(100% + 4px);
            transform: translateY(-50%);
            border-width: 6px;
            border-style: solid;
            border-color: transparent transparent transparent #1e293b;
          }

          .welcome-header-fixed {
            position: sticky;
            top: 0;
            background: white;
            padding: 16px 0;
            margin-bottom: 16px;
            z-index: 10;
            text-align: center;
            border-bottom: 1px solid #e5e7eb;
          }

          .title-row h2 {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            position: relative;
          }

          .tooltip-container {
            display: inline-flex;
            margin-left: 8px;
            color: #64748b;
            cursor: pointer;
          }

          .features-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            padding: 16px;
          }

          .feature-item {
            background: #f8fafc;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            border: 1px solid #e5e7eb;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }

          .feature-item.highlight {
            background: linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%);
            color: white;
          }

          .feature-item.highlight h4,
          .feature-item.highlight p {
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
            font-size: 14px;
            font-weight: 600;
            margin: 0;
          }

          .feature-content p {
            font-size: 12px;
            margin: 0;
            line-height: 1.4;
          }

          /* Override any title attributes to prevent default browser tooltip */
          [title] {
            position: relative;
          }

          [title]:hover::before {
            content: attr(title);
            position: absolute;
            display: none;
          }

          /* Custom tooltip only for the question mark icon */
          .tooltip-container:hover::before {
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
          }

          .tooltip-container:hover::after {
            content: "";
            position: absolute;
            top: 50%;
            right: -16px;
            transform: translateY(-50%);
            border: 6px solid transparent;
            border-right-color: #1e293b;
          }

          /* Custom scrollbar styles */
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

          /* User info styles */
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

          /* Stats styles */
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

          /* Custom scrollbar */
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
        `;

        // Add the close button HTML
        const closeButton = document.createElement("button");
        closeButton.className = "close-button";
        closeButton.innerHTML = `
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        `;

        // Add click handler to close the modal
        closeButton.onclick = () => {
          Swal.close();
        };

        // Insert the close button into the popup
        popup.querySelector(".welcome-container").appendChild(closeButton);

        document.head.appendChild(style);

        // Remove any title attributes to prevent default tooltips
        const elements = popup.querySelectorAll("[title]");
        elements.forEach((el) => el.removeAttribute("title"));
      },
    });
  };

  // Add this new function to get recent jobs
  const getRecentJobs = async () => {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const jobsRef = collection(db, "jobs");
      const q = query(
        jobsRef,
        where("jobStatus", "==", "Created"),
        where("createdAt", ">=", Timestamp.fromDate(threeDaysAgo))
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error("Error fetching recent jobs:", error);
      return 0;
    }
  };

  // Add this new function to get active jobs count
  const getActiveJobsCount = async () => {
    try {
      const jobsRef = collection(db, "jobs");
      const q = query(jobsRef, where("jobStatus", "==", "InProgress"));

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error("Error fetching active jobs:", error);
      return 0;
    }
  };

  const handleExport = () => {
    Swal.fire({
      html: `
        <div style="
            background: linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%);
          padding: 40px;
          border-radius: 16px;
            color: white;
            text-align: center;
            position: relative;
        ">
          <button class="close-button" style="
            position: absolute;
            top: 16px;
            right: 16px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 8px;
            cursor: pointer;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          ">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 12px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 16px;
          ">
            <span>🚧</span>
            <span>Coming Soon</span>
          </div>
          <h4 style="font-size: 24px; margin-bottom: 16px; color: white;">Export Feature Coming Soon!</h4>
          <p style="font-size: 16px; margin-bottom: 24px; color: rgba(255, 255, 255, 0.9);">
            We're working hard to bring you comprehensive export capabilities. Stay tuned for updates!
          </p>
          <div>
            <button class="ok-button" style="
            background: white;
              color: #3B82F6;
              border: none;
              padding: 10px 32px;
            border-radius: 12px;
              font-weight: 500;
            cursor: pointer;
              transition: all 0.2s ease;
            font-size: 14px;
            ">
              Got it
            </button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      width: "500px",
      padding: 0,
      background: "transparent",
      backdrop: "rgba(0, 0, 0, 0.4)",
      customClass: {
        popup: "welcome-popup",
      },
      didRender: (popup) => {
        // Add hover effects for close button
        const closeButton = popup.querySelector(".close-button");
        closeButton.onmouseover = () => {
          closeButton.style.background = "rgba(255, 255, 255, 0.2)";
          closeButton.style.transform = "rotate(90deg)";
        };
        closeButton.onmouseout = () => {
          closeButton.style.background = "rgba(255, 255, 255, 0.1)";
          closeButton.style.transform = "rotate(0deg)";
        };
        closeButton.onclick = () => Swal.close();

        // Add hover effects for OK button
        const okButton = popup.querySelector(".ok-button");
        okButton.onmouseover = () => {
          okButton.style.transform = "translateY(-2px)";
          okButton.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
        };
        okButton.onmouseout = () => {
          okButton.style.transform = "translateY(0)";
          okButton.style.boxShadow = "none";
        };
        okButton.onclick = () => Swal.close();
      },
    });
  };

  const handleNewTask = () => {
    router.push("/jobs/create");
  };

  // Optimize fetchJobCounts to use caching
  const fetchJobCounts = async () => {
    try {
      // Check if we have recent cached counts
      const cachedCounts = localStorage.getItem("jobCounts");
      const cacheTime = localStorage.getItem("jobCountsCacheTime");

      if (cachedCounts && cacheTime) {
        const cacheAge = Date.now() - parseInt(cacheTime);
        // Use cache if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          const counts = JSON.parse(cachedCounts);
          setNewJobsCount(counts.new);
          setActiveJobsCount(counts.active);
          return;
        }
      }

      // Fetch new counts if no cache or cache expired
      const [recent, active] = await Promise.all([
        getRecentJobs(),
        getActiveJobsCount(),
      ]);

      // Update state
      setNewJobsCount(recent);
      setActiveJobsCount(active);

      // Cache the new counts
      localStorage.setItem(
        "jobCounts",
        JSON.stringify({ new: recent, active })
      );
      localStorage.setItem("jobCountsCacheTime", Date.now().toString());
    } catch (error) {
      console.error("Error fetching job counts:", error);
      throw error; // Rethrow to handle in click handler
    }
  };

  // Modified fetchUserDetails function
  const fetchUserDetails = async () => {
    try {
      // First check localStorage
      const cachedUser = localStorage.getItem("userDetails");
      if (cachedUser) {
        const userData = JSON.parse(cachedUser);
        const cacheTime = localStorage.getItem("userDetailsCacheTime");
        const cacheAge = Date.now() - parseInt(cacheTime);

        if (cacheAge < 24 * 60 * 60 * 1000) {
          console.log("Using cached user details:", userData);
          setUserDetails(userData);
          return;
        }
      }

      // If no cache or cache expired, fetch from Firebase
      const email = Cookies.get("email");
      if (email) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          console.log("Fetched user details:", userData);

          // Update last login time in Firestore
          const userDocRef = querySnapshot.docs[0].ref;
          await updateDoc(userDocRef, {
            lastLogin: serverTimestamp(),
          });

          // Get the updated user data
          const updatedUserSnap = await getDoc(userDocRef);
          const updatedUserData = updatedUserSnap.data();
          console.log("Updated user details with last login:", updatedUserData);

          // Store in localStorage with timestamp
          localStorage.setItem("userDetails", JSON.stringify(updatedUserData));
          localStorage.setItem("userDetailsCacheTime", Date.now().toString());
          setUserDetails(updatedUserData);
        }
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      // If error, try to use cached data as fallback
      const cachedUser = localStorage.getItem("userDetails");
      if (cachedUser) {
        setUserDetails(JSON.parse(cachedUser));
      }
    }
  };

  // Function to update cache when needed
  const updateUserCache = (userData) => {
    localStorage.setItem("userDetails", JSON.stringify(userData));
    localStorage.setItem("userDetailsCacheTime", Date.now().toString());
    setUserDetails(userData);
  };

  // Modified useEffect
  useEffect(() => {
    fetchUserDetails();
    fetchJobCounts();
  }, []); // Empty dependency array

  // Modify the useEffect for welcome popup
  useEffect(() => {
    const shouldShowPopup = localStorage.getItem("showWelcomePopup") === "true";

    if (
      shouldShowPopup &&
      userDetails &&
      (newJobsCount !== undefined || activeJobsCount !== undefined)
    ) {
      // Small delay to ensure smooth transition after login
      const timer = setTimeout(() => {
        showWelcomeAlert();
        // Remove the flag after showing the popup
        localStorage.removeItem("showWelcomePopup");
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [userDetails, newJobsCount, activeJobsCount]); // Add job counts as dependencies

  useEffect(() => {
    const jobsRef = collection(db, "jobs");
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    // Create a query instead of filtering in memory
    const newJobsQuery = query(
      jobsRef,
      where("jobStatus", "==", "Created"),
      where("createdAt", ">=", Timestamp.fromDate(last24Hours))
    );

    const activeJobsQuery = query(
      jobsRef,
      where("jobStatus", "==", "In Progress")
    );

    // Use Promise.all to fetch both counts
    const unsubscribe = onSnapshot(jobsRef, async (snapshot) => {
      try {
        const [newJobsSnap, activeJobsSnap] = await Promise.all([
          getDocs(newJobsQuery),
          getDocs(activeJobsQuery),
        ]);

        setNewJobsCount(newJobsSnap.size);
        setActiveJobsCount(activeJobsSnap.size);
      } catch (error) {
        console.error("Error updating job counts:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  // At the top of your component, define chart options once
  const chartOptions = {
    bar: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 12, family: "'Inter', sans-serif" },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            borderDash: [2],
            drawBorder: false,
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            font: { size: 12, family: "'Inter', sans-serif" },
          },
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
        title: {
          display: true,
          text: "Weekly Job Status",
          padding: { top: 10, bottom: 20 },
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
          },
        },
        title: {
          display: true,
          text: "Job Contact Type Distribution",
          padding: { top: 10, bottom: 20 },
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
  };

  // Optimize the fetchChartData function to reduce Firebase reads
  const fetchChartData = async () => {
    try {
      const jobsRef = collection(db, "jobs");
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get all jobs in one query
      const jobsQuery = query(
        jobsRef,
        where("createdAt", ">=", Timestamp.fromDate(lastWeek))
      );
      const jobsSnapshot = await getDocs(jobsQuery);
      const jobs = jobsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      // Process both charts data
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const completedByDay = new Array(7).fill(0);
      const pendingByDay = new Array(7).fill(0);
      const jobTypes = {};

      jobs.forEach((job) => {
        // Process bar chart data
        if (job.createdAt) {
          const date = job.createdAt.toDate();
          const dayIndex = (date.getDay() + 6) % 7; // Make Monday index 0

          if (job.jobStatus === "Job Complete") {
            completedByDay[dayIndex]++;
          } else if (
            job.jobStatus === "Created" ||
            job.jobStatus === "Pending"
          ) {
            pendingByDay[dayIndex]++;
          }
        }

        // Process pie chart data using jobContactType
        if (job.jobContactType && job.jobContactType.name) {
          const typeName = job.jobContactType.name;
          jobTypes[typeName] = (jobTypes[typeName] || 0) + 1;
        }
      });

      // Update bar chart
      setPerformanceData({
        labels: days,
        datasets: [
          {
            label: "Completed",
            data: completedByDay,
            backgroundColor: "#4e73df",
          },
          {
            label: "Pending/Created",
            data: pendingByDay,
            backgroundColor: "#f6c23e",
          },
        ],
      });

      // Update pie chart with job contact types
      const typeColors = {
        General: "#4e73df",
        Emergency: "#e74a3b",
        Maintenance: "#1cc88a",
        Installation: "#f6c23e",
        Repair: "#36b9cc",
        // Add more types as needed
      };

      setTaskDistributionData({
        labels: Object.keys(jobTypes),
        datasets: [
          {
            data: Object.values(jobTypes),
            backgroundColor: Object.keys(jobTypes).map(
              (type) => typeColors[type] || "#858796"
            ),
          },
        ],
      });

      console.log("Processed job types:", jobTypes); // Debug log
      console.log("Weekly data:", {
        completed: completedByDay,
        pending: pendingByDay,
      }); // Debug log
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push({
        pathname: "/dashboard/search",
        query: { q: searchQuery },
      });
    }
  };

  const handleSearchInputChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim()) {
      setIsSearching(true);
      try {
        const { results } = await performGlobalSearch(db, value);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  // Add clearSearch function
  const clearSearch = () => {
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
  };

  // Modify the button click handler to show loading state
  const handleWhatsNewClick = async () => {
    // Show loading state immediately
    Swal.fire({
      title: "Loading...",
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      // Fetch counts in background
      await fetchJobCounts();
      // Show welcome alert after counts are fetched
      showWelcomeAlert();
    } catch (error) {
      console.error("Error loading what's new:", error);
      // Show error message if something goes wrong
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong! Please try again.",
      });
    }
  };

  // Add console log to debug userDetails
  useEffect(() => {
    console.log("Current userDetails:", userDetails);
  }, [userDetails]);

  // Add this function to fetch stats data
  const fetchDashboardStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const jobsRef = collection(db, "jobs");
      const usersRef = collection(db, "users");

      // Get total tasks
      const totalTasksQuery = query(jobsRef);
      const totalTasksSnap = await getDocs(totalTasksQuery);
      const totalTasksCount = totalTasksSnap.size;
      setTotalTasks(totalTasksCount);

      // Get active workers (users with role 'Worker' and isActive true)
      const techQuery = query(
        usersRef,
        where("role", "==", "Worker"),
        where("isActive", "==", true)
      );
      const techSnap = await getDocs(techQuery);
      setActiveWorkers(techSnap.size);
      // Get pending tasks
      const pendingQuery = query(
        jobsRef,
        where("jobStatus", "in", ["Pending", "Created"])
      );
      const pendingSnap = await getDocs(pendingQuery);
      setPendingTasks(pendingSnap.size);

      // Get completed today
      const completedTodayQuery = query(
        jobsRef,
        where("jobStatus", "==", "Job Complete")
      );
      const completedTodaySnap = await getDocs(completedTodayQuery);
      setCompletedToday(completedTodaySnap.size);

      // Calculate task growth (comparing with last week)
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const thisWeekQuery = query(
        jobsRef,
        where("createdAt", ">=", Timestamp.fromDate(lastWeek))
      );
      const lastTwoWeeksQuery = query(
        jobsRef,
        where(
          "createdAt",
          ">=",
          Timestamp.fromDate(
            new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000)
          )
        )
      );

      const [thisWeekSnap, lastTwoWeeksSnap] = await Promise.all([
        getDocs(thisWeekQuery),
        getDocs(lastTwoWeeksQuery),
      ]);

      const thisWeekCount = thisWeekSnap.size;
      const lastTwoWeeksCount = lastTwoWeeksSnap.size;
      const lastWeekCount = lastTwoWeeksCount - thisWeekCount;

      const growth =
        lastWeekCount === 0
          ? 100
          : Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100);

      setTaskGrowth(growth);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  // Add this to your existing useEffect or create a new one
  useEffect(() => {
    fetchDashboardStats();
  }, []); // Empty dependency array for initial load only

  // Make sure to call this function in useEffect
  useEffect(() => {
    fetchChartData();
  }, []); // Empty dependency array for initial load only

  // Update the FilterButtons component
  const FilterButtons = () => (
    <div className="d-flex gap-2">
      {["Today", "This Week", "This Month", "This Year"].map((period) => (
        <Button
          key={period}
          variant="link"
          className={timeFilter === period ? "active" : ""}
          disabled={isLoading}
          style={{
            backgroundColor:
              timeFilter === period
                ? "rgba(255, 255, 255, 0.3)"
                : "rgba(255, 255, 255, 0.1)",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "12px",
            color: "white",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s ease",
            fontWeight: "500",
            opacity: isLoading ? 0.7 : 1,
            transform: timeFilter === period ? "translateY(-2px)" : "none",
            boxShadow:
              timeFilter === period ? "0 4px 12px rgba(0, 0, 0, 0.1)" : "none",
          }}
          onMouseOver={(e) => {
            if (timeFilter !== period) {
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }
          }}
          onMouseOut={(e) => {
            if (timeFilter !== period) {
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
          onClick={() => handleTimeFilterChange(period)}
        >
          {/* Update icon for This Year */}
          {period === "Today" && <i className="fas fa-calendar-day" />}
          {period === "This Week" && <i className="fas fa-calendar-week" />}
          {period === "This Month" && <i className="fas fa-calendar-alt" />}
          {period === "This Year" && <i className="fas fa-calendar" />}
          <span>{period}</span>
        </Button>
      ))}
    </div>
  );

  // Update the handleTimeFilterChange function
  const handleTimeFilterChange = async (period) => {
    setTimeFilter(period);
    setIsLoading(true);

    try {
      const dateRange = getDateRange(period);
      const filteredJobs = filterJobsByDateRange(allJobs, dateRange);

      updateDashboardStats(filteredJobs, dateRange);
      updateChartData(filteredJobs, period);

     
    } catch (error) {
      console.error("Error updating dashboard:", error);
      toast.error("Error updating filter", {
        duration: 2000,
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update getDateRange function to handle dates correctly
  const getDateRange = (filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case "Today":
        return {
          start: new Date(today.setHours(0, 0, 0, 0)),
          end: new Date(now.setHours(23, 59, 59, 999)),
        };
      case "This Week":
        const weekStart = new Date(today);
        weekStart.setDate(
          today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)
        );
        weekStart.setHours(0, 0, 0, 0);
        return {
          start: weekStart,
          end: new Date(now.setHours(23, 59, 59, 999)),
        };
      case "This Month":
        return {
          start: new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0),
          end: new Date(now.setHours(23, 59, 59, 999)),
        };
      case "This Year":
        return {
          start: new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0), // First day of current year
          end: new Date(now.setHours(23, 59, 59, 999)),
        };
      default:
        return {
          start: new Date(today.setHours(0, 0, 0, 0)),
          end: new Date(now.setHours(23, 59, 59, 999)),
        };
    }
  };

  // Separate the date picker modal into its own component to better control renders
  const DateRangePickerModal = ({ show, onHide, onApply }) => {
    const [localDateRange, setLocalDateRange] = useState([null, null]);
    const [localStart, localEnd] = localDateRange;

    // Reset local state when modal opens
    useEffect(() => {
      if (show) {
        setLocalDateRange([null, null]);
      }
    }, [show]);

    return (
      <Modal show={show} onHide={onHide} centered>
        <Modal.Header closeButton>
          <Modal.Title>Select Date Range</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DatePicker
            selectsRange={true}
            startDate={localStart}
            endDate={localEnd}
            onChange={(update) => {
              setLocalDateRange(update);
            }}
            isClearable={true}
            inline
            maxDate={new Date()}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (localStart && localEnd) {
                onApply(localStart, localEnd);
              }
            }}
            disabled={!localStart || !localEnd}
          >
            Apply
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // Add these state variables at the top
  const [allJobs, setAllJobs] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Add this useEffect to fetch all data once when component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsInitialLoading(true);
        const jobsRef = collection(db, "jobs");

        // Get last 90 days of data to ensure we have enough for comparisons
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const jobsQuery = query(
          jobsRef,
          where("createdAt", ">=", Timestamp.fromDate(ninetyDaysAgo)),
          orderBy("createdAt", "desc")
        );

        const jobsSnapshot = await getDocs(jobsQuery);
        const jobs = jobsSnapshot.docs
          .map((doc) => ({
            ...doc.data(),
            id: doc.id,
            createdAt: doc.data().createdAt?.toDate(),
          }))
          .filter((job) => job.createdAt);

        setAllJobs(jobs);

        // Change initial filter to 'This Year' instead of 'Custom'
        handleTimeFilterChange("This Year");
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Helper function to filter jobs by date range
  const filterJobsByDateRange = (jobs, dateRange) => {
    return jobs.filter((job) => {
      const jobDate = job.createdAt;
      // Make sure we have a valid date and it falls within the range
      return jobDate && jobDate >= dateRange.start && jobDate <= dateRange.end;
    });
  };

  // Helper function to update dashboard stats
  const updateDashboardStats = (filteredJobs, dateRange) => {
    // Update total tasks for this period
    setTotalTasks(filteredJobs.length);

    // Count pending and completed tasks
    const pendingCount = filteredJobs.filter(
      (job) => job.jobStatus === "Pending" || job.jobStatus === "Created"
    ).length;
    setPendingTasks(pendingCount);

    const completedCount = filteredJobs.filter(
      (job) => job.jobStatus === "Job Complete"
    ).length;
    setCompletedToday(completedCount);

    // Calculate growth rate
    const previousPeriodStart = new Date(dateRange.start);
    const periodDuration = dateRange.end - dateRange.start;
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDuration);

    const previousJobs = allJobs.filter(
      (job) =>
        job.createdAt >= previousPeriodStart && job.createdAt < dateRange.start
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

    // Debug logging
    console.log("Filter Stats:", {
      period: timeFilter,
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      },
      totalJobs: filteredJobs.length,
      pendingJobs: pendingCount,
      completedJobs: completedCount,
      growth: growth,
    });
  };

  // Helper function to update chart data
  const updateChartData = (filteredJobs, period) => {
    if (period === "Today") {
      // Hourly breakdown for today
      const hourlyCompleted = new Array(24).fill(0);
      const hourlyPending = new Array(24).fill(0);

      filteredJobs.forEach((job) => {
        const hour = job.createdAt.getHours();
        if (job.jobStatus === "Job Complete") {
          hourlyCompleted[hour]++;
        } else if (job.jobStatus === "Created" || job.jobStatus === "Pending") {
          hourlyPending[hour]++;
        }
      });

      setPerformanceData({
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [
          {
            label: "Completed",
            data: hourlyCompleted,
            backgroundColor: "#4e73df",
          },
          {
            label: "Pending",
            data: hourlyPending,
            backgroundColor: "#f6c23e",
          },
        ],
      });
    } else {
      // Weekly/Monthly view
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const completedByDay = new Array(7).fill(0);
      const pendingByDay = new Array(7).fill(0);

      filteredJobs.forEach((job) => {
        const dayIndex = (job.createdAt.getDay() + 6) % 7;
        if (job.jobStatus === "Job Complete") {
          completedByDay[dayIndex]++;
        } else if (job.jobStatus === "Created" || job.jobStatus === "Pending") {
          pendingByDay[dayIndex]++;
        }
      });

      setPerformanceData({
        labels: days,
        datasets: [
          {
            label: "Completed",
            data: completedByDay,
            backgroundColor: "#4e73df",
          },
          {
            label: "Pending",
            data: pendingByDay,
            backgroundColor: "#f6c23e",
          },
        ],
      });
    }

    // Update pie chart
    const jobTypes = {};
    filteredJobs.forEach((job) => {
      if (job.jobContactType?.name) {
        const typeName = job.jobContactType.name;
        jobTypes[typeName] = (jobTypes[typeName] || 0) + 1;
      }
    });

    setTaskDistributionData({
      labels: Object.keys(jobTypes),
      datasets: [
        {
          data: Object.values(jobTypes),
          backgroundColor: Object.keys(jobTypes).map(
            (type) =>
              ({
                General: "#4e73df",
                Emergency: "#e74a3b",
                Maintenance: "#1cc88a",
                Installation: "#f6c23e",
                Repair: "#36b9cc",
              }[type] || "#858796")
          ),
        },
      ],
    });
  };

  return (
    <div className="dashboard-wrapper">
      <LoadingOverlay />
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
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 className="h3 text-white fw-bold mb-1">
                Field Services Dashboard
              </h1>
              <p className="mb-0" style={{ color: "white" }}>
                Welcome back,{" "}
                <span className="fw-medium">
                  {userDetails?.fullName || "NA"}
                </span>{" "}
                👋
              </p>
            </div>

            <div className="d-flex gap-3 align-items-center">
              {/* Search Container */}
              {/* <div className={styles.searchContainer}>
                <Form onSubmit={handleSearchSubmit}>
                  <InputGroup>
                    <Form.Control
                      type="search"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      className={styles.searchInput}
                      style={{
                        border: "2px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "12px",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        color: "white",
                        padding: "12px 20px",
                        width: "300px",
                      }}
                    />
                    <Button
                      variant="link"
                      type="submit"
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 10,
                        color: "white",
                      }}
                    >
                      <FaSearch size={16} />
                    </Button>
                  </InputGroup>
                </Form>
              </div> */}

              {/* Action Buttons */}
              <div className="d-flex gap-3">
                <Button
                  onClick={handleWhatsNewClick}
                  title="Check out the latest features and updates"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "12px",
                    color: "white",
                    padding: "10px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                    fontWeight: "500",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.2)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div className="d-flex flex-column align-items-start">
                    <div className="d-flex align-items-center gap-2">
                      <FaBell size={16} />
                      <span>What's New</span>
                    </div>
                    <small
                      style={{
                        fontSize: "0.7rem",
                        opacity: 0.8,
                        marginTop: "-2px",
                        marginLeft: "24px",
                      }}
                    >
                      Check latest updates
                    </small>
                  </div>
                </Button>

                {/* <Button
                  onClick={handleExport}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "12px",
                    color: "white",
                    padding: "10px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                    fontWeight: "500",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.2)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <FaDownload size={16} />
                  <span>Export</span>
                </Button> */}

                <Button
                  onClick={handleNewTask}
                  className="create-job-button" // Add this class
                  style={{
                    backgroundColor: "white",
                    border: "none",
                    borderRadius: "12px",
                    color: "#3b82f6",
                    padding: "10px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                    fontWeight: "500",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    animation: "pulseAndGlow 2s infinite", // Add this line
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 8px rgba(0, 0, 0, 0.15)";
                    // Pause the animation on hover
                    e.currentTarget.style.animationPlayState = "paused";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 6px rgba(0, 0, 0, 0.1)";
                    // Resume the animation
                    e.currentTarget.style.animationPlayState = "running";
                  }}
                >
                  <FaPlus size={16} className="plus-icon" />{" "}
                  {/* Add this class */}
                  <span>Create Job</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <FilterButtons />
          </div>
        </div>
      </div>

      <Container>
        <Row className="g-4 mb-4">
          <Col lg={3} sm={6}>
            <Card style={styles.statCard}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1">Total Jobs</p>
                    <h3 className="mb-1">{totalTasks}</h3>
                    <span className="text-success">
                      <i className="fas fa-arrow-up me-1"></i>
                      {taskGrowth}% increase
                    </span>
                  </div>
                  <div style={{ ...styles.cardIcon, background: "#e7f1ff" }}>
                    <i className="fas fa-tasks text-primary"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} sm={6}>
            <Card style={styles.statCard}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1">Total Workers</p>
                    <h3 className="mb-1">{activeWorkers}</h3>
                    <Badge bg="success">Active</Badge>
                  </div>
                  <div style={{ ...styles.cardIcon, background: "#e6f8f0" }}>
                    <i className="fas fa-users text-success"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} sm={6}>
            <Card style={styles.statCard}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1">Pending Jobs</p>
                    <h3 className="mb-1">{pendingTasks}</h3>
                    <Badge bg="warning">Urgent</Badge>
                  </div>
                  <div style={{ ...styles.cardIcon, background: "#fff8ec" }}>
                    <i className="fas fa-clock text-warning"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} sm={6}>
            <Card style={styles.statCard}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1">Completed Today</p>
                    <h3 className="mb-1">{completedToday}</h3>
                    <Badge bg="info">On Track</Badge>
                  </div>
                  <div style={{ ...styles.cardIcon, background: "#e7f6f8" }}>
                    <i className="fas fa-check-circle text-info"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-4">
          <Col lg={8}>
            <Card style={styles.chartCard}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h5 className="mb-1">Performance Overview</h5>
                    <p className="text-muted mb-0">
                      Weekly task completion status
                    </p>
                  </div>
                  <Dropdown>
                    <Dropdown.Toggle variant="light" size="sm">
                      This Week
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item>This Week</Dropdown.Item>
                      <Dropdown.Item>Last Week</Dropdown.Item>
                      <Dropdown.Item>Last Month</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
                <div style={{ height: "350px" }}>
                  <Bar data={performanceData} options={chartOptions.bar} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card style={styles.chartCard}>
              <Card.Body>
                <h5 className="mb-4">Task Distribution</h5>
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
