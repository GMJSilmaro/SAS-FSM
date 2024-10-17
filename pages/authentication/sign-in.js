import { Fragment, useState } from 'react';
import { useRouter } from 'next/router';
import { Col, Row, Card, Form, Button, Image } from 'react-bootstrap';
import { signInWithEmailAndPassword } from 'firebase/auth';  
import { auth } from '../../firebase';  
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';

const SignIn = () => {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Step 1: Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
    
      // Get Firebase token (optional for frontend use)
      const token = await user.getIdToken();
      Cookies.set('customToken', token, { secure: true, sameSite: 'Lax' });
  
      // Step 2: Send credentials to your backend to log in to SAP B1 and handle session cookies
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // This ensures cookies like B1SESSION are sent and stored
      });
  
      if (!response.ok) {
        throw new Error('Login failed');
      }
  
      const data = await response.json();
  
      // Step 3: Validate isAdmin field before proceeding
      if (!data.isAdmin) {
        throw new Error('Access denied. You must be an admin to log in.');
      }
  
      // Step 4: Set other cookies using js-cookie (optional)
      Cookies.set('uid', data.uid, { secure: true, sameSite: 'None' });
      Cookies.set('email', email, { secure: true, sameSite: 'None' });
      Cookies.set('isAdmin', data.isAdmin, { secure: true, sameSite: 'None' });
  
      // Step 5: Success flow with SweetAlert
      Swal.fire({
        title: 'Welcome!',
        text: `Welcome back, ${user.email}!`,
        icon: 'success',
        confirmButtonText: 'OK',
      }).then(() => {
        router.push('/dashboard/overview');
      });
    } catch (error) {
      // If any error occurs, display it in the error state
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  
  return (
    <Fragment>
      <Row className="align-items-center justify-content-center g-0 min-vh-100">
        <Col lg={5} md={5} className="py-8 py-xl-0">
          <Card>
            <Card.Body className="p-6">
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Image src="/images/SAS-LOGO.png" alt="SAS Logo" height={150} width={250} />
              </div>
              <Form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger">{error}</div>}
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
                      {loading ? 'Logging In...' : 'Sign In'}
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
