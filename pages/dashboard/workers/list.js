// import node module libraries
import { Fragment } from 'react';
import { Col, Row, Card, Tab, Breadcrumb, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import Link from 'next/link';

// import widget/custom components
import { GeeksSEO, GridListViewButton } from 'widgets';

// import sub components
import { WorkerGridCard,  WorkersListItems }  from 'sub-components';


const Worker = () => {
	return (
		<Fragment>
			<GeeksSEO title="Worker Lists | SAS&ME - SAP B1 | Portal" />
			<Tab.Container defaultActiveKey="list">
				<Row>
					<Col lg={12} md={12} sm={12}>
						<div 
							style={{
								background: "linear-gradient(90deg, #4171F5 0%, #3DAAF5 100%)",
								padding: "1.5rem 2rem",
								borderRadius: "0 0 24px 24px",
								marginTop: "-39px",
								marginLeft: "10px",
								marginRight: "10px",
								marginBottom: "20px",
							}}
						>
							<div className="d-flex justify-content-between align-items-start">
								<div className="d-flex flex-column">
									<div className="mb-3">
										<h1
											className="mb-2"
											style={{
												fontSize: "28px",
												fontWeight: "600",
												color: "#FFFFFF",
												letterSpacing: "-0.02em",
											}}
										>
											Workers
										</h1>
										<p
											className="mb-2"
											style={{
												fontSize: "16px",
												color: "rgba(255, 255, 255, 0.7)",
												fontWeight: "400",
												lineHeight: "1.5",
											}}
										>
											Manage your workforce efficiently, track worker assignments, and monitor individual performance metrics
										</p>
										<div
											className="d-flex align-items-center gap-2"
											style={{
												fontSize: "14px",
												color: "rgba(255, 255, 255, 0.9)",
												background: "rgba(255, 255, 255, 0.1)",
												padding: "8px 12px",
												borderRadius: "6px",
												marginTop: "8px",
											}}
										>
											<i className="fe fe-info" style={{ fontSize: "16px" }}></i>
											<span>
												Create and manage worker profiles and personal information
											</span>
										</div>
									</div>

									<div className="d-flex align-items-center gap-2 mb-4">
										<span
											className="badge"
											style={{
												background: "#FFFFFF",
												color: "#4171F5",
												padding: "6px 12px",
												borderRadius: "6px",
												fontWeight: "500",
												fontSize: "14px",
											}}
										>
											Worker Management
										</span>
										<span
											className="badge"
											style={{
												background: "rgba(255, 255, 255, 0.2)",
												color: "#FFFFFF",
												padding: "6px 12px",
												borderRadius: "6px",
												fontWeight: "500",
												fontSize: "14px",
											}}
										>
											<i className="fe fe-users me-1"></i>
											Workforce
										</span>
									</div>

									<nav
										style={{
											fontSize: "14px",
											fontWeight: "500",
										}}
									>
										<div className="d-flex align-items-center">
											<i
												className="fe fe-home"
												style={{ color: "rgba(255, 255, 255, 0.7)" }}
											></i>
											<Link
												href="/"
												className="text-decoration-none ms-2"
												style={{ color: "rgba(255, 255, 255, 0.7)" }}
											>
												Dashboard
											</Link>
											<span
												className="mx-2"
												style={{ color: "rgba(255, 255, 255, 0.7)" }}
											>
												/
											</span>
											<i
												className="fe fe-users"
												style={{ color: "#FFFFFF" }}
											></i>
											<span className="ms-2" style={{ color: "#FFFFFF" }}>
												Workers
											</span>
										</div>
									</nav>
								</div>

								{/* Right side with action button */}
								<div>
                <OverlayTrigger
                  placement="left"
                  overlay={<Tooltip>Create a new worker account</Tooltip>}
                >
                  <Link href="/workers/create" passHref>
                    <Button
                      variant="light"
                      className="create-job-button"
                      style={{
                        border: "none",
                        borderRadius: "12px",
                        padding: "10px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.2s ease",
                        fontWeight: "500",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <FaPlus className="plus-icon" size={16} />
                      <span>Add New Worker</span>
                    </Button>
                  </Link>
                </OverlayTrigger>
              </div>
							</div>
						</div>
					</Col>
				</Row>
				
				<Tab.Content>
					<Tab.Pane eventKey="list" className="pb-4 tab-pane-custom-margin">
						<WorkersListItems />
					</Tab.Pane>
				</Tab.Content>
			</Tab.Container>
			<style jsx global>{`
				.header-button {
					font-weight: 500 !important;
					backdrop-filter: blur(8px);
				}

				.header-button:hover {
					color: white !important;
				}

				.header-button:active {
					transform: translateY(0) !important;
				}
			`}</style>
		</Fragment>
	);
};

export default Worker;
