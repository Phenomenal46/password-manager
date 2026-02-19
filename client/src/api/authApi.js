const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const TOKEN_KEY = "auth_token";

export function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Login an existing user
 *
 * What happens:
 * 1. Client sends email + password to server
 * 2. Server checks if user exists and password is correct
 * 3. If valid, server sets an httpOnly cookie (safer than localStorage)
 *
 * Why we need this:
 * - Without authentication, ANYONE could access vault data
 * - The JWT token proves "I am this user" for every future request
 */
export async function loginUser(email, password) {
    // Send credentials to server's login endpoint
    const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
            // Tell server we're sending JSON data (not form data, not plain text)
            "Content-Type": "application/json",
        },
        // Convert JS object to JSON string (fetch requires string, not object)
        body: JSON.stringify({ email, password }),
    });

    // Parse the JSON response from server
    const data = await res.json();

    // If server returned an error (status 401, 500, etc.), throw it
    // res.ok is true only when status is 200-299
    if (!res.ok) {
        throw new Error(data.message || "Login failed");
    }

    if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
    }

    return data;
}

/**
 * Signup a new user
 *
 * What happens:
 * 1. Client sends email + password to server
 * 2. Server hashes the password (bcrypt) and stores the user
 * 3. Returns success message (no token yet — user must login after signup)
 */
export async function signupUser(email, password) {
    const res = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Signup failed");
    }

    return data;
}

/**
 * Logout the current user by clearing the auth cookie
 */
export async function logoutUser() {
    const res = await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Logout failed");
    }

    localStorage.removeItem(TOKEN_KEY);

    return data;
}
