/* eslint-disable import/order */
/* eslint-disable perfectionist/sort-imports */
// src/routes/sections.jsx
import { lazy, Suspense } from 'react';
import { Outlet, Navigate, useRoutes } from 'react-router-dom';
// eslint-disable-next-line perfectionist/sort-imports
import DashboardLayout from 'src/layouts/dashboard';
// eslint-disable-next-line perfectionist/sort-imports
import ProtectedRoute from './ProtectedRoute';
import CoupanPage from 'src/pages/Coupan';
import WholeSalePage from 'src/pages/WholeSale';
import WholesaleCouponManager from 'src/pages/GeneratewholSaleCoupan';


// Import pages
export const IndexPage = lazy(() => import('src/pages/app'));
export const Complain=lazy(()=>import('src/pages/Complain'));
export const Testimonial=lazy(()=>import('src/pages/Testimonial'));
export const BlogPage = lazy(() => import('src/pages/blog'));
export const UserPage = lazy(() => import('src/pages/user'));
export const LoginPage = lazy(() => import('src/pages/login'));
export const ProductsPage = lazy(() => import('src/pages/products'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));
export const Category = lazy(() => import('src/pages/Category'));
export const Banner = lazy(() => import('src/pages/AdsBanner'));
export const SubCategory = lazy(() => import('src/pages/SubCategory'));
export const Product = lazy(() => import('src/pages/ProductData'));
export const OrderPage = lazy(() => import('src/sections/user/view/order-page'));
export const Vendor = lazy(() => import('src/pages/VendorList'));

export default function Router() {
  const routes = useRoutes([
    // 🔒 PROTECTED ROUTES
    {
      element: (
        <ProtectedRoute
          element={
            <DashboardLayout>
              <Suspense>
                <Outlet />
              </Suspense>
            </DashboardLayout>
          }
        />
      ),
      children: [
        { element: <IndexPage />, index: true },
        { path: 'user', element: <UserPage /> },
        { path: 'Banner', element: <Banner /> },

        { path: 'Generatewholesalecoupan', element: <WholesaleCouponManager /> },
        { path: 'Category', element: <Category /> },
        { path: 'subcategory', element: <SubCategory /> },
        { path: 'products', element: <Product /> },
        { path: 'VendorList', element: <Vendor /> },
        { path: 'order', element: <OrderPage /> },
        { path: 'blog', element: <BlogPage /> },
        { path: 'Promocode', element: <CoupanPage /> },
{ path: 'wholeSale', element: <WholeSalePage /> },
         { path: 'Complain', element: <Complain /> },
        { path: 'testi', element: <Testimonial /> },
      ],
    },

    // PUBLIC ROUTES
    { path: 'login', element: <LoginPage /> },
    { path: '404', element: <Page404 /> },
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);

  return routes;
}
