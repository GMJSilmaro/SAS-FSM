// import node module libraries
import Link from 'next/link';
import { Col, Row, Image } from 'react-bootstrap';

const NavbarBrandOnly = () => {
	return (
        <Row>
			<Col xl={{ offset: 1, span: 2 }} lg={12} md={12}>
				<div className="mt-4">
					<Link href="/" passHref>
						<Image src="/images/brand/logo/logo.svg" alt="" className="logo-inverse" />
					</Link>
				</div>
			</Col>
		</Row>
    );
};
export default NavbarBrandOnly;
