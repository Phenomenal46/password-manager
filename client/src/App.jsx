import { useState } from "react";
import { ToastContainer } from "react-toastify";
import { logoutUser } from "./api/authApi";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Vault from "./pages/Vault";

function App() {
  const [vaultKey, setVaultKey] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  async function handleLogout() {
    try {
      // Clear the server cookie so the session fully ends.
      await logoutUser();
    } finally {
      // Always wipe the in-memory key on logout.
      setVaultKey(null);
      setShowLogin(false);
    }
  }

  function handleOpenLogin() {
    setShowLogin(true);
  }

  function handleLoginSuccess(key) {
    setVaultKey(key);
  }

  function handleBackToHome() {
    setShowLogin(false);
  }

  return (
    <div className="min-h-screen">
      {/* Global toast host for the whole app */}
      <ToastContainer position="top-right" autoClose={3000} />
      {vaultKey ? (
        <Vault vaultKey={vaultKey} onLogout={handleLogout} />
      ) : showLogin ? (
        // Dark gradient background for login page matching landing aesthetic.
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
          {/* Use same logo asset for brand consistency. */}
          <div className="fixed top-6 left-6 z-50 flex items-center gap-2 text-white text-xl font-semibold">
            <img src="/cyber_neon.svg" alt="VaultX logo" className="h-7 w-7" />
            <span>VaultX</span>
          </div>
          <Login onKeyDerived={handleLoginSuccess} onBack={handleBackToHome} />
        </div>
      ) : (
        <Landing onLoginClick={handleOpenLogin} />
      )}
    </div>
  );
}

export default App;