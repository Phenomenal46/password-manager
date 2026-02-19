import { useState } from "react";
import { ToastContainer } from "react-toastify";
import { logoutUser } from "./api/authApi";
import Login from "./pages/Login";
import Vault from "./pages/Vault";

function App() {
  const [vaultKey, setVaultKey] = useState(null);

  async function handleLogout() {
    try {
      // Clear the server cookie so the session fully ends.
      await logoutUser();
    } finally {
      // Always wipe the in-memory key on logout.
      setVaultKey(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {/* Global toast host for the whole app */}
      <ToastContainer position="top-right" autoClose={3000} />
      {vaultKey ? (
        <Vault vaultKey={vaultKey} onLogout={handleLogout} />
      ) : (
        <Login onKeyDerived={setVaultKey} />
      )}
    </div>
  );
}

export default App;