const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
import { getAuthToken } from "./authApi";

function withAuthHeaders(baseHeaders = {}) {
    const token = getAuthToken();
    if (!token) {
        return baseHeaders;
    }

    return {
        ...baseHeaders,
        Authorization: `Bearer ${token}`,
    };
}

/**
 * Add a new encrypted password to the vault
 * Client sends: encryptedData (encrypted password object), iv (initialization vector)
 * Server stores it tied to the logged-in user via JWT token
 */
export async function addVaultItem(encryptedPayload) {
    // POST to /api/vault (URL must match server route)
    const res = await fetch(`${API}/api/vault`, {
        method: "POST",
        credentials: "include",
        headers: withAuthHeaders({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify(encryptedPayload),
    });

    // If status is not 2xx (200-299), handle error gracefully
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add vault item");
    }
    return res.json();
}

/**
 * Fetch all encrypted vault items for the logged-in user
 * Server returns array of {encryptedData, iv} objects
 * Client then decrypts each one using the master password
 */
export async function fetchVault() {
    // GET from /api/vault (URL must match server route)
    const res = await fetch(`${API}/api/vault`, {
        method: "GET",
        credentials: "include",
        headers: withAuthHeaders({
            "Content-Type": "application/json",
        }),
    });

    // If status is not 2xx (200-299), handle error gracefully
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch vault");
    }
    return res.json();
}

/**
 * Delete a vault item by id
 */
export async function deleteVaultItem(id) {
    const res = await fetch(`${API}/api/vault/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: withAuthHeaders({
            "Content-Type": "application/json",
        }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete vault item");
    }

    return res.json();
}

/**
 * Update an existing vault item
 * Client sends encrypted data and IV (server never sees plaintext)
 */
export async function updateVaultItem(id, encryptedPayload) {
    const res = await fetch(`${API}/api/vault/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: withAuthHeaders({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify(encryptedPayload),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update vault item");
    }

    return res.json();
}
