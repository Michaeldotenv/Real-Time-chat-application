import { useAuthStore } from '../store/authStore';
import AuthenticatedNavbar from './authenticatedNavBar';
import UnauthenticatedNavbar from './UnAuthenticatedNavBar';

const Navbar = () => {
  const { authUser } = useAuthStore();
  
  return authUser ? <AuthenticatedNavbar /> : <UnauthenticatedNavbar />;
};

export default Navbar;