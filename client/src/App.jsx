/**
 * App.jsx
 * Central client routing table.
 * Wraps routes in AuthProvider context and restricts collaborative screens to authenticated sessions.
 */

import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Lobby from "./pages/Lobby";
import EditorWorkspace from "./pages/EditorWorkspace";

/**
 * Route protection wrapper.
 * Validates active JWT sessions, displaying loaders during token requests,
 * and redirecting unauthenticated visitors to the login portal.
 */
const PrivateRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-semibold text-slate-500 text-sm animate-pulse select-none">
        Verifying Session...
      </div>
    );
  }

  return token ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-semibold text-slate-500 text-sm animate-pulse select-none">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Pages */}
      <Route
        path="/login"
        element={!token ? <Login /> : <Navigate to="/lobby" replace />}
      />
      <Route
        path="/register"
        element={!token ? <Register /> : <Navigate to="/lobby" replace />}
      />

      {/* Protected Pages */}
      <Route
        path="/lobby"
        element={
          <PrivateRoute>
            <Lobby />
          </PrivateRoute>
        }
      />
      <Route
        path="/room/:roomId"
        element={
          <PrivateRoute>
            <EditorWorkspace />
          </PrivateRoute>
        }
      />

      {/* Routing Fallbacks */}
      <Route path="*" element={<Navigate to={token ? "/lobby" : "/login"} replace />} />
    </Routes>
  );
}

import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}