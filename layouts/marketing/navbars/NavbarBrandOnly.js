// import node module libraries
import Link from 'next/link';
import { Col, Row, Image } from 'react-bootstrap';

// import necessary Firebase dependencies
import { db } from '../../../firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { useState, useEffect } from 'react';

const NavbarBrandOnly = () => {
	// Add loading state
	const [isLoading, setIsLoading] = useState(true);
	const [logo, setLogo] = useState(null); // Initialize as null instead of default value

	useEffect(() => {
		const fetchCompanyInfo = async () => {
			try {
				const companyInfoRef = collection(db, 'companyInfo');
				const q = query(companyInfoRef, limit(1));
				const querySnapshot = await getDocs(q);
				
				if (!querySnapshot.empty) {
					const companyData = querySnapshot.docs[0].data();
					setLogo(companyData.logo || '/images/SAS-LOGO.png'); // Set default here
				} else {
					setLogo('/images/SAS-LOGO.png');
				}
			} catch (error) {
				console.error('Error fetching company info:', error);
				setLogo('/images/SAS-LOGO.png');
			} finally {
				setIsLoading(false);
			}
		};

		fetchCompanyInfo();
	}, []);

	// Show nothing while loading
	if (isLoading || !logo) {
		return null;
	}

	return (
		<Row>
			<Col xl={{ offset: 1, span: 2 }} lg={12} md={12}>
				<div className="mt-4">
					<Link href="/" passHref>
						<Image src={logo} alt="Company Logo" style={{ maxHeight: '100px', width: 'auto' }} />
					</Link>
				</div>
			</Col>
		</Row>
	);
};
export default NavbarBrandOnly;
