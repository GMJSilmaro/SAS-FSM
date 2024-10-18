import { Fragment, useState } from 'react';
import { useRouter } from 'next/router';
import { Col, Row, Card, Form, Button, Image } from 'react-bootstrap';
import { signInWithEmailAndPassword } from 'firebase/auth';  
import { auth } from '../../firebase';  
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ClipLoader } from 'react-spinners';  // For the loading spinner
import Swal from 'sweetalert2';  // For SweetAlert2

const SignIn = () => {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Step 1: Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('Firebase authentication successful');
    
      // Get Firebase token (optional for frontend use)
      const token = await user.getIdToken();
      Cookies.set('customToken', token, { secure: true, sameSite: 'Lax' });
  
      // Step 2: Send credentials to your backend to log in to SAP B1 and handle session cookies
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,  // Include Firebase token for backend validation (if needed)
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Ensures cookies like B1SESSION are sent and stored
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
  
      const data = await response.json();
      console.log('Backend login response:', data);
  
      // Step 3: Validate isAdmin field before proceeding
      if (!data.isAdmin) {
        throw new Error('Access denied. You must be an admin to log in.');
      }
  
      // Step 4: Set other cookies using js-cookie (optional)
      Cookies.set('uid', data.uid, { secure: true, sameSite: 'None' });
      Cookies.set('email', email, { secure: true, sameSite: 'None' });
      Cookies.set('workerId', data.workerId, { secure: true, sameSite: 'None' });
      Cookies.set('isAdmin', data.isAdmin, { secure: true, sameSite: 'None' });

      // Step 5: Show SweetAlert2 for the welcome message
      Swal.fire({
        title: 'Welcome!',
        text: `Welcome back, ${data.fullName}!`,
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => {
        // Redirect after the SweetAlert closes
        router.push('/dashboard/overview');
      });

      // Step 6: Optionally show a passive success toast for a different operation
      toast.success('You have successfully logged in.');

    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        toast.error('Invalid email or password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email format. Please enter a valid email.');
      } else {
        toast.error(error.message || 'An error occurred during login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
    
  };
  
  return (
    <Fragment>
      <ToastContainer /> {/* Add the ToastContainer to render toasts */}
      <Row className="align-items-center justify-content-center g-0 min-vh-100">
        <Col lg={5} md={5} className="py-8 py-xl-0">
          <Card>
            <Card.Body className="p-6">
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Image src="/images/SAS-LOGO.png" alt="SAS Logo" height={150} width={250} />
              </div>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col lg={12} md={12} className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Col>
                  <Col lg={12} md={12} className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="**************"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Col>
                  <Col lg={12} md={12} className="mb-0 d-grid gap-2">
                    <Button variant="primary" type="submit" disabled={loading}>
                      {loading ? (
                        <ClipLoader color="#ffffff" size={25} /> 
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
