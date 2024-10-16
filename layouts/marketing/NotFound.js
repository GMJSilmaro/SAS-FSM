// import node module libraries
import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';

// import layouts
import NavbarBrandOnly from 'layouts/marketing/navbars/NavbarBrandOnly';
import FooterWithSocialIcons from 'layouts/marketing/footers/FooterWithSocialIcons';

const NotFound = (props) => {
	useEffect(() => {
		document.body.className = 'bg-white';
	});

	return (
		<main>
			<section id="db-wrapper" className="bg-white">
				<Container className="d-flex flex-column">
					<NavbarBrandOnly />
					{props.children}
					<FooterWithSocialIcons />
				</Container>
			</section>
		</main>
	);
};

export default NotFound;
