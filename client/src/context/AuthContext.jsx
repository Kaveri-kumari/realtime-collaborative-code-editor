/**
 * AuthContext.jsx
 * Context provider managing JWT authentication state.
 * Validates active sessions, handles logins and registrations,
 * and distributes user identity to the application.
 */

import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Authenticate token on page loads
  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const res = await api.get("/auth/me");
          setUser(res.data);
        } catch (error) {
          console.error("Session verification failed: ", error.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifySession();
  }, [token]);

  // Authenticate user login credentials
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token: userToken, ...userProfile } = res.data;
    
    localStorage.setItem("token", userToken);
    setToken(userToken);
    setUser(userProfile);
    return res.data;
  };

  // Register a new user account
  const register = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    const { token: userToken, ...userProfile } = res.data;

    localStorage.setItem("token", userToken);
    setToken(userToken);
    setUser(userProfile);
    return res.data;
  };

  // Wipe active credentials
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
