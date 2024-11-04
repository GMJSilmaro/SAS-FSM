/**
 * This layout will be applicable if you want Navigation bar on top side or horizontal style navigation in Dashboard.
 */

// import node module libraries
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
	Container,
	Nav,
	Navbar,
	Form,
	Image
} from 'react-bootstrap';
import { collection, query, getDocs, limit, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';

// import sub components
import NavDropdownMain from './navbars/NavDropdownMain';
import DocumentMenu from './navbars/DocumentMenu';

// import sub components
import QuickMenu from 'layouts/QuickMenu';

// import routes file
import NavbarTopRoutes from 'routes/dashboard/NavbarTopRoutes';

const DashboardIndexTop = (props) => {
	const [expandedMenu, setExpandedMenu] = useState(false);
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

	return (
		<div>
			<Navbar
				bg="white"
				expand="lg"
				onToggle={(collapsed) => setExpandedMenu(collapsed)}
			>
				<Container className="px-0">
					{/* brand logo */}
					<Navbar.Brand
						as={Link}
						href="/dashboard/overview/">
						<Image 
							src={companyDetails.logo} 
							alt={companyDetails.name || 'Company Logo'} 
							style={{ height: '100px' }} 
						/>
					</Navbar.Brand>
					{/* search box */}
					<div className="ms-lg-3 d-none d-md-none d-lg-block">
					
					</div>
					{/* Right side quick / shortcut menu  */}

					<Nav className="navbar-nav navbar-right-wrap ms-auto d-flex nav-top-wrap">
						<span className={`d-flex`}>
							<QuickMenu />
						</span>
					</Nav>

					<Navbar.Toggle aria-controls="navbarScroll">
						<span className="icon-bar top-bar mt-0"></span>
						<span className="icon-bar middle-bar"></span>
						<span className="icon-bar bottom-bar"></span>
					</Navbar.Toggle>
				</Container>
			</Navbar>
			<Navbar
				expand="lg"
				className="navbar-default py-0 py-lg-2"
				expanded={expandedMenu}
			>
				<Container className="px-0">
					<Navbar.Collapse id="navbarScroll">
						<Nav>
							{NavbarTopRoutes.map((item, index) => {
								return (
									<NavDropdownMain
										item={item}
										key={index}
										onClick={(value) => setExpandedMenu(value)}
									/>
								);
							})}
							{/* <DocumentMenu /> */}
						</Nav>
					</Navbar.Collapse>
				</Container>
			</Navbar>
			{/* body container */}
			<Container className="my-6">{props.children}</Container>
		</div>
	);
};
export default DashboardIndexTop;
