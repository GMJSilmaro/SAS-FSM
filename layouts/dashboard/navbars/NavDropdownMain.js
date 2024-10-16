// import node module libraries
import Link from 'next/link';
import { Fragment } from 'react';
import { NavDropdown, Badge } from 'react-bootstrap';
import { useMediaQuery } from 'react-responsive';

// import hooks
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

	const NavbarDesktop = () => {
		return (
			<NavDropdown title={
      <span>
        {item.menuitem} {item.badge && renderBadge(item.badge)}
      </span>} show>
				{item.children.map((submenu, submenuindex) => {
					if (submenu.divider || submenu.header) {
						return submenu.divider ? (
							<NavDropdown.Divider bsPrefix="mx-3" key={submenuindex} />
						) : (
							<h4 className="dropdown-header" key={submenuindex}>
								{/* Second level menu heading - its not a menu item */}
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
									{/* Second level menu item without having sub menu items */}
									{submenu.menuitem}
								</NavDropdown.Item>
							);
						} else {
							return (
								<NavDropdown
									title={submenu.menuitem}
									key={submenuindex}
									bsPrefix="dropdown-item d-block"
									className={`dropdown-submenu dropend py-0 `}
									show
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
													{/* Third level menu heading with description  */}
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
															{/* Third Level with button format menu item */}
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
															{/* Third Level menu item */}
															{submenuitem.menuitem}
                              {submenu.badge && renderBadge(submenu.badge)} {/* Badge for submenu items */}
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
	const NavbarMobile = () => {
		return (
			<NavDropdown title={ 
      <span>
        {item.menuitem} {item.badge && renderBadge(item.badge)}
      </span>} >
				{item.children.map((submenu, submenuindex) => {
					if (submenu.divider || submenu.header) {
						return submenu.divider ? (
							<NavDropdown.Divider bsPrefix="mx-3" key={submenuindex} />
						) : (
							<h4 className="dropdown-header" key={submenuindex}>
								{/* Second level menu heading - its not a menu item */}
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
									{/* Second level menu item without having sub menu items */}
									{submenu.menuitem}
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
													{/* Third level menu heading with description  */}
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
															{/* Third Level with button format menu item */}
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
															{/* Third Level menu item */}
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
			{/* There is only one setting between NavbarDesktop and NavbarMobile component i.e. show property used with <NavDropdown show> tag */}
			{hasMounted && isDesktop ? <NavbarDesktop /> : <NavbarMobile />}
		</Fragment>
	);
};


export default NavDropdownMain;


// import Link from 'next/link';
// import { Fragment } from 'react';
// import { NavDropdown, Badge } from 'react-bootstrap'; // Import Badge from Bootstrap
// import { useMediaQuery } from 'react-responsive';
// import useMounted from 'hooks/useMounted';

// const NavDropdownMain = (props) => {
//   const { item, onClick } = props;
//   const hasMounted = useMounted();
//   const isDesktop = useMediaQuery({
//     query: '(min-width: 1224px)'
//   });

//   const renderBadge = (badge) => {
//     if (!badge) return null;
//     return (
//       <Badge bg="primary" className="ms-2" style={{ fontSize: '0.8em' }}>
//         {badge}
//       </Badge>
//     ); // You can modify the `bg` and style as per your design needs
//   };

//   const NavbarDesktop = () => {
//     return (
//       <NavDropdown title={
//         <span>
//           {item.menuitem} {item.badge && renderBadge(item.badge)}
//         </span>
//       } show>
//         {item.children.map((submenu, submenuindex) => {
//           if (submenu.divider || submenu.header) {
//             return submenu.divider ? (
//               <NavDropdown.Divider bsPrefix="mx-3" key={submenuindex} />
//             ) : (
//               <h4 className="dropdown-header" key={submenuindex}>
//                 {submenu.header_text}
//               </h4>
//             );
//           } else {
//             return (
//               <NavDropdown.Item
//                 key={submenuindex}
//                 as={Link}
//                 href={submenu.link}
//                 className="dropdown-item"
//                 onClick={(expandedMenu) => onClick(!expandedMenu)}
//               >
//                 {submenu.menuitem}
//                 {submenu.badge && renderBadge(submenu.badge)} {/* Badge for submenu items */}
//               </NavDropdown.Item>
//             );
//           }
//         })}
//       </NavDropdown>
//     );
//   };

//   const NavbarMobile = () => {
//     return (
//       <NavDropdown title={
//         <span>
//           {item.menuitem} {item.badge && renderBadge(item.badge)}
//         </span>
//       }>
//         {item.children.map((submenu, submenuindex) => {
//           if (submenu.divider || submenu.header) {
//             return submenu.divider ? (
//               <NavDropdown.Divider bsPrefix="mx-3" key={submenuindex} />
//             ) : (
//               <h4 className="dropdown-header" key={submenuindex}>
//                 {submenu.header_text}
//               </h4>
//             );
//           } else {
//             return (
//               <NavDropdown.Item
//                 key={submenuindex}
//                 as={Link}
//                 href={submenu.link}
//                 className="dropdown-item"
//                 onClick={(expandedMenu) => onClick(!expandedMenu)}
//               >
//                 {submenu.menuitem}
//                 {submenu.badge && renderBadge(submenu.badge)} {/* Badge for submenu items */}
//               </NavDropdown.Item>
//             );
//           }
//         })}
//       </NavDropdown>
//     );
//   };

//   return (
//     <Fragment>
//       {hasMounted && isDesktop ? <NavbarDesktop /> : <NavbarMobile />}
//     </Fragment>
//   );
// };

// export default NavDropdownMain;


// // // import node module libraries
// // import Link from 'next/link';
// // import { Fragment } from 'react';
// // import { NavDropdown } from 'react-bootstrap';
// // import { useMediaQuery } from 'react-responsive';

// // // import hooks
// // import useMounted from 'hooks/useMounted';

// // const NavDropdownMain = (props) => {
// // 	const { item, onClick } = props;
// // 	const hasMounted = useMounted();
// // 	const isDesktop = useMediaQuery({
// // 		query: '(min-width: 1224px)'
// // 	});

// // 	const NavbarDesktop = () => {
// // 		return (
// // 			<NavDropdown title={item.menuitem} show>
// // 				{item.children.map((submenu, submenuindex) => {
// // 					if (submenu.divider || submenu.header) {
// // 						return submenu.divider ? (
// // 							<NavDropdown.Divider bsPrefix="mx-3" key={submenuindex} />
// // 						) : (
// // 							<h4 className="dropdown-header" key={submenuindex}>
// // 								{/* Second level menu heading - its not a menu item */}
// // 								{submenu.header_text}
// // 							</h4>
// // 						);
// // 					} else {
// // 						if (submenu.children === undefined) {
// // 							return (
// // 								<NavDropdown.Item
// // 									key={submenuindex}
// // 									as={Link}
// // 									href={submenu.link}
// // 									className="dropdown-item" onClick={(expandedMenu) => onClick(!expandedMenu)}
// // 								>
// // 									{/* Second level menu item without having sub menu items */}
// // 									{submenu.menuitem}
// // 								</NavDropdown.Item>
// // 							);
// // 						} else {
// // 							return (
// // 								<NavDropdown
// // 									title={submenu.menuitem}
// // 									key={submenuindex}
// // 									bsPrefix="dropdown-item d-block"
// // 									className={`dropdown-submenu dropend py-0 `}
// // 									show
// // 								>
// // 									{submenu.children.map((submenuitem, submenuitemindex) => {
// // 										if (submenuitem.divider || submenuitem.header) {
// // 											return submenuitem.divider ? (
// // 												<NavDropdown.Divider
// // 													bsPrefix="mx-3"
// // 													key={submenuitemindex}
// // 												/>
// // 											) : (
// // 												<Fragment key={submenuitemindex}>
// // 													{/* Third level menu heading with description  */}
// // 													<h5 className="dropdown-header text-dark">
// // 														{submenuitem.header_text}
// // 													</h5>
// // 													<p className="dropdown-text mb-0 text-wrap">
// // 														{submenuitem.description}
// // 													</p>
// // 												</Fragment>
// // 											);
// // 										} else {
// // 											return (
// // 												<Fragment key={submenuitemindex}>
// // 													{submenuitem.type === 'button' ? (
// // 														<div className="px-3 d-grid">
// // 															{/* Third Level with button format menu item */}
// // 															<Link href={submenuitem.link} className="btn-sm btn-primary text-center">
// // 																{submenuitem.menuitem}
// // 															</Link>
// // 														</div>
// // 													) : (
// // 														<NavDropdown.Item
// // 															as={Link}
// // 															href={submenuitem.link}
// // 															className="btn-sm btn-primary dropdown-item"
// // 															onClick={(expandedMenu) => onClick(!expandedMenu)}>
// // 															{/* Third Level menu item */}
// // 															{submenuitem.menuitem}
// // 														</NavDropdown.Item>
// // 													)}
// // 												</Fragment>
// // 											);
// // 										}
// // 									})}
// // 								</NavDropdown>
// // 							);
// // 						}
// // 					}
// // 				})}
// // 			</NavDropdown>
// // 		);
// // 	}
// // 	const NavbarMobile = () => {
// // 		return (
// // 			<NavDropdown title={item.menuitem}>
// // 				{item.children.map((submenu, submenuindex) => {
// // 					if (submenu.divider || submenu.header) {
// // 						return submenu.divider ? (
// // 							<NavDropdown.Divider bsPrefix="mx-3" key={submenuindex} />
// // 						) : (
// // 							<h4 className="dropdown-header" key={submenuindex}>
// // 								{/* Second level menu heading - its not a menu item */}
// // 								{submenu.header_text}
// // 							</h4>
// // 						);
// // 					} else {
// // 						if (submenu.children === undefined) {
// // 							return (
// // 								<NavDropdown.Item
// // 									key={submenuindex}
// // 									as={Link}
// // 									href={submenu.link}
// // 									className="dropdown-item" onClick={(expandedMenu) => onClick(!expandedMenu)}
// // 								>
// // 									{/* Second level menu item without having sub menu items */}
// // 									{submenu.menuitem}
// // 								</NavDropdown.Item>
// // 							);
// // 						} else {
// // 							return (
// // 								<NavDropdown
// // 									title={submenu.menuitem}
// // 									key={submenuindex}
// // 									bsPrefix="dropdown-item d-block"
// // 									className={`dropdown-submenu dropend py-0 `}
// // 								>
// // 									{submenu.children.map((submenuitem, submenuitemindex) => {
// // 										if (submenuitem.divider || submenuitem.header) {
// // 											return submenuitem.divider ? (
// // 												<NavDropdown.Divider
// // 													bsPrefix="mx-3"
// // 													key={submenuitemindex}
// // 												/>
// // 											) : (
// // 												<Fragment key={submenuitemindex}>
// // 													{/* Third level menu heading with description  */}
// // 													<h5 className="dropdown-header text-dark">
// // 														{submenuitem.header_text}
// // 													</h5>
// // 													<p className="dropdown-text mb-0 text-wrap">
// // 														{submenuitem.description}
// // 													</p>
// // 												</Fragment>
// // 											);
// // 										} else {
// // 											return (
// // 												<Fragment key={submenuitemindex}>
// // 													{submenuitem.type === 'button' ? (
// // 														<div className="px-3 d-grid">
// // 															{/* Third Level with button format menu item */}
// // 															<Link href={submenuitem.link} className="btn-sm btn-primary text-center">
// // 																{submenuitem.menuitem}
// // 															</Link>
// // 														</div>
// // 													) : (
// // 														<NavDropdown.Item
// // 															as={Link}
// // 															href={submenuitem.link}
// // 															className="btn-sm btn-primary dropdown-item"
// // 															onClick={(expandedMenu) => onClick(!expandedMenu)}>
// // 															{/* Third Level menu item */}
// // 															{submenuitem.menuitem}
// // 														</NavDropdown.Item>
// // 													)}
// // 												</Fragment>
// // 											);
// // 										}
// // 									})}
// // 								</NavDropdown>
// // 							);
// // 						}
// // 					}
// // 				})}
// // 			</NavDropdown>
// // 		);
// // 	}
// // 	return (
// // 		<Fragment>
// // 			{/* There is only one setting between NavbarDesktop and NavbarMobile component i.e. show property used with <NavDropdown show> tag */}
// // 			{hasMounted && isDesktop ? <NavbarDesktop /> : <NavbarMobile />}
// // 		</Fragment>
// // 	);
// // };


// // export default NavDropdownMain;
