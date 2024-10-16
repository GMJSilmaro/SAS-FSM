// import node module libraries
import { Fragment } from 'react';
import { Col, Row, Card, Tab, Breadcrumb } from 'react-bootstrap';

// import widget/custom components
import { GeeksSEO, GridListViewButton } from 'widgets';

// import sub components
import { WorkerGridCard,  WorkersListItems }  from 'sub-components';
import WorkerStats from 'sub-components/dashboard/projects/single/task/WorkerStats';


const Worker = () => {
	return (
		<Fragment>
			<GeeksSEO title="Worker Lists | SAS - SAP B1 Portal" />
			<Tab.Container defaultActiveKey="list">
				<Row>
					<Col lg={12} md={12} sm={12}>
						<div className="border-bottom pb-4 mb-4 d-flex align-items-center justify-content-between">
							<div className="mb-3 mb-md-0">
								<h1 className="mb-1 h2 fw-bold">
									View Workers
									
								</h1>
								<Breadcrumb>
									<Breadcrumb.Item href="#">Dashboard</Breadcrumb.Item>
									<Breadcrumb.Item href="#">Workers</Breadcrumb.Item>
									<Breadcrumb.Item active>List</Breadcrumb.Item>
								</Breadcrumb>
							</div>
						
						</div>
					</Col>
				</Row>
				
				<Tab.Content>
				<Tab.Pane eventKey="list" className="pb-4 tab-pane-custom-margin">
					<WorkerStats />
				<WorkersListItems />
				</Tab.Pane>

				</Tab.Content>
			</Tab.Container>
		</Fragment>
	);
};


export default Worker;
