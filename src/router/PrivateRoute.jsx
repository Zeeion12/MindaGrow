import { useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const { currentUser, isLoggedIn } = useAuth();

  if (!isLoggedIn || !currentUser) {
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute;
