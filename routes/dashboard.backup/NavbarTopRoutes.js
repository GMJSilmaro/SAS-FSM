import { v4 as uuid } from 'uuid';

const NavbarDefault = [
	{
		id: uuid(),
		menuitem: 'Dashboard',
		link: '#',
		children: [
			{ id: uuid(), menuitem: 'Overview', link: '/dashboard/overview' },
			{ id: uuid(), menuitem: 'Analytics', link: '/dashboard/analytics' }
		]
	},
	{
		id: uuid(),
		menuitem: 'Pages',
		link: '#',
		children: [
			{
				id: uuid(),
				menuitem: 'Courses',
				link: '#',
				children: [
					{
						id: uuid(),
						menuitem: 'All Course',
						link: '/dashboard/courses/all-courses'
					},
					{
						id: uuid(),
						menuitem: 'Course Category',
						link: '/dashboard/courses/courses-category'
					},
					{
						id: uuid(),
						menuitem: 'Category Single',
						link: '/dashboard/courses/category-single'
					}
				]
			},
			{
				id: uuid(),
				menuitem: 'Users',
				link: '#',
				children: [
					{
						id: uuid(),
						menuitem: 'Instructor',
						link: '/dashboard/user/instructor'
					},
					{
						id: uuid(),
						menuitem: 'Students',
						link: '/dashboard/user/students'
					}
				]
			},
			{
				id: uuid(),
				menuitem: 'CMS',
				link: '#',
				children: [
					{
						id: uuid(),
						menuitem: 'Overview',
						link: '/dashboard/cms/cms-dashboard'
					},
					{
						id: uuid(),
						menuitem: 'All Posts',
						link: '/dashboard/cms/all-posts'
					},
					{
						id: uuid(),
						menuitem: 'New Post',
						link: '/dashboard/cms/add-new-post'
					},
					{
						id: uuid(),
						menuitem: 'Category',
						link: '/dashboard/cms/category'
					}
				]
			},
			{
				id: uuid(),
				menuitem: 'Project',
				link: '#',
				children: [
					{
						id: uuid(),
						menuitem: 'Grid',
						link: '/dashboard/projects/grid'
					},
					{
						id: uuid(),
						menuitem: 'List',
						link: '/dashboard/projects/list'
					},
					{
						id: uuid(),
						menuitem: 'Single',
						link: '#',
						children: [
							{
								id: uuid(),
								menuitem: 'Overview',
								link: '/dashboard/projects/single/overview'
							},
							{
								id: uuid(),
								menuitem: 'Task',
								link: '/dashboard/projects/single/task'
							},
							{
								id: uuid(),
								menuitem: 'Budget',
								link: '/dashboard/projects/single/budget'
							},
							{
								id: uuid(),
								menuitem: 'Files',
								link: '/dashboard/projects/single/files'
							},
							{
								id: uuid(),
								menuitem: 'Team',
								link: '/dashboard/projects/single/team'
							},
							{
								id: uuid(),
								menuitem: 'Summary',
								link: '/dashboard/projects/single/summary'
							}
						]
					},
					{
						id: uuid(),
						menuitem: 'Create Project',
						link: '/dashboard/projects/create-project'
					}
				]
			},
			{
				id: uuid(),
				menuitem: 'Site Setting',
				link: '#',
				children: [
					{
						id: uuid(),
						menuitem: 'General',
						link: '/dashboard/settings/general'
					},
					{
						id: uuid(),
						menuitem: 'Google',
						link: '/dashboard/settings/google'
					},
					{
						id: uuid(),
						menuitem: 'Social',
						link: '/dashboard/settings/social'
					},
					{
						id: uuid(),
						menuitem: 'Social Login',
						link: '/dashboard/settings/social-login'
					},
					{
						id: uuid(),
						menuitem: 'Payment',
						link: '/dashboard/settings/payment'
					},
					{
						id: uuid(),
						menuitem: 'SMTP',
						link: '/dashboard/settings/smtp-server'
					}
				]
			}
		]
	},
	{
		id: uuid(),
		menuitem: 'Apps',
		link: '#',
		children: [
			{
				id: uuid(),
				menuitem: 'Chat',
				link: '/dashboard/chat'
			},
			{
				id: uuid(),
				menuitem: 'Task',
				link: '/dashboard/task-kanban'
			},
			// -- Apps -> Mail - v2.1.0
			{
				id: uuid(),
				menuitem: 'Mail',
				link: '/dashboard/mail'
			},
			// -- Apps -> Calendar - v2.1.0
			{
				id: uuid(),
				menuitem: 'Calendar',
				link: '/dashboard/calendar'
			},
			// -- Apps -> Ecommerce - v2.2.0
			{
				id: uuid(),
				menuitem: 'Ecommerce',
				link: '#',
				children: [
					{
						id: uuid(),
						menuitem: 'Product Grid',
						link: '/dashboard/ecommerce/products/product-grid'
					},
					{
						id: uuid(),
						menuitem: 'Product Grid Sidebar',
						link: '/dashboard/ecommerce/products/product-grid-with-sidebar'
					},
					{ id: uuid(), link: '/dashboard/ecommerce/products', menuitem: 'Products' },
					{ id: uuid(), link: '/dashboard/ecommerce/products/product-single', menuitem: 'Product Single' },
					{ id: uuid(), link: '/dashboard/ecommerce/products/product-single-v2', menuitem: 'Product Single v2' },
					{ id: uuid(), link: '/dashboard/ecommerce/products/add-product', menuitem: 'Add Product' },
					{ id: uuid(), link: '/dashboard/ecommerce/shopping-cart', name: 'Shopping Cart' },
					{ id: uuid(), link: '/dashboard/ecommerce/checkout', menuitem: 'Checkout' },
					{ id: uuid(), link: '/dashboard/ecommerce/orders', menuitem: 'Orders' },
					{ id: uuid(), link: '/dashboard/ecommerce/order-single', menuitem: 'Order Single' },
					{ id: uuid(), link: '/dashboard/ecommerce/order-history', menuitem: 'Order History' },
					{ id: uuid(), link: '/dashboard/ecommerce/order-summary', menuitem: 'Order Summary' },
					{ id: uuid(), link: '/dashboard/ecommerce/customers', menuitem: 'Customers' },
					{ id: uuid(), link: '/dashboard/ecommerce/customer/1', menuitem: 'Customer Single' },
					{ id: uuid(), link: '/dashboard/ecommerce/add-customer', menuitem: 'Add Customer' }
				]
			},
		]
	},
	{
		id: uuid(),
		menuitem: 'Authentication',
		link: '#',
		children: [
			{
				id: uuid(),
				menuitem: 'Sign In',
				link: '/authentication/sign-in'
			},
			{
				id: uuid(),
				menuitem: 'Sign Up',
				link: '/authentication/sign-up'
			},
			{
				id: uuid(),
				menuitem: 'Forgot Password',
				link: '/authentication/forget-password'
			},
			{
				id: uuid(),
				menuitem: 'Notifications',
				link: '/dashboard/notification-history'
			},
			{
				id: uuid(),
				menuitem: '404 Error',
				link: '/404'
			},
			{
				id: uuid(),
				menuitem: 'Terms and Conditions',
				link: '/marketing/specialty/terms-and-conditions'
			}
		]
	},
	{
		id: uuid(),
		menuitem: 'Layouts',
		link: '#',
		children: [
			{
				id: uuid(),
				header: true,
				header_text: 'Layouts'
			},
			{
				id: uuid(),
				menuitem: 'Top',
				link: '/dashboard/layouts/layout-horizontal'
			},
			{
				id: uuid(),
				menuitem: 'Compact',
				link: '/dashboard/layouts/layout-compact'
			},
			{
				id: uuid(),
				menuitem: 'Vertical',
				link: '/dashboard/layouts/layout-vertical'
			}
		]
	},
	{
		id: uuid(),
		menuitem: 'Components',
		link: '#',
		children: [
			{ id: uuid(), link: '/dashboard/components/accordions', menuitem: 'Accordions' },
			{ id: uuid(), link: '/dashboard/components/alerts', menuitem: 'Alerts' },
			{ id: uuid(), link: '/dashboard/components/avatar', menuitem: 'Avatar' },
			{ id: uuid(), link: '/dashboard/components/badges', menuitem: 'Badges' },
			{ id: uuid(), link: '/dashboard/components/breadcrumbs', menuitem: 'Breadcrumbs' },
			{ id: uuid(), link: '/dashboard/components/buttons', menuitem: 'Buttons' },
			{ id: uuid(), link: '/dashboard/components/button-group', menuitem: 'ButtonGroup' },
			{ id: uuid(), link: '/dashboard/components/cards', menuitem: 'Cards' },
			{ id: uuid(), link: '/dashboard/components/carousels', menuitem: 'Carousel' },
			{ id: uuid(), link: '/dashboard/components/close-button', menuitem: 'Close Button' },
			{ id: uuid(), link: '/dashboard/components/collapse', menuitem: 'Collapse' },
			{ id: uuid(), link: '/dashboard/components/dropdowns', menuitem: 'Dropdowns' },
			{ id: uuid(), link: '/dashboard/components/list-group', menuitem: 'Listgroup' },
			{ id: uuid(), link: '/dashboard/components/modal', menuitem: 'Modal' },
			{ id: uuid(), link: '/dashboard/components/navs', menuitem: 'Navs' },
			{ id: uuid(), link: '/dashboard/components/navbar', menuitem: 'Navbar' },
			{ id: uuid(), link: '/dashboard/components/offcanvas', menuitem: 'Offcanvas' },
			{ id: uuid(), link: '/dashboard/components/overlays', menuitem: 'Overlays' },
			{ id: uuid(), link: '/dashboard/components/pagination', menuitem: 'Pagination' },
			{ id: uuid(), link: '/dashboard/components/popovers', menuitem: 'Popovers' },
			{ id: uuid(), link: '/dashboard/components/progress', menuitem: 'Progress' },
			{ id: uuid(), link: '/dashboard/components/spinners', menuitem: 'Spinners' },
			{ id: uuid(), link: '/dashboard/components/tables', menuitem: 'Tables' },
			{ id: uuid(), link: '/dashboard/components/toasts', menuitem: 'Toasts' },
			{ id: uuid(), link: '/dashboard/components/tooltips', menuitem: 'Tooltips' }
		]
	}
];

export default NavbarDefault;
