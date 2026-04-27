// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'ngo' | 'volunteer'
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const savedToken = localStorage.getItem('sevaknet_token');
    const savedUser = localStorage.getItem('sevaknet_user');
    const savedType = localStorage.getItem('sevaknet_user_type');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setUserType(savedType);
    }
    setIsLoading(false);
  }, []);

  const loginNgo = (userData, authToken) => {
    setUser(userData);
    setUserType('ngo');
    setToken(authToken);
    localStorage.setItem('sevaknet_token', authToken);
    localStorage.setItem('sevaknet_user', JSON.stringify(userData));
    localStorage.setItem('sevaknet_user_type', 'ngo');
  };

  const loginVolunteer = (userData, authToken) => {
    setUser(userData);
    setUserType('volunteer');
    setToken(authToken);
    localStorage.setItem('sevaknet_token', authToken);
    localStorage.setItem('sevaknet_user', JSON.stringify(userData));
    localStorage.setItem('sevaknet_user_type', 'volunteer');
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    setToken(null);
    localStorage.removeItem('sevaknet_token');
    localStorage.removeItem('sevaknet_user');
    localStorage.removeItem('sevaknet_user_type');
  };

  const isNgo = () => userType === 'ngo';
  const isVolunteer = () => userType === 'volunteer';
  const isAuthenticated = () => !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        token,
        isLoading,
        loginNgo,
        loginVolunteer,
        logout,
        isNgo,
        isVolunteer,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
