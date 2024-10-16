import { v4 as uuid } from 'uuid';

const NavbarDefault = [
	{
		id: uuid(),
		menuitem: 'Dashboard',
		link: '#',
		children: [
			{ id: uuid(), menuitem: 'Overview', link: '/dashboard/overview'},
		],
		isAuthenticated: true,
	},

	{
		id: uuid(),
		menuitem: 'Workers',
		link: '#',
		children: [
			{
				id: uuid(),
				header: true,
				header_text: 'Field Worker'
			},
			{
				id: uuid(),
				menuitem: 'Add Worker',
				link: '/dashboard/workers/create-worker'
			},
			{
				id: uuid(),
				menuitem: 'View All Worker',
				link: '/dashboard/workers/list'
			},
			{
				id: uuid(),
				menuitem: 'Manage Schedule',
				link: '/dashboard/workers/schedules'
			}
		],
		isAuthenticated: true,
	},
	{
		id: uuid(),
		menuitem: 'Jobs',
		link: '#',
		children: [
			{
				id: uuid(),
				header: true,
				header_text: 'Jobs'
			},
			{
				id: uuid(),
				menuitem: 'Create Jobs',
				link: '/dashboard/jobs/create-jobs'
			},
			{
				id: uuid(),
				menuitem: 'View Job List',
				link: '/dashboard/jobs/list-jobs'
			}
		],
		isAuthenticated: true,
	},
	{
		id: uuid(),
		menuitem: 'Calendars',
		link: '#',
		children: [
			{
				id: uuid(),
				header: true,
				header_text: 'Calendars'
			},
			{
				id: uuid(),
				menuitem: 'View Calendar',
				link: '/dashboard/calendar'
			}	
		],
		isAuthenticated: true,
	},
	{
		id: uuid(),
		menuitem: 'Customers',
		link: '#',
		// badge: 'NEW',
		children: [
			{
				id: uuid(),
				header: true,
				header_text: 'Customers'
			},
			{
				id: uuid(),
				menuitem: 'View Customers',
				link: '/dashboard/customers/list'
			}
		],
	},
	{
		id: uuid(),
		menuitem: 'Maps',
		link: '#',
		badge: 'NEW',
		children: [
			{
				id: uuid(),
				header: true,
				header_text: 'Maps'
			},
			{
				id: uuid(),
				menuitem: 'View Map',
				link: '/dashboard/map'
			},
			
		],
	},
];

export default NavbarDefault;
