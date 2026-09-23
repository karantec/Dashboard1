// src/routes/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';

import { isAuthenticated } from 'src/utils/auth';

// eslint-disable-next-line react/prop-types
export default function ProtectedRoute({ element }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    // Redirect to login, remembering where the user was trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return element;
}