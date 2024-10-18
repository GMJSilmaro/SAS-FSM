import { v4 as uuid } from 'uuid';
import { HouseDoor, PersonFill, Calendar, BriefcaseFill, Map, User } from 'react-bootstrap-icons'; // import icons

const NavbarDefault = [
	{
		id: uuid(),
		menuitem: 'Dashboard',
		icon: <HouseDoor />, // icon for Dashboard
		link: '#',
		children: [
			{ id: uuid(), menuitem: 'Overview', link: '/dashboard/overview'},
		],
		isAuthenticated: true,
	},
	{
		id: uuid(),
		menuitem: 'Manage Users',
		icon: <User size={15} />,
		link: '#',
		children: [
			{
				id: uuid(),
				header: true,
				header_text: 'Users Menu'
			},
			{
				id: uuid(),
				menuitem: 'Worker',
				icon: <User size={15} />,
				link: '#',
				children: [
					{
						id: uuid(),
						header: true,
						header_text: 'Manage Workers'
					},
					{
						id: uuid(),
						menuitem: 'Add Worker',
						link: '/dashboard/workers/create-worker'
					},
					{
						id: uuid(),
						menuitem: 'View Worker',
						link: '/dashboard/workers/list'
					},
				]
			},
			// {
			// 	id: uuid(),
			// 	badge: 'NEW',
			// 	menuitem: 'Supervisor',
			// 	link: '#',
			// 	children: [
			// 		{
			// 			id: uuid(),
			// 			header: true,
			// 			header_text: 'Manage Supervisor'
			// 		},
			// 		{
			// 			id: uuid(),
			// 			menuitem: 'Add Supervisor',
			// 			link: '/dashboard/workers/create-worker'
			// 		},
			// 		{
			// 			id: uuid(),
			// 			menuitem: 'View Supervisor',
			// 			link: '/dashboard/workers/list'
			// 		},
			// 	]
			// },
			// {
			// 	id: uuid(),
			// 	menuitem: 'Chief Service Officer',
			// 	link: '#',
			// 	badge: 'NEW',
			// 	children: [
			// 		{
			// 			id: uuid(),
			// 			header: true,
			// 			header_text: 'Manage CSO'
			// 		},
			// 		{
			// 			id: uuid(),
			// 			menuitem: 'Add CSO',
			// 			link: '/dashboard/workers/create-worker'
			// 		},
			// 		{
			// 			id: uuid(),
			// 			menuitem: 'View CSO',
			// 			link: '/dashboard/workers/list'
			// 		},
			// 	]
			// },
			
		],
		isAuthenticated: true,
	},
	{
		id: uuid(),
		menuitem: 'Manage Jobs',
		icon: <BriefcaseFill size={15} />, // icon for Jobs
		link: '#',
		children: [
			{
				id: uuid(),
				header: true,
				header_text: 'Jobs Menu'
			},
			{
				id: uuid(),
				icon: <User size={15} />,
				menuitem: 'Create Jobs',
				link: '/dashboard/jobs/create-jobs'
			},
			{
				id: uuid(),
				icon: <User size={15} />,
				menuitem: 'View Jobs',
				link: '/dashboard/jobs/list-jobs'
			}
		],
		isAuthenticated: true,
	},
	{
		id: uuid(),
		menuitem: 'Schedules',
		icon: <PersonFill />, // icon for Field Worker
		link: '#',
		children: [
			{
				id: uuid(),
				header: true,
				header_text: 'Schedule Menu'
			},
			{
				id: uuid(),
				menuitem: 'Jobs',
				link: '#',
				children: [
					{
						id: uuid(),
						header: true,
						header_text: 'Job Calendar'
					},
					// {
					// 	id: uuid(),
					// 	menuitem: 'View Past Jobs',
					// 	link: '/dashboard/scheduling/jobs/past'
					// },
					{
						id: uuid(),
						menuitem: 'Calendar',
						link: '/dashboard/scheduling/jobs/current'
					},
					// {
					// 	id: uuid(),
					// 	menuitem: 'View Future Jobs',
					// 	link: '/dashboard/scheduling/jobs/future'
					// },
				]
			},
			{
				id: uuid(),
				menuitem: 'Workers',
				link: '#',
				children: [
					{
						id: uuid(),
						header: true,
						header_text: 'Worker Calendar'
					},
					{
						id: uuid(),
						menuitem: 'Calendar',
						link: '/dashboard/scheduling/workers/schedules'
					},
				]
			},
		],
		isAuthenticated: true,
	},
	// {
	// 	id: uuid(),
	// 	menuitem: 'SAP B1 Data',
	// 	badge: 'NEW',
	// 	link: '#',
	// 	children: [
	// 		{
	// 			id: uuid(),
	// 			header: true,
	// 			header_text: 'View SAB B1 Data'
	// 		},
	// 		{
	// 			id: uuid(),
	// 			menuitem: 'Customers',
	// 			link: '#',
	// 			badge: 'NEW',
	// 			children: [
	// 				{
	// 					id: uuid(),
	// 					header: true,
	// 					header_text: 'Customer Menu'
	// 				},
	// 				{
	// 					id: uuid(),
	// 					menuitem: 'View Customers',
	// 					link: '/dashboard/scheduling/jobs/past'
	// 				},
	// 			]
	// 		},
	// 		{
	// 			id: uuid(),
	// 			menuitem: 'Locations',
	// 			link: '#',
	// 			badge: 'NEW',
	// 			children: [
	// 				{
	// 					id: uuid(),
	// 					header: true,
	// 					header_text: 'Locations Menu'
	// 				},
	// 				{
	// 					id: uuid(),
	// 					menuitem: 'View Locations',
	// 					link: '/dashboard/scheduling/workers/schedules'
	// 				},
	// 			]
	// 		},
	// 	],
	// 	isAuthenticated: true,
	// },
	
	// {
	// 	id: uuid(),
	// 	menuitem: 'SAP B1 Data',
	// 	icon: <PersonFill />, // icon for Customers
	// 	link: '#',
	// 	children: [
	// 		{
	// 			id: uuid(),
	// 			header: true,
	// 			header_text: 'View SAP B1 Data'
	// 		},
	// 		{
	// 			id: uuid(),
	// 			menuitem: 'View Customers',
	// 			link: '/dashboard/customers/list'
	// 		}
	// 	],
	// },
	// {
	// 	id: uuid(),
	// 	menuitem: 'Maps',
	// 	icon: <Map />, // icon for Maps
	// 	link: '#',
	// 	badge: 'NEW',
	// 	children: [
	// 		{
	// 			id: uuid(),
	// 			header: true,
	// 			header_text: 'Maps'
	// 		},
	// 		{
	// 			id: uuid(),
	// 			menuitem: 'View Map',
	// 			link: '/dashboard/map'
	// 		},
	// 	],
	// },
];

export default NavbarDefault;
