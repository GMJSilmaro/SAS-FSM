import { Fragment, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Card, Form, Button, Image, Spinner, InputGroup, Container, Row, Col } from "react-bootstrap";
import { toast } from "react-hot-toast";
import { useSettings } from "../../hooks/useSettings";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

// Move loadingMessages outside the component
const loadingMessages = [
  {
    title: '<span class="fw-bold text-primary">Welcome Back! 👋</span>',
    message: 'Verifying your credentials...',
    progress: 20
  },
  {
    title: '<span class="fw-bold text-primary">Almost there! ⚡</span>',
    message: 'Authenticating your account...',
    progress: 40
  },
  {
    title: '<span class="fw-bold text-primary">Looking good! 🔐</span>',
    message: 'Setting up your workspace...',
    progress: 60
  },
  {
    title: '<span class="fw-bold text-primary">Nearly done! 🚀</span>',
    message: 'Preparing your dashboard...',
    progress: 80
  }
];

const LoadingMessage = () => {
  const messages = [
    "Preparing your workspace...",
    "Checking credentials...",
    "Almost there...",
    "Starting up the engines...",
    "Loading your dashboard...",
    "Connecting to services...",
  ];

  const [message, setMessage] = useState(messages[0]);
  
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      const messageElement = document.getElementById('loading-message');
      if (messageElement) {
        messageElement.style.opacity = '0';
      }

      setTimeout(() => {
        currentIndex = (currentIndex + 1) % messages.length;
        setMessage(messages[currentIndex]);
        
        if (messageElement) {
          messageElement.style.opacity = '1';
        }
      }, 500);

    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="fw-semibold mb-2">Signing in...</div>
      <small 
        id="loading-message" 
        className="text-muted"
        style={{
          display: 'block',
          transition: 'opacity 0.5s ease-in-out',
          opacity: 1
        }}
      >
        {message}
      </small>
    </div>
  );
};

const SignIn = () => {
  const router = useRouter();
  const { settings } = useSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Checking authentication state...');
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});

      console.log('📊 Current cookies:', cookies);

      // Check for all required cookies
      const requiredCookies = [
        'B1SESSION',
        'B1SESSION_EXPIRY',
        'ROUTEID',
        'customToken',
        'uid',
        'workerId',
        'LAST_ACTIVITY'
      ];

      const hasAllCookies = requiredCookies.every(cookieName => {
        const hasCookie = !!cookies[cookieName];
        console.log(`🍪 ${cookieName}: ${hasCookie ? '✅' : '❌'}`);
        return hasCookie;
      });

      if (hasAllCookies) {
        console.log('✅ All required cookies present');
        const expiryTime = new Date(cookies.B1SESSION_EXPIRY).getTime();
        if (Date.now() < expiryTime) {
          console.log('🔄 Valid session found, redirecting to dashboard');
          router.push("/");
        } else {
          console.log('⚠️ Session expired:', new Date(expiryTime));
        }
      } else {
        console.log('⚠️ Missing required cookies');
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    let currentIndex = 0;

    try {
      // Show the first loading message
      const loadingAlert = Swal.fire({
        title: loadingMessages[0].title,
        html: `
          <div class="progress mb-3" style="height: 6px;">
            <div class="progress-bar" role="progressbar" style="width: ${loadingMessages[0].progress}%" aria-valuenow="${loadingMessages[0].progress}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
          <p class="mb-0">${loadingMessages[0].message}</p>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          // Update loading messages every 1.5 seconds
          const interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % loadingMessages.length;
            const currentMessage = loadingMessages[currentIndex];
            
            Swal.update({
              title: currentMessage.title,
              html: `
                <div class="progress mb-3" style="height: 6px;">
                  <div class="progress-bar" role="progressbar" style="width: ${currentMessage.progress}%" aria-valuenow="${currentMessage.progress}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <p class="mb-0">${currentMessage.message}</p>
              `
            });
          }, 1500);

          // Store the interval ID in Swal instance
          Swal.intervalId = interval;
        },
        willClose: () => {
          // Clear the interval when the alert is closed
          clearInterval(Swal.intervalId);
        }
      });

      console.log('🚀 Client: Starting login process...', { email });

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      console.log('📨 Client: Received response:', {
        status: response.status,
        ok: response.ok
      });

      const data = await response.json();
      console.log('📦 Client: Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Manually set cookies if needed
      if (data.cookies) {
        data.cookies.forEach(({ name, value }) => {
          document.cookie = `${name}=${value}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`;
        });
      }

      // Verify cookies were set
      console.log('🍪 Client: Cookies after login:', document.cookie);

      // Add this line to set the flag
      localStorage.setItem('showWelcomePopup', 'true');

      // Close the loading alert
      Swal.close();

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Login Successful!',
        text: 'Redirecting to dashboard...',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: 'animated fadeInUp'
        }
      });

      router.push("/dashboard");

      // After successful login
      localStorage.setItem('lastLoginTime', new Date().toISOString());

    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      
      // Close any existing alert
      Swal.close();
      
      // Show error message
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.message,
        customClass: {
          popup: 'animated fadeInUp'
        }
      });
    }
  };

  return (
    <Fragment>
      <Toaster
        position="top-center"
        toastOptions={{
          id: 'login-notification',
          style: { zIndex: 9999 }
        }}
      />
      
      <Container fluid className="p-0">
        <Row className="g-0 min-vh-100">
          {/* Left side with field service background */}
          <Col md={6} className="d-none d-md-block position-relative">
            <div className="bg-image h-100">
              <div className="overlay-gradient d-flex flex-column justify-content-center text-white p-5 h-100">
                <h1 className="display-4 fw-bold mb-4">Welcome Back!</h1>
                <p className="lead">
                  Access your SAS Field Service Management dashboard to manage your operations efficiently.
                </p>
              </div>
            </div>
          </Col>

          {/* Right side - Sign In Form */}
          <Col md={6} className="d-flex align-items-center justify-content-center bg-white p-4 p-md-5">
            <Card className="border-0 w-100 shadow-lg">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-5">
                  <Image
                    src="/images/SAS-LOGO.png"
                    alt="SAS Logo"
                    width={300}
                    height={100}
                    className="mb-4 img-fluid"
                  />
                  <h2 className="fw-bold text-dark mb-3">Sign In</h2>
                  <p className="text-muted">Enter your credentials to continue</p>
                </div>

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4" controlId="email">
                    <Form.Label className="fw-semibold text-dark">Email Address</Form.Label>
                    <InputGroup className="shadow-sm">
                      <InputGroup.Text className="bg-light border-0">
                        <FaEnvelope className="text-primary" />
                      </InputGroup.Text>
                      <Form.Control
                        type="email"
                        placeholder="name@company.com"
                        className="border-0 py-2.5"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="password">
                    <InputGroup className="shadow-sm">
                      <InputGroup.Text className="bg-light border-0">
                        <FaLock className="text-muted" />
                      </InputGroup.Text>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="border-0 py-2.5"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                      <Button
                        variant="light"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Check
                      type="checkbox"
                      id="rememberMe"
                      label="Remember me"
                      className="text-muted"
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-75 py-3 mb-4 rounded-pill shadow-sm mx-auto d-block"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="d-flex align-items-center justify-content-center">
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-muted small">
                      By signing in, you agree to our{' '}
                      <Link href="#" className="text-primary text-decoration-none">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="#" className="text-primary text-decoration-none">
                        Privacy Policy
                      </Link>
                    </p>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <style jsx global>{`
        .bg-image {
          background-image: url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1470&h=850');
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .overlay-gradient {
          background: linear-gradient(
            135deg,
            rgba(50, 50, 50, 0.85) 0%,
            rgba(25, 25, 25, 0.85) 100%
          );
          backdrop-filter: blur(2px);
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .card {
          border-radius: 1rem;
          transition: all 0.3s ease;
        }

        .form-control, .input-group-text {
          border: none;
          padding: 0.75rem 1rem;
        }

        .form-control:focus {
          box-shadow: none;
          border-color: #0061f2;
        }

        .input-group {
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .btn-primary {
          background: linear-gradient(135deg, #0061f2 0%, #6900f2 100%);
          border: none;
          font-weight: 600;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 5px 15px rgba(0, 97, 242, 0.2);
        }

        .text-primary {
          color: #0061f2 !important;
        }

        .display-4 {
          font-size: 3.5rem;
          font-weight: 700;
          line-height: 1.2;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
          color: #ffffff;
        }

        .lead {
          font-size: 1.25rem;
          font-weight: 300;
          line-height: 1.6;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
          color: #ffffff;
        }

        @media (max-width: 768px) {
          .display-4 {
            font-size: 2.5rem;
          }
          .lead {
            font-size: 1.1rem;
          }
        }

        /* Animation classes */
        .animated {
          animation-duration: 0.5s;
          animation-fill-mode: both;
        }

        .fadeInUp {
          animation-name: fadeInUp;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate3d(0, 20px, 0);
          }
          
          to {
            opacity: 1;
            transform: none;
          }
        }

        :root {
          --toaster-z-index: 9999;
        }

        .loading-toast {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          background: white !important;
          z-index: 9999 !important;
        }

        .bg-gradient-overlay {
          background: linear-gradient(
            rgba(0, 97, 242, 0.8),
            rgba(105, 0, 242, 0.8)
          );
        }

        .img-fluid {
          max-width: 100%;
          height: auto;
        }

        /* Input Field Animations and Styling */
        .input-group {
          border-radius: 0.75rem;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .input-group:focus-within {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 97, 242, 0.1);
        }

        .form-control, .input-group-text {
          border: none;
          padding: 0.75rem 1rem;
          transition: all 0.3s ease;
        }

        .form-control:focus {
          box-shadow: none;
          background-color: #f8f9ff; /* Subtle background change on focus */
        }

        .input-group:focus-within .input-group-text {
          background-color: #f8f9ff; /* Matching background for the icon container */
          color: #0061f2;
        }

        .input-group:focus-within .text-primary {
          transform: scale(1.1); /* Slightly enlarge the icon */
        }

        /* Optional: Add a subtle scale animation when clicking the input */
        .form-control:active {
          transform: scale(0.995);
        }

        /* Input Label Animation */
        .form-label {
          transition: all 0.3s ease;
          position: relative;
        }

        .form-label::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 0;
          height: 2px;
          background: linear-gradient(135deg, #0061f2 0%, #6900f2 100%);
          transition: width 0.3s ease;
        }

        .input-group:focus-within + .form-label::after {
          width: 100%;
        }

        /* Enhanced placeholder animation */
        .form-control::placeholder {
          transition: all 0.3s ease;
        }

        .form-control:focus::placeholder {
          opacity: 0.7;
          transform: translateX(5px);
        }

        /* Add a subtle pulse animation to the icon when focused */
        @keyframes iconPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .input-group:focus-within .input-group-text svg {
          animation: iconPulse 1s ease infinite;
          color: #0061f2;
        }

        /* Add a gentle glow effect */
        .input-group:focus-within {
          box-shadow: 0 0 0 3px rgba(0, 97, 242, 0.1);
        }

        /* Smooth transition for the entire form group */
        .form-group {
          transition: all 0.3s ease;
        }

        .form-group:focus-within {
          transform: translateY(-2px);
        }

        /* SweetAlert2 Custom Styles */
        .swal2-popup {
          border-radius: 1rem;
          padding: 2rem;
        }

        .swal2-title {
          font-size: 1.5rem !important;
          margin-bottom: 1rem !important;
        }

        .progress {
          background-color: #e9ecef;
          border-radius: 1rem;
          overflow: hidden;
        }

        .progress-bar {
          background: linear-gradient(135deg, #0061f2 0%, #6900f2 100%);
          transition: width 0.5s ease;
        }

        /* Animation for the alert */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate3d(0, 20px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        .animated {
          animation-duration: 0.3s;
          animation-fill-mode: both;
        }

        .fadeInUp {
          animation-name: fadeInUp;
        }
      `}</style>
    </Fragment>
  );
};

export default SignIn;