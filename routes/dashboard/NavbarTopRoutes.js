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
		menuitem: 'Manage Customer',
		badge: 'NEW',
		link: '#',
		icon: 'PeopleFill',
		children: [
			{
				id: uuid(),
				header: true,
				header_text: 'Customer Menu'
			},
			{
				id: uuid(),
				menuitem: 'Customers',
				link: '/dashboard/customers/list',
				icon: 'PersonFill'
			},
			{
				id: uuid(),
				menuitem: 'Service Locations',
				link: '/dashboard/locations/list',
				icon: 'GeoAltFill'
			},
		],
		isAuthenticated: true,
	},
	{
		id: uuid(),
		menuitem: 'Manage Workers',
		link: '#',
		icon: 'PeopleFill',
		children: [
			{
				id: uuid(),
				header: true,
				header_text: 'Workers Menu'
			},
			{
				id: uuid(),
				menuitem: 'Workers',
				link: '/dashboard/workers/list',
				icon: 'PersonLinesFill'
			},
			{
				id: uuid(),
				menuitem: 'Workers Dispatch',
				link: '/dashboard/scheduling/workers/schedules',
				icon: 'CalendarWeekFill'
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
				menuitem: 'Jobs',
				link: '/dashboard/jobs/list-jobs',
				icon: 'ListTask'
			},
			{
				id: uuid(),
				menuitem: 'Jobs Calendar',
				link: '/dashboard/scheduling/jobs/current',
				icon: 'CalendarWeekFill'
			},
		],
		isAuthenticated: true,
	},
];

//console.log('NavbarDefault:', JSON.stringify(NavbarDefault, null, 2));

export default NavbarDefault;
