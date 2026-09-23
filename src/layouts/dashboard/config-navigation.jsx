import SvgColor from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
);

const navConfig = [
  {
    title: 'dashboard',
    path: '/',
    icon: icon('ic_analytics'),
  },
  {
    title: 'user',
    path: '/user',
    icon: icon('ic_user'),
  },

  {
    title: 'Category Of products',
    path: '/wholeSale',
    icon: icon('ic_user'),
  },
  {
    title: 'TicketManager',
    path: '/TicketManager',
    icon: icon('ic_user'),
  },
  {
    title: 'Ads Banner',
    path: '/Banner',
    icon: icon('ic_user'),
  },
  
  //  {
  //   title: 'Category Of products',
  //   path: '/category',
  //   icon: icon('ic_user'),
  // },
  {
    title: 'SubCategory Of products',
    path: '/subcategory',
    icon: icon('ic_user'),
  },
  {
    title: 'product',
    path: '/products',
    icon: icon('ic_cart'),
  },
  // {
  //   title: 'Vendor List',
  //   path: '/VendorList',
  //   icon: icon('ic_cart'),
  // },npm
  {
    title: 'Order',
    path: '/order',
    icon: icon('ic_blog'),
  },
  {
    title: 'Complaint',
    path: '/Complain',
    icon: icon('ic_blog'),
  },
  {
    title: 'Generate Coupan Code',
    path: '/Promocode',
    icon: icon('ic_lock'),
  },
   {
    title: 'Testimonial',
    path: '/testi',
    icon: icon('ic_lock'),
  },

  // {
  //   title: 'Not found',
  //   path: '/404',
  //   icon: icon('ic_disabled'),
  // },
];

export default navConfig;
