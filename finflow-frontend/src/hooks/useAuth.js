import { useSelector } from 'react-redux';

const useAuth = () => {
  const auth = useSelector((state) => state.auth || {});

  return {
    user: auth.user || null,
    token: auth.token || null,
    userRole: auth.userRole || null,
    isAuthenticated: auth.isAuthenticated || false,
    mfaRequired: auth.mfaRequired || false,
    loading: auth.loading || false,
    error: auth.error || null
  };
};

export default useAuth;
