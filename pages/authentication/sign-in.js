import { Fragment, useState } from 'react';
import { useRouter } from 'next/router';
import { Col, Row, Card, Form, Button, Image } from 'react-bootstrap';
import { signInWithEmailAndPassword } from 'firebase/auth';  
import { auth } from '../../firebase';  
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';

const SignIn = () => {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      // Backend Authentication
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();

      // Set cookies with proper attributes
      const cookieOptions = {
        secure: true,
        sameSite: 'Lax',
        path: '/',
        expires: 1 // 1 day
      };

      // Set all cookies
      Cookies.set('customToken', data.customToken, cookieOptions);
      Cookies.set('uid', data.uid, cookieOptions);
      Cookies.set('email', email, cookieOptions);
      Cookies.set('workerId', data.workerId, cookieOptions);
      Cookies.set('isAdmin', data.isAdmin, cookieOptions);
      
      toast.success('Login successful!');

      // Ensure cookies are set before redirect
      await new Promise(resolve => setTimeout(resolve, 100));

      // Force a hard redirect to dashboard
      window.location.href = '/dashboard/overview';
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Fragment>
      <Row className="align-items-center justify-content-center g-0 min-vh-100">
        <Col lg={5} md={5} className="py-8 py-xl-0">
          <Card>
            <Card.Body className="p-6">
              <div className="mb-4 text-center">
                <Image src="/images/SAS-LOGO.png" alt="SAS Logo" height={150} width={250} />
              </div>
              <Form onSubmit={handleSubmit}>
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
                          <ClipLoader color="#ffffff" size={20} />
                          <span className="ms-2">Signing In...</span>
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