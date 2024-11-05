import { Fragment, useState } from 'react';
import { useRouter } from 'next/router';
import { Col, Row, Card, Form, Button, Image, Spinner } from 'react-bootstrap';
import { signInWithEmailAndPassword } from 'firebase/auth';  
import { auth, db } from '../../firebase';  
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import { collection, query, getDocs, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { useSettings } from '../../contexts/SettingsContext';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { settings } = useSettings();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }
  
      // Show loading alert
      Swal.fire({
        title: 'Logging in...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
  
      // Firebase Authentication
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (firebaseError) {
        if (firebaseError.code === 'auth/invalid-credential' ||
            firebaseError.code === 'auth/user-not-found' ||
            firebaseError.code === 'auth/wrong-password') {
          throw new Error('Invalid email or password');
        }
        throw firebaseError;
      }
  
      // Backend Authentication
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: 'include',
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
  
      const data = await response.json();
      
      // Show success alert
      await Swal.fire({
        icon: 'success',
        title: 'Login Successful!',
        text: 'Redirecting to dashboard...',
        timer: 1500,
        showConfirmButton: false
      });
      
      // Ensure cookies are set before redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      window.location.href = '/dashboard/overview';
      
    } catch (error) {
      console.error('Login error:', error);
      setPassword(''); // Clear password field on error
      
      let errorMessage;
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection';
            break;
          default:
            errorMessage = 'Invalid email or password';
        }
      } else {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      // Show error alert
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: errorMessage,
        confirmButtonText: 'Try Again'
      });
      
      setLoading(false);
    }
  };

  return (
    <Fragment>
      <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
      <Row className="align-items-center justify-content-center g-0 min-vh-100">
        <Col lg={5} md={5} className="py-8 py-xl-0">
          <Card>
            <Card.Body className="p-6">
              <div className="mb-4 text-center">
                {settings?.isLoading ? (
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                ) : settings?.companyInfo?.logo ? (
                  <Image 
                    src={settings.companyInfo.logo} 
                    alt={settings?.companyInfo?.name || 'Company Logo'} 
                    style={{ height: '100px', objectFit: 'contain' }} 
                    onError={(e) => {
                      console.error('Error loading logo:', e);
                      e.target.src = '/default-logo.png';
                    }}
                  />
                ) : (
                  <div className="text-muted">No logo available</div>
                )}
              </div>
              <Form onSubmit={handleSubmit}>
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                <Row>
                  <Col lg={12} md={12} className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      isInvalid={!!error}
                    />
                  </Col>
                  <Col lg={12} md={12} className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      isInvalid={!!error}
                    />
                  </Col>
                  <Col lg={12} md={12} className="mb-0 d-grid gap-2">
                    <Button 
                      variant="primary" 
                      type="submit" 
                      disabled={loading}
                      className="py-2"
                    >
                      {loading ? (
                        <div className="d-flex align-items-center justify-content-center">
                          {/* <ClipLoader color="#ffffff" size={20} /> */}
                          <span className="ms-2">Please Wait...</span>
                        </div>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Fragment>
  );
};

export default SignIn;