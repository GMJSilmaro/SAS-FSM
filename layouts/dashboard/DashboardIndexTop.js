/**
 * This layout will be applicable if you want Navigation bar on top side or horizontal style navigation in Dashboard.
 */

// import node module libraries
import { useState } from 'react';
import Link from 'next/link';
import {
	Container,
	Nav,
	Navbar,
	Form,
	Image
} from 'react-bootstrap';
import { collection, query, getDocs, limit, onSnapshot, doc , getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// import sub components
import NavDropdownMain from './navbars/NavDropdownMain';
import DocumentMenu from './navbars/DocumentMenu';

// import sub components
import QuickMenu from 'layouts/QuickMenu';

// import routes file
import NavbarTopRoutes from 'routes/dashboard/NavbarTopRoutes';

// import utility function
import { getCompanyDetails } from '../../utils/companyCache';
import { useLogo } from '../../contexts/LogoContext';

const DashboardIndexTop = (props) => {
	const { logo } = useLogo();
	const [expandedMenu, setExpandedMenu] = useState(false);

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
						href="/">
						<Image 
							src={logo} 
							alt="Company Logo"
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
