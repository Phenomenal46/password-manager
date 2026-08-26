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
 * Fetch a page of encrypted vault items for the logged-in user
 * Server returns { items: [{encryptedData, iv}, ...], nextCursor }
 * - cursor: the _id of the last item from the previous page (omit/undefined for the first page)
 * - limit: how many items to fetch in this page (optional, server defaults if not passed)
 * Client then decrypts each item using the master password
 */
export async function fetchVault(cursor, limit) {
    // Build query string only with params that are actually provided
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (limit) params.set("limit", limit);
    const queryString = params.toString();

    // GET from /api/vault (URL must match server route)
    const res = await fetch(`${API}/api/vault${queryString ? `?${queryString}` : ""}`, {
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

    // Returns { items, nextCursor } — caller uses nextCursor for the next page
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
