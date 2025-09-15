// src/AuthContext.jsx
import React, { createContext, useContext } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, loading] = useAuthState(auth);
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
