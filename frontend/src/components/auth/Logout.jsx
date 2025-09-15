// src/components/Logout.jsx
import React from "react";
import { signOut } from "../../firebase";

export default function Logout() {
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return <button onClick={handleLogout}>Sign Out</button>;
}
