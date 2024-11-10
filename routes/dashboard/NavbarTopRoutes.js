import { v4 as uuid } from 'uuid';
import { HouseDoorFill, PeopleFill, BriefcaseFill, CalendarWeekFill, PersonFill, PersonBadgeFill, PersonLinesFill, ListTask } from 'react-bootstrap-icons';

const NavbarDefault = [
	{
		id: uuid(),
		menuitem: 'Dashboard',
		link: '#',
		icon: 'HouseDoorFill',
		children: [
			{ id: uuid(), menuitem: 'Overview', link: '/dashboard'},
		],
		isAuthenticated: true,
	},
	{
		id: uuid(),
		menuitem: 'Manage Customer',
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
				link: '/customers',
				icon: 'PersonFill'
			},
			// {
			// 	id: uuid(),
			// 	menuitem: 'Service Locations',
				
			// 	link: '/dashboard/locations/list',
			// 	icon: 'GeoAltFill'
			// },
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
				link: '/workers',
				icon: 'PersonLinesFill'
			},
			{
				id: uuid(),
				menuitem: 'Workers Dispatch',
				link: '/schedule',
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
				link: '/jobs',
				icon: 'ListTask'
			},
			{
				id: uuid(),
				menuitem: 'Jobs Calendar',
				link: '/jobs/calendar',
				icon: 'CalendarWeekFill'
			},
		],
		isAuthenticated: true,
	},
];

//console.log('NavbarDefault:', JSON.stringify(NavbarDefault, null, 2));

export default NavbarDefault;
