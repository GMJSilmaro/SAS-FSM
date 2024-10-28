import Link from 'next/link';
import { Fragment } from 'react';
import { NavDropdown, Badge } from 'react-bootstrap';
import { useMediaQuery } from 'react-responsive';
import * as Icons from 'react-bootstrap-icons';
import useMounted from 'hooks/useMounted';

const NavDropdownMain = (props) => {
	const { item, onClick } = props;
	const hasMounted = useMounted();
	const isDesktop = useMediaQuery({
		query: '(min-width: 1224px)'
	});

	const renderBadge = (badge) => {
		if (!badge) return null;
		return (
			<Badge bg="primary" className="ms-2" style={{ fontSize: '0.8em' }}>
				{badge}
			</Badge>
		);
	};

	const renderIcon = (iconName) => {
		if (!iconName) return null;
		const IconComponent = Icons[iconName];
		return IconComponent ? <IconComponent size={16} className="me-2" /> : null;
	};

	const renderMenuItem = (menuItem) => (
		<NavDropdown.Item
			key={menuItem.id}
			as={Link}
			href={menuItem.link}
			className="dropdown-item"
			onClick={(expandedMenu) => onClick(!expandedMenu)}
		>
			{renderIcon(menuItem.icon)}
			{menuItem.menuitem}
			{menuItem.badge && renderBadge(menuItem.badge)}
		</NavDropdown.Item>
	);

	const NavbarDesktop = () => {
		return (
			<NavDropdown
				title={
					<span>
						{renderIcon(item.icon)}
						{item.menuitem} {item.badge && renderBadge(item.badge)}
					</span>
				}
				show
			>
				{item.children.map((submenu) => {
					if (submenu.header) {
						return (
							<h4 className="dropdown-header" key={submenu.id}>
								{submenu.header_text}
							</h4>
						);
					} else if (submenu.children) {
						return (
							<NavDropdown
								title={
									<span>
										{renderIcon(submenu.icon)}
										{submenu.menuitem}
									</span>
								}
								key={submenu.id}
								bsPrefix="dropdown-item d-block"
								className="dropdown-submenu dropend py-0"
								show
							>
								{submenu.children.map((subItem) =>
									subItem.header ? (
										<h5 className="dropdown-header text-dark" key={subItem.id}>
											{subItem.header_text}
										</h5>
									) : (
										renderMenuItem(subItem)
									)
								)}
							</NavDropdown>
						);
					} else {
						return renderMenuItem(submenu);
					}
				})}
			</NavDropdown>
		);
	};

	const NavbarMobile = () => {
		return (
			<NavDropdown title={
				<span>
					{renderIcon(item.icon)}
					{item.menuitem} {item.badge && renderBadge(item.badge)}
				</span>} >
				{item.children.map((submenu, submenuindex) => {
					if (submenu.divider || submenu.header) {
						return submenu.divider ? (
							<NavDropdown.Divider bsPrefix="mx-3" key={submenuindex} />
						) : (
							<h4 className="dropdown-header" key={submenuindex}>
								{submenu.header_text}
							</h4>
						);
					} else {
						if (submenu.children === undefined) {
							return (
								<NavDropdown.Item
									key={submenuindex}
									as={Link}
									href={submenu.link}
									className="dropdown-item" onClick={(expandedMenu) => onClick(!expandedMenu)}
								>
									{renderIcon(submenu.icon)}
									{submenu.menuitem}
									{submenu.badge && renderBadge(submenu.badge)}
								</NavDropdown.Item>
							);
						} else {
							return (
								<NavDropdown
									title={submenu.menuitem}
									key={submenuindex}
									bsPrefix="dropdown-item d-block"
									className={`dropdown-submenu dropend py-0 `}
								>
									{submenu.children.map((submenuitem, submenuitemindex) => {
										if (submenuitem.divider || submenuitem.header) {
											return submenuitem.divider ? (
												<NavDropdown.Divider
													bsPrefix="mx-3"
													key={submenuitemindex}
												/>
											) : (
												<Fragment key={submenuitemindex}>
													<h5 className="dropdown-header text-dark">
														{submenuitem.header_text}
													</h5>
													<p className="dropdown-text mb-0 text-wrap">
														{submenuitem.description}
													</p>
												</Fragment>
											);
										} else {
											return (
												<Fragment key={submenuitemindex}>
													{submenuitem.type === 'button' ? (
														<div className="px-3 d-grid">
															<Link href={submenuitem.link} className="btn-sm btn-primary text-center">
																{submenuitem.menuitem}
															</Link>
														</div>
													) : (
														<NavDropdown.Item
															as={Link}
															href={submenuitem.link}
															className="btn-sm btn-primary dropdown-item"
															onClick={(expandedMenu) => onClick(!expandedMenu)}>
															{submenuitem.menuitem}
															{submenu.badge && renderBadge(submenu.badge)}
														</NavDropdown.Item>
													)}
												</Fragment>
											);
										}
									})}
								</NavDropdown>
							);
						}
					}
				})}
			</NavDropdown>
		);
	}
	return (
		<Fragment>
			{hasMounted && isDesktop ? <NavbarDesktop /> : <NavbarMobile />}
		</Fragment>
	);
};

export default NavDropdownMain;
