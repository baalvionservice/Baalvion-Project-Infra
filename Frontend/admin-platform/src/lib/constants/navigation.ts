import type { UserRole } from '@/lib/types/auth.types';

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  roles?: UserRole[];
  children?: NavItem[];
}

export const NAVIGATION: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard',  href: '/dashboard',  iconName: 'LayoutDashboard' },
      { title: 'Analytics',  href: '/analytics',  iconName: 'BarChart3' },
    ],
  },
  {
    label: 'Identity',
    items: [
      {
        title: 'Identity Center',
        href: '/identity',
        iconName: 'UserCheck',
        roles: ['super_admin', 'admin'],
        children: [
          { title: 'Overview',       href: '/identity',              iconName: 'LayoutDashboard' },
          { title: 'Risk Events',    href: '/identity?tab=risk',     iconName: 'AlertTriangle'   },
          { title: 'RBAC Roles',     href: '/identity?tab=roles',    iconName: 'Shield'          },
          { title: 'Signing Keys',   href: '/identity?tab=keys',     iconName: 'Key'             },
          { title: 'API Keys',       href: '/identity?tab=apikeys',  iconName: 'Fingerprint'     },
        ],
      },
      {
        title: 'Users',
        href: '/users',
        iconName: 'Users',
        roles: ['super_admin', 'owner', 'admin', 'manager'],
      },
      {
        title: 'Organizations',
        href: '/organizations',
        iconName: 'Building2',
        roles: ['super_admin', 'owner', 'admin'],
      },
      {
        title: 'Sessions',
        href: '/sessions',
        iconName: 'Monitor',
        roles: ['super_admin', 'admin'],
      },
      {
        title: 'OAuth Clients',
        href: '/oauth',
        iconName: 'KeyRound',
        roles: ['super_admin', 'admin', 'owner'],
      },
    ],
  },
  {
    label: 'Security',
    items: [
      {
        title: 'Security SOC',
        href: '/security',
        iconName: 'ShieldAlert',
        badge: 'SOC',
        roles: ['super_admin', 'admin'],
        children: [
          { title: 'High-Risk Sessions', href: '/security',                   iconName: 'ShieldAlert' },
          { title: 'Security Events',    href: '/security?tab=events',        iconName: 'AlertTriangle' },
          { title: 'Risk Engine',        href: '/security?tab=risk',          iconName: 'Activity'    },
          { title: 'Blocked IPs',        href: '/security?tab=blocked',       iconName: 'XCircle'     },
          { title: 'Compliance',         href: '/security?tab=compliance',    iconName: 'FileText'    },
        ],
      },
      {
        title: 'Audit Logs',
        href: '/audit-logs',
        iconName: 'ScrollText',
        roles: ['super_admin', 'owner', 'admin'],
      },
      {
        title: 'Audit Center',
        href: '/audit-center',
        iconName: 'ShieldCheck',
        roles: ['super_admin', 'owner', 'admin'],
        children: [
          { title: 'All Events',      href: '/audit-center',               iconName: 'ScrollText'    },
          { title: 'RBAC Activity',   href: '/audit-center?tab=rbac',      iconName: 'UsersRound'    },
          { title: 'Payment Events',  href: '/audit-center?tab=payments',  iconName: 'CreditCard'    },
          { title: 'Security Events', href: '/audit-center?tab=security',  iconName: 'AlertTriangle' },
        ],
      },
    ],
  },
  {
    label: 'Content',
    items: [
      {
        title: 'CMS',
        href: '/cms',
        iconName: 'Globe',
        children: [
          { title: 'Overview',    href: '/cms',            iconName: 'LayoutDashboard' },
          { title: 'Websites',    href: '/cms/websites',   iconName: 'Globe'           },
          { title: 'Workflows',   href: '/cms/workflows',  iconName: 'GitBranch'       },
          { title: 'Pages',       href: '/cms/pages',      iconName: 'File'            },
          { title: 'Posts',       href: '/cms/posts',      iconName: 'BookOpen'        },
          { title: 'Categories',  href: '/cms/categories', iconName: 'FolderOpen'      },
          { title: 'Tags',        href: '/cms/tags',       iconName: 'Tag'             },
        ],
      },
      { title: 'Media', href: '/media', iconName: 'Image' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      {
        title: 'Team Management',
        href: '/rbac',
        iconName: 'UsersRound',
        roles: ['super_admin'],
        children: [
          { title: 'Countries & Stores', href: '/rbac', iconName: 'Globe2' },
        ],
      },
      {
        title: 'Commerce',
        href: '/commerce',
        iconName: 'ShoppingBag',
        children: [
          { title: 'Overview',    href: '/commerce',             iconName: 'LayoutDashboard' },
          { title: 'Products',    href: '/commerce/products',    iconName: 'Package'         },
          { title: 'Categories',  href: '/commerce/categories',  iconName: 'FolderOpen'      },
          { title: 'Orders',      href: '/commerce/orders',      iconName: 'ShoppingCart'    },
          { title: 'Customers',   href: '/commerce/customers',   iconName: 'Users'           },
          { title: 'Inventory',   href: '/commerce/inventory',   iconName: 'Warehouse'       },
          { title: 'Warehouses',  href: '/commerce/warehouses',  iconName: 'Building'        },
          { title: 'Discounts',   href: '/commerce/discounts',   iconName: 'Tag'             },
          { title: 'Shipping',    href: '/commerce/shipping',    iconName: 'Truck'           },
          { title: 'Returns',     href: '/commerce/returns',     iconName: 'RotateCcw'       },
          { title: 'Analytics',   href: '/commerce/analytics',   iconName: 'BarChart3'       },
          { title: 'Revenue',     href: '/commerce/revenue',     iconName: 'DollarSign', roles: ['super_admin', 'owner', 'admin'] },
          { title: 'Markets',     href: '/commerce/markets',     iconName: 'Globe2'          },
          { title: 'Reviews',     href: '/commerce/reviews',     iconName: 'Star'            },
          { title: 'Settings',    href: '/commerce/settings',    iconName: 'Settings'        },
        ],
      },
    ],
  },
  {
    label: 'Talent',
    items: [
      {
        title: 'Jobs',
        href: '/jobs',
        iconName: 'Briefcase',
        children: [
          { title: 'Overview', href: '/jobs', iconName: 'LayoutDashboard' },
        ],
      },
    ],
  },
  {
    label: 'Ecosystem',
    items: [
      { title: 'Law Elite',         href: '/law',           iconName: 'Scale'   },
      { title: 'ControlTheMarket',  href: '/ctm',           iconName: 'Trophy'  },
      { title: 'Imperialpedia',     href: '/imperialpedia', iconName: 'BookOpen' },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        title: 'Payments',
        href: '/payments',
        iconName: 'CreditCard',
        roles: ['super_admin', 'owner', 'admin'],
        children: [
          { title: 'Transactions',  href: '/payments',               iconName: 'ArrowLeftRight' },
          { title: 'Subscriptions', href: '/payments/subscriptions', iconName: 'RefreshCw'      },
          { title: 'Invoices',      href: '/payments/invoices',      iconName: 'Receipt'        },
          { title: 'Webhooks',      href: '/payments/webhooks',      iconName: 'Webhook'        },
        ],
      },
      {
        title: 'Billing',
        href: '/billing',
        iconName: 'Wallet',
        roles: ['super_admin', 'owner', 'admin'],
      },
      {
        title: 'Notifications',
        href: '/notifications',
        iconName: 'Bell',
        children: [
          { title: 'Overview',   href: '/notifications',           iconName: 'Bell'     },
          { title: 'Logs',       href: '/notifications/logs',      iconName: 'ScrollText' },
          { title: 'Templates',  href: '/notifications/templates', iconName: 'FileText'  },
        ],
      },
      {
        title: 'Support',
        href: '/support',
        iconName: 'Headphones',
        roles: ['super_admin', 'admin', 'support'],
        children: [
          { title: 'Tickets',  href: '/support',            iconName: 'MessageSquare' },
          { title: 'Macros',   href: '/support?tab=macros', iconName: 'Tag'           },
        ],
      },
    ],
  },
  {
    label: 'AI & Data',
    items: [
      {
        title: 'AI Operations',
        href: '/ai',
        iconName: 'Bot',
        badge: 'Beta',
        roles: ['super_admin', 'admin'],
        children: [
          { title: 'Models',   href: '/ai',                  iconName: 'Cpu'      },
          { title: 'Agents',   href: '/ai?tab=agents',       iconName: 'Bot'      },
          { title: 'Prompts',  href: '/ai?tab=prompts',      iconName: 'Code2'    },
          { title: 'Queue',    href: '/ai?tab=queue',        iconName: 'Zap'      },
          { title: 'Vectors',  href: '/ai?tab=vectors',      iconName: 'Database' },
          { title: 'Cost',     href: '/ai?tab=cost',         iconName: 'DollarSign' },
        ],
      },
    ],
  },
  {
    label: 'People',
    items: [
      {
        title: 'Staff',
        href: '/staff',
        iconName: 'Users2',
        roles: ['super_admin', 'owner', 'admin'],
        children: [
          { title: 'Employees',    href: '/staff',                    iconName: 'Users'    },
          { title: 'Departments',  href: '/staff?tab=departments',    iconName: 'Building2' },
          { title: 'Invitations',  href: '/staff?tab=invitations',   iconName: 'Mail'     },
        ],
      },
    ],
  },
  {
    label: 'Developers',
    items: [
      {
        title: 'Developer Platform',
        href: '/developers',
        iconName: 'Code2',
        roles: ['super_admin', 'admin', 'developer'],
        children: [
          { title: 'API Analytics', href: '/developers',                   iconName: 'BarChart3'  },
          { title: 'Webhooks',      href: '/developers?tab=webhooks',      iconName: 'Webhook'    },
          { title: 'Changelog',     href: '/developers?tab=changelog',     iconName: 'BookOpen'   },
          { title: 'SDKs',          href: '/developers?tab=sdks',          iconName: 'Package'    },
          { title: 'Sandbox',       href: '/developers?tab=sandbox',       iconName: 'Terminal'   },
        ],
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        title: 'Infrastructure',
        href: '/infrastructure',
        iconName: 'Server',
        roles: ['super_admin'],
        children: [
          { title: 'Services',       href: '/infrastructure',                      iconName: 'Server'    },
          { title: 'Kubernetes',     href: '/infrastructure?tab=k8s',              iconName: 'Container' },
          { title: 'System Metrics', href: '/infrastructure?tab=metrics',          iconName: 'Cpu'       },
          { title: 'Queues',         href: '/infrastructure?tab=queues',           iconName: 'Zap'       },
          { title: 'Observability',  href: '/infrastructure?tab=observability',    iconName: 'Activity'  },
        ],
      },
      {
        title: 'Operations',
        href: '/operations',
        iconName: 'Gauge',
        roles: ['super_admin', 'owner', 'admin'],
        children: [
          { title: 'Service Health',  href: '/operations',                    iconName: 'Activity' },
          { title: 'Queues',          href: '/operations?tab=queues',         iconName: 'Zap'      },
          { title: 'Reconciliation',  href: '/operations?tab=reconciliation', iconName: 'Scale'    },
        ],
      },
      {
        title: 'Feature Flags',
        href: '/feature-flags',
        iconName: 'ToggleLeft',
        roles: ['super_admin', 'owner'],
      },
      {
        title: 'Settings',
        href: '/settings',
        iconName: 'Settings',
        roles: ['super_admin', 'owner', 'admin'],
      },
    ],
  },
];
