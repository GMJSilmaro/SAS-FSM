// import node module libraries
import { useEffect, useState, Fragment } from 'react';
import { Menu, Search } from 'react-feather';
import Link from 'next/link';
import {
	Nav,
	Navbar,
	InputGroup,
	Form	
} from 'react-bootstrap';

// import sub components
import QuickMenu from 'layouts/QuickMenu';

const NavbarTop = (props) => {
	return (
        <Fragment>
			<Navbar expanded="lg" className="navbar-default">
				<div className="d-flex justify-content-between w-100">
					<div className="d-flex align-items-center">
						<Link
                            href="#"
                            id="nav-toggle"
                            onClick={() => props.data.SidebarToggleMenu(!props.data.showMenu)}>
                            <Menu size="18px" />
                        </Link>
						<div className="ms-lg-3 d-none d-md-none d-lg-block">
				
						</div>
					</div>

					<Nav className="navbar-right-wrap ms-2 d-flex nav-top-wrap">
						<QuickMenu/>
					</Nav>
				</div>
			</Navbar>
		</Fragment>
    );
};

export default NavbarTop;
