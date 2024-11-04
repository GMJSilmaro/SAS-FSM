import { Fragment, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Col, Row, Card, Form, Button, Image } from 'react-bootstrap';
import { signInWithEmailAndPassword } from 'firebase/auth';  
import { auth, db } from '../../firebase';  
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import { collection, query, getDocs, limit, onSnapshot, doc } from 'firebase/firestore';
import Swal from 'sweetalert2';

const SignIn = () => {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [companyDetails, setCompanyDetails] = useState({
		name: '',
		logo: ''
	});

	useEffect(() => {
		const fetchCompanyInfo = async () => {
			try {
				const companyInfoRef = collection(db, 'companyDetails');
				const q = query(companyInfoRef, limit(1));
				const querySnapshot = await getDocs(q);
				
				if (!querySnapshot.empty) {
					const companyData = querySnapshot.docs[0].data();
					setCompanyDetails(companyData);
				}
			} catch (error) {
				console.error('Error fetching company info:', error);
			}
		};

		// Set up a real-time listener for company info changes
		const unsubscribe = onSnapshot(doc(db, 'companyDetails', 'companyInfo'), (doc) => {
			if (doc.exists()) {
				setCompanyDetails(doc.data());
			}
		});

		fetchCompanyInfo();

		// Cleanup subscription on unmount
		return () => unsubscribe();
	}, []);

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
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setError('');

  //   try {
  //     if (!email || !password) {
  //       throw new Error('Please enter both email and password');
  //     }

  //     // Firebase Authentication
  //     try {
  //       await signInWithEmailAndPassword(auth, email.trim(), password);
  //     } catch (firebaseError) {
  //       if (firebaseError.code === 'auth/invalid-credential' ||
  //           firebaseError.code === 'auth/user-not-found' ||
  //           firebaseError.code === 'auth/wrong-password') {
  //         throw new Error('Invalid email or password');
  //       }
  //       throw firebaseError;
  //     }

  //     // Backend Authentication
  //     const response = await fetch('/api/login', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ email: email.trim(), password }),
  //       credentials: 'include',
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.message || 'Login failed');
  //     }

  //     const data = await response.json();
      
  //     toast.success('Login successful!');
      
  //     // Ensure cookies are set before redirect
  //     await new Promise(resolve => setTimeout(resolve, 100));
  //     window.location.href = '/dashboard/overview';
      
  //   } catch (error) {
  //     console.error('Login error:', error);
  //     setPassword(''); // Clear password field on error
      
  //     let errorMessage;
  //     if (error.code) {
  //       switch (error.code) {
  //         case 'auth/invalid-email':
  //           errorMessage = 'Please enter a valid email address';
  //           break;
  //         case 'auth/user-disabled':
  //           errorMessage = 'This account has been disabled';
  //           break;
  //         case 'auth/too-many-requests':
  //           errorMessage = 'Too many failed attempts. Please try again later';
  //           break;
  //         case 'auth/network-request-failed':
  //           errorMessage = 'Network error. Please check your internet connection';
  //           break;
  //         default:
  //           errorMessage = 'Invalid email or password';
  //       }
  //     } else {
  //       errorMessage = error.message;
  //     }
      
  //     setError(errorMessage);
  //     toast.error(errorMessage, {
  //       position: "top-right",
  //       autoClose: 3000,
  //       hideProgressBar: false,
  //       closeOnClick: true,
  //       pauseOnHover: true,
  //       draggable: true,
  //     });
      
  //     setLoading(false);
  //   }
  // };

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
                {/* <Image src="/images/SAS-LOGO.png" alt="SAS Logo" height={150} width={250} /> */}
                <Image 
							src={companyDetails.logo} 
							alt={companyDetails.name || 'Company Logo'} 
							style={{ height: '100px' }} 
						/>
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


// import { Fragment, useState } from 'react';
// import { useRouter } from 'next/router';
// import { Col, Row, Card, Form, Button, Image } from 'react-bootstrap';
// import { signInWithEmailAndPassword } from 'firebase/auth';  
// import { auth } from '../../firebase';  
// import Cookies from 'js-cookie';
// import { toast, ToastContainer } from 'react-toastify';
// import { ClipLoader } from 'react-spinners';

// const SignIn = () => {
//   const [email, setEmail] = useState(''); 
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();
//   const [companyDetails, setCompanyDetails] = useState({
// 		name: '',
// 		logo: ''
// 	});

// 	useEffect(() => {
// 		const fetchCompanyInfo = async () => {
// 			try {
// 				const companyInfoRef = collection(db, 'companyDetails');
// 				const q = query(companyInfoRef, limit(1));
// 				const querySnapshot = await getDocs(q);
				
// 				if (!querySnapshot.empty) {
// 					const companyData = querySnapshot.docs[0].data();
// 					setCompanyDetails(companyData);
// 				}
// 			} catch (error) {
// 				console.error('Error fetching company info:', error);
// 			}
// 		};

// 		// Set up a real-time listener for company info changes
// 		const unsubscribe = onSnapshot(doc(db, 'companyDetails', 'companyInfo'), (doc) => {
// 			if (doc.exists()) {
// 				setCompanyDetails(doc.data());
// 			}
// 		});

// 		fetchCompanyInfo();

// 		// Cleanup subscription on unmount
// 		return () => unsubscribe();
// 	}, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     if (!email || !password) {
//       toast.error('Please enter both email and password');
//       setLoading(false);
//       return;
//     }
    
//     try {
//       // Firebase Authentication
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       const token = await userCredential.user.getIdToken();

//       // Backend Authentication
//       const response = await fetch('/api/login', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ email, password }),
//         credentials: 'include',
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Login failed');
//       }

//       const data = await response.json();

//       toast.success('Login successful!', {
//         position: "top-right",
//         autoClose: 2000,
//       });

//       // Ensure cookies are set before redirect
//       await new Promise(resolve => setTimeout(resolve, 100));

//       // Force a hard redirect to dashboard
//       window.location.href = '/dashboard/overview';
      
//     } catch (error) {
//       console.error('Login error:', error);
//       setPassword(''); // Clear password field on error
      
//       let errorMessage = 'An unexpected error occurred';
      
//       // Firebase Auth Error Handling
//       if (error.code) {
//         switch (error.code) {
//           case 'auth/invalid-credential':
//             errorMessage = 'Invalid email or password';
//             break;
//           case 'auth/user-not-found':
//             errorMessage = 'No account found with this email address';
//             break;
//           case 'auth/wrong-password':
//             errorMessage = 'Incorrect password';
//             break;
//           case 'auth/invalid-email':
//             errorMessage = 'Invalid email address';
//             break;
//           case 'auth/user-disabled':
//             errorMessage = 'This account has been disabled';
//             break;
//           case 'auth/too-many-requests':
//             errorMessage = 'Too many failed attempts. Please try again later';
//             break;
//           case 'auth/network-request-failed':
//             errorMessage = 'Network error. Please check your internet connection';
//             break;
//           default:
//             errorMessage = 'Login failed. Please check your credentials and try again';
//         }
//       } else if (error.message) {
//         // Backend API Error Handling
//         if (error.message.includes('not active')) {
//           errorMessage = 'Account is not active. Please contact an administrator';
//         } else if (error.message.includes('expired')) {
//           errorMessage = 'Account has expired. Please contact an administrator';
//         } else if (error.message.includes('Admins only')) {
//           errorMessage = 'Access denied. Admin privileges required';
//         } else {
//           errorMessage = error.message;
//         }
//       }
      
//       toast.error(errorMessage, {
//         position: "top-right",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//       });
      
//       setLoading(false);
//     }
//   };

//   return (
//     <Fragment>
//       <ToastContainer 
//         position="top-right"
//         autoClose={5000}
//         hideProgressBar={false}
//         newestOnTop
//         closeOnClick
//         rtl={false}
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//         theme="light"
//       />
//       <Row className="align-items-center justify-content-center g-0 min-vh-100">
//         <Col lg={5} md={5} className="py-8 py-xl-0">
//           <Card>
//             <Card.Body className="p-6">
//               <div className="mb-4 text-center">
//               <Image 
// 							src={companyDetails.logo} 
// 							alt={companyDetails.name || 'Company Logo'} 
// 							style={{ height: '100px' }} 
// 						/>
//               </div>
//               <Form onSubmit={handleSubmit}>
//                 <Row>
//                   <Col lg={12} md={12} className="mb-3">
//                     <Form.Label>Email</Form.Label>
//                     <Form.Control
//                       type="email"
//                       placeholder="Enter your email"
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value.trim())}
//                       required
//                       disabled={loading}
//                     />
//                   </Col>
//                   <Col lg={12} md={12} className="mb-3">
//                     <Form.Label>Password</Form.Label>
//                     <Form.Control
//                       type="password"
//                       placeholder="Enter your password"
//                       value={password}
//                       onChange={(e) => setPassword(e.target.value)}
//                       required
//                       disabled={loading}
//                     />
//                   </Col>
//                   <Col lg={12} md={12} className="mb-0 d-grid gap-2">
//                     <Button 
//                       variant="primary" 
//                       type="submit" 
//                       disabled={loading}
//                       className="py-2"
//                     >
//                       {loading ? (
//                         <div className="d-flex align-items-center justify-content-center">
//                           <ClipLoader color="#ffffff" size={20} />
//                           <span className="ms-2">Signing In...</span>
//                         </div>
//                       ) : (
//                         'Sign In'
//                       )}
//                     </Button>
//                   </Col>
//                 </Row>
//               </Form>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>
//     </Fragment>
//   );
// };

// export default SignIn;

// // import { Fragment, useState } from 'react';
// // import { useRouter } from 'next/router';
// // import { Col, Row, Card, Form, Button, Image } from 'react-bootstrap';
// // import { signInWithEmailAndPassword } from 'firebase/auth';  
// // import { auth } from '../../firebase';  
// // import Cookies from 'js-cookie';
// // import { toast } from 'react-toastify';
// // import { ClipLoader } from 'react-spinners';

// // const SignIn = () => {
// //   const [email, setEmail] = useState(''); 
// //   const [password, setPassword] = useState('');
// //   const [loading, setLoading] = useState(false);
// //   const router = useRouter();

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     setLoading(true);
    
// //     try {
// //       // Firebase Authentication
// //       const userCredential = await signInWithEmailAndPassword(auth, email, password);
// //       const token = await userCredential.user.getIdToken();

// //       // Backend Authentication
// //       const response = await fetch('/api/login', {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //         body: JSON.stringify({ email, password }),
// //         credentials: 'include',
// //       });

// //       if (!response.ok) {
// //         const errorData = await response.json();
// //         throw new Error(errorData.message || 'Login failed');
// //       }

// //       const data = await response.json();

// //       // Set cookies with proper attributes
// //       const cookieOptions = {
// //         secure: true,
// //         sameSite: 'Lax',
// //         path: '/',
// //         expires: 1 // 1 day
// //       };

// //       // Set all cookies
// //       Cookies.set('customToken', data.customToken, cookieOptions);
// //       Cookies.set('uid', data.uid, cookieOptions);
// //       Cookies.set('email', email, cookieOptions);
// //       Cookies.set('workerId', data.workerId, cookieOptions);
// //       Cookies.set('isAdmin', data.isAdmin, cookieOptions);
      
// //       toast.success('Login successful!');

// //       // Ensure cookies are set before redirect
// //       await new Promise(resolve => setTimeout(resolve, 100));

// //       // Force a hard redirect to dashboard
// //       window.location.href = '/dashboard/overview';
      
// //     } catch (error) {
// //       console.error('Login error:', error);
// //       toast.error(error.message || 'Login failed. Please try again.');
// //       setLoading(false);
// //     }
// //   };

// //   return (
// //     <Fragment>
// //       <Row className="align-items-center justify-content-center g-0 min-vh-100">
// //         <Col lg={5} md={5} className="py-8 py-xl-0">
// //           <Card>
// //             <Card.Body className="p-6">
// //               <div className="mb-4 text-center">
// //                 <Image src="/images/SAS-LOGO.png" alt="SAS Logo" height={150} width={250} />
// //               </div>
// //               <Form onSubmit={handleSubmit}>
// //                 <Row>
// //                   <Col lg={12} md={12} className="mb-3">
// //                     <Form.Label>Email</Form.Label>
// //                     <Form.Control
// //                       type="email"
// //                       placeholder="Enter your email"
// //                       value={email}
// //                       onChange={(e) => setEmail(e.target.value)}
// //                       required
// //                       disabled={loading}
// //                     />
// //                   </Col>
// //                   <Col lg={12} md={12} className="mb-3">
// //                     <Form.Label>Password</Form.Label>
// //                     <Form.Control
// //                       type="password"
// //                       placeholder="Enter your password"
// //                       value={password}
// //                       onChange={(e) => setPassword(e.target.value)}
// //                       required
// //                       disabled={loading}
// //                     />
// //                   </Col>
// //                   <Col lg={12} md={12} className="mb-0 d-grid gap-2">
// //                     <Button 
// //                       variant="primary" 
// //                       type="submit" 
// //                       disabled={loading}
// //                       className="py-2"
// //                     >
// //                       {loading ? (
// //                         <div className="d-flex align-items-center justify-content-center">
// //                           <ClipLoader color="#ffffff" size={20} />
// //                           <span className="ms-2">Signing In...</span>
// //                         </div>
// //                       ) : (
// //                         'Sign In'
// //                       )}
// //                     </Button>
// //                   </Col>
// //                 </Row>
// //               </Form>
// //             </Card.Body>
// //           </Card>
// //         </Col>
// //       </Row>
// //     </Fragment>
// //   );
// // };

// // export default SignIn;