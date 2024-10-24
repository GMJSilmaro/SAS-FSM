import { v4 as uuid } from 'uuid';
import { HouseDoorFill, PeopleFill, BriefcaseFill, CalendarWeekFill, PersonFill, PersonBadgeFill, PersonLinesFill, ListTask } from 'react-bootstrap-icons';

const NavbarDefault = [
	{
		id: uuid(),
		menuitem: 'Dashboard',
		link: '#',
		icon: 'HouseDoorFill',
		children: [
			{ id: uuid(), menuitem: 'Overview', link: '/dashboard/overview'},
		],
		isAuthenticated: true,
	},
	{
		id: uuid(),
		menuitem: 'SAP B1 Data',
		badge: 'NEW',
		link: '#',
		icon: 'PeopleFill',
		children: [
			{
				id: uuid(),
				header: true,
				header_text: 'SAB B1 Data Menu'
			},
			{
				id: uuid(),
				menuitem: 'Customers',
				link: '/dashboard/customers/list',
				icon: 'PersonFill'
			},
		],
		isAuthenticated: true,
	},
	{
		id: uuid(),
		menuitem: 'Manage Users',
		link: '#',
		icon: 'PeopleFill',
		children: [
			{
				id: uuid(),
				header: true,
				header_text: 'Users Menu'
			},
			{
				id: uuid(),
				menuitem: 'Worker',
				link: '#',
				icon: 'PersonBadgeFill',
				children: [
					{
						id: uuid(),
						header: true,
						header_text: 'Manage Workers'
					},
					{
						id: uuid(),
						menuitem: 'View Worker',
						link: '/dashboard/workers/list',
						icon: 'PersonLinesFill'
					},
					{
						id: uuid(),
						menuitem: 'View Schedules',
						link: '/dashboard/scheduling/workers/schedules',
						icon: 'CalendarWeekFill'
					},
				]
			},
		],
		isAuthenticated: true,
	},
	{
		id: uuid(),
		menuitem: 'Manage Jobs',
		link: '#',
		icon: 'BriefcaseFill',
		children: [
			{
				id: uuid(),
				header: true,
				header_text: 'Jobs Menu'
			},
			{
				id: uuid(),
				menuitem: 'View Jobs',
				link: '/dashboard/jobs/list-jobs',
				icon: 'ListTask'
			},
			{
				id: uuid(),
				menuitem: 'View Schedules',
				link: '/dashboard/scheduling/jobs/current',
				icon: 'CalendarWeekFill'
			},
		],
		isAuthenticated: true,
	},
];

console.log('NavbarDefault:', JSON.stringify(NavbarDefault, null, 2));

export default NavbarDefault;
