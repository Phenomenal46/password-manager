const PBKDF2_ITERATIONS = 100000;

function normalizeSalt(salt) {
    if (salt instanceof Uint8Array) {
        return salt;
    }
    const encoder = new TextEncoder();
    return encoder.encode(String(salt));
}

function toBase64(bytes) {
    let binary = "";
    bytes.forEach((b) => {
        binary += String.fromCharCode(b);
    });
    return btoa(binary);
}

export async function deriveKey(masterPassword, salt) {
    const encoder = new TextEncoder();

    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(masterPassword),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    // Derive a non-extractable AES key from the master password.
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: normalizeSalt(salt),
            iterations: PBKDF2_ITERATIONS,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}


export async function encryptData(data, key) {
    const encoder = new TextEncoder();
    // 96-bit IV is the recommended size for AES-GCM.
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(JSON.stringify(data))
    );

    return {
        // Base64 keeps the payload safe for JSON transport.
        encryptedData: toBase64(new Uint8Array(encrypted)),
        iv: toBase64(iv),
    };
}

export async function decryptData(encryptedData, iv, key) {
    const encryptedBytes = Uint8Array.from(
        atob(encryptedData),
        (c) => c.charCodeAt(0)
    );

    const ivBytes = Uint8Array.from(
        atob(iv),
        (c) => c.charCodeAt(0)
    );

    const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivBytes },
        key,
        encryptedBytes
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
}
