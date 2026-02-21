import { useState } from "react";
import { deriveKey } from "../crypto/crypto";
import { loginUser, signupUser } from "../api/authApi";

function Login({ onKeyDerived, onBack }) {
    const [email, setEmail] = useState("");
    const [masterPassword, setMasterPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // error state — shown as a red box in the UI instead of ugly alert()
    const [error, setError] = useState("");

    // isSignup toggles between "Login" and "Signup" mode
    const [isSignup, setIsSignup] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(""); // clear any previous errors

        try {
            if (isSignup) {
                // ──── SIGNUP FLOW ────
                // Step 1: Create user account on server
                //   Server hashes password with bcrypt and stores it
                await signupUser(email, masterPassword);

                // Step 2: After signup, auto-login to get the JWT token
                //   (Server doesn't return token on signup, so we login immediately)
                await loginUser(email, masterPassword);
            } else {
                // ──── LOGIN FLOW ────
                // Step 1: Send credentials to server for verification
                //   Server checks email exists + password matches bcrypt hash
                //   If valid → returns JWT token (stored in localStorage by loginUser)
                await loginUser(email, masterPassword);
            }

            // Step 2: Derive the encryption key from master password
            //
            // "salt" is used to make the encryption key unique per user.
            // We use the email as salt because:
            //   - It's unique per user (no two users have same email)
            //   - It's deterministic (same email always produces same key)
            //   - It doesn't need to be secret (salt ≠ password)
            //
            // Previously named "saltFromServer" which was misleading —
            // the salt is NOT fetched from the server, it's just the email
            // the user typed in the form.
            const salt = email;
            const key = await deriveKey(masterPassword, salt);

            // Step 3: Pass the encryption key up to App.jsx
            //   App.jsx stores it in state → switches from Login to Vault view
            //   This key stays in memory only (never stored on disk or sent to server)
            onKeyDerived(key);

            // Step 4: Wipe password from component state (security best practice)
            //   The derived key is already saved in App.jsx's state
            //   We don't need the raw password anymore
            setMasterPassword("");
        } catch (err) {
            // Show the actual error from the server (e.g. "Invalid credentials")
            // err.message comes from the throw in authApi.js
            setError(err.message);
        } finally {
            // Stop the loading spinner regardless of success or failure
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900/75 p-8 text-slate-100 shadow-2xl backdrop-blur">
            {onBack && (
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-4 text-base text-slate-300 hover:text-slate-100 hover:underline hover:cursor-pointer"
                >
                    ← Back to Home
                </button>
            )}
            <h1 className="mb-2 text-3xl font-semibold text-slate-50">
                {isSignup ? "Create Account" : "Unlock Vault"}
            </h1>
            <p className="mb-6 text-lg text-slate-300">
                {isSignup
                    ? "Sign up with a master password to secure your vault"
                    : "Enter your master password to decrypt your vault"}
            </p>

            {/* Show error message if login/signup failed */}
            {error && (
                <div className="mb-4 rounded-md border border-red-500/40 bg-red-950/70 p-3 text-base text-red-200">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="email"
                    placeholder="Email"
                    className="w-full rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-base text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Master Password"
                    className="w-full rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-base text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-md bg-blue-600 py-2 text-lg font-medium text-white transition hover:cursor-pointer hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading
                        ? "Please wait..."
                        : isSignup
                            ? "Create Account"
                            : "Unlock Vault"}
                </button>
            </form>

            {/* Toggle between Login ↔ Signup */}
            <p className="mt-4 text-center text-base text-slate-300">
                {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                    type="button"
                    onClick={() => {
                        setIsSignup(!isSignup);
                        setError(""); // clear errors when switching modes
                    }}
                    className="text-blue-400 hover:underline hover:cursor-pointer"
                >
                    {isSignup ? "Login" : "Sign Up"}
                </button>
            </p>
        </div>
    );
}

export default Login;
