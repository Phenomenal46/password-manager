import { useState } from "react";
import { deriveKey } from "../crypto/crypto";
import { loginUser, signupUser } from "../api/authApi";

function Login({ onKeyDerived }) {
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
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                {isSignup ? "Create Account" : "Unlock Vault"}
            </h1>
            <p className="text-sm text-gray-500 mb-6">
                {isSignup
                    ? "Sign up with a master password to secure your vault"
                    : "Enter your master password to decrypt your vault"}
            </p>

            {/* Show error message if login/signup failed */}
            {error && (
                <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="email"
                    placeholder="Email"
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Master Password"
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 hover:cursor-pointer transition disabled:opacity-50"
                >
                    {loading
                        ? "Please wait..."
                        : isSignup
                            ? "Create Account"
                            : "Unlock Vault"}
                </button>
            </form>

            {/* Toggle between Login ↔ Signup */}
            <p className="text-sm text-center text-gray-500 mt-4">
                {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                    type="button"
                    onClick={() => {
                        setIsSignup(!isSignup);
                        setError(""); // clear errors when switching modes
                    }}
                    className="text-blue-600 hover:underline hover:cursor-pointer"
                >
                    {isSignup ? "Login" : "Sign Up"}
                </button>
            </p>
        </div>
    );
}

export default Login;
