import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { fetchVault, addVaultItem, deleteVaultItem, updateVaultItem } from "../api/vaultApi";
import { encryptData, decryptData } from "../crypto/crypto";

function EyeIcon({ isOpen }) {
    // Custom eye SVG icon for show/hide visibility toggle.
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
            <circle cx="12" cy="12" r="3" />
            {!isOpen && <path d="M3 3l18 18" />}
        </svg>
    );
}



function Vault({ vaultKey, onLogout }) {
    const [items, setItems] = useState([]);
    const [visibleIndex, setVisibleIndex] = useState(null);

    const [visibleNonce, setVisibleNonce] = useState(0);
    const [error, setError] = useState("");

    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Edit mode: stores the item being edited (null if not editing)
    const [editingItemId, setEditingItemId] = useState(null);
    const [formData, setFormData] = useState({ site: "", username: "", password: "" });

    const passwordInputRef = useRef(null);

    useEffect(() => {
        async function loadVault() {
            try {
                const encryptedItems = await fetchVault();

                const decryptedItems = await Promise.all(
                    encryptedItems.map(async (item) => {
                        const decrypted = await decryptData(
                            item.encryptedData,
                            item.iv,
                            vaultKey
                        );
                        return { id: item._id, ...decrypted };
                    })
                );

                setItems(decryptedItems);
                setError("");
            } catch (err) {
                setError("Unable to decrypt vault. Wrong password or server error.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        loadVault();
    }, [vaultKey]);


    useEffect(() => {
        if (visibleIndex !== null) {
            const timer = setTimeout(() => {
                setVisibleIndex(null);
            }, 5000); // 5 seconds

            return () => clearTimeout(timer);
        }
    }, [visibleIndex, visibleNonce]);




    // 🚧 Auto-lock on blur REMOVED for development.
    // The "blur" event fires when the window loses focus for ANY reason
    // (clicking address bar, switching apps, opening DevTools, etc.),
    // which logged the user out constantly — making development and
    // normal usage impossible. Re-add with a timeout or use the
    // "visibilitychange" event in production for a better experience.


    async function handleAddItem(e) {
        e.preventDefault();

        const newItem = {
            site: formData.site,
            username: formData.username,
            password: formData.password,
        };

        // try/catch wraps async code so that if anything fails
        // (network down, server error, expired token), we catch
        // the error and show it to the user instead of crashing.
        try {
            setIsSaving(true);
            // 🔐 Encrypt BEFORE sending to server
            const encrypted = await encryptData(newItem, vaultKey);
            const saved = await addVaultItem(encrypted);

            // Only update local state AFTER the server confirms success.
            // If addVaultItem threw, this line won't run — keeping
            // the UI in sync with what's actually saved on the server.
            setItems((prev) => [...prev, { ...newItem, id: saved.id }]);
            setError("");
            toast.success("Password saved");

            setShowModal(false);
            setFormData({ site: "", username: "", password: "" });
        } catch (err) {
            // Show the error in the UI instead of silently failing
            setError("Failed to add item. " + err.message);
            toast.error("Failed to add item");
        } finally {
            setIsSaving(false);
        }
    }

    // Open edit modal with item's current data pre-filled
    function handleEditItem(item) {
        setEditingItemId(item.id);
        setFormData({
            site: item.site,
            username: item.username,
            password: item.password,
        });
        setShowModal(true);
    }

    // Submit the edited item
    async function handleSaveEdit(e) {
        e.preventDefault();

        try {
            setIsSaving(true);
            // 🔐 Encrypt the updated data
            const encrypted = await encryptData(formData, vaultKey);
            await updateVaultItem(editingItemId, encrypted);

            // Update local state with new data
            setItems((prev) =>
                prev.map((item) =>
                    item.id === editingItemId
                        ? { ...item, ...formData }
                        : item
                )
            );

            setError("");
            toast.success("Password updated");

            // Close modal and reset edit state
            setShowModal(false);
            setEditingItemId(null);
            setFormData({ site: "", username: "", password: "" });
        } catch (err) {
            setError("Failed to update item. " + err.message);
            toast.error("Failed to update item");
        } finally {
            setIsSaving(false);
        }
    }

    // Close edit modal without saving
    function handleCancelEdit() {
        setShowModal(false);
        setEditingItemId(null);
        setFormData({ site: "", username: "", password: "" });
    }

    function handleToggleView(index) {
        if (visibleIndex === index) {
            setVisibleIndex(null);
            return;
        }

        // Bump nonce so the auto-hide timer restarts even for same item.
        setVisibleIndex(index);
        setVisibleNonce((prev) => prev + 1);
    }

    async function copyPassword(pwd) {
        try {
            await navigator.clipboard.writeText(pwd);
            toast.success("Password copied");
        } catch (err) {
            toast.error("Clipboard copy failed");
        }
    }

    async function handleDeleteItem(itemId) {
        if (!window.confirm("Delete this item?")) {
            return;
        }

        try {
            await deleteVaultItem(itemId);
            setItems((prev) => prev.filter((item) => item.id !== itemId));
            setError("");
            toast.success("Item deleted");
        } catch (err) {
            setError("Failed to delete item. " + err.message);
            toast.error("Failed to delete item");
        }
    }

    function generatePassword() {
        const chars =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
        let result = "";
        for (let i = 0; i < 16; i += 1) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    function handleGeneratePassword() {
        const generated = generatePassword();
        setFormData((prev) => ({ ...prev, password: generated }));
        toast.info("Generated a strong password");
    }

    return (
        /* Dark gradient background for vault page with consistent branding */
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
            <div className="fixed top-6 left-6 z-50 flex items-center gap-2 text-white text-xl font-semibold">
                <img src="/cyber_neon.svg" alt="VaultX logo" className="h-7 w-7" />
                <span>VaultX</span>
            </div>

            <div className="relative mt-16 mx-auto w-full max-w-5xl rounded-xl border border-slate-700/70 bg-slate-900/75 p-4 sm:p-8 text-slate-100 shadow-2xl backdrop-blur">
                {/* Header */}
                <div className="vault-header mb-6">
                    <h1 className="text-xl sm:text-3xl font-semibold text-slate-50">
                        Your Vault
                    </h1>

                    <div className="flex gap-2 sm:gap-3">
                        <button
                            onClick={onLogout}
                            className="text-xs sm:text-base text-slate-300 hover:underline hover:cursor-pointer"
                        >
                            Logout
                        </button>

                        <button
                            disabled={loading}
                            onClick={() => {
                                setEditingItemId(null);
                                setFormData({ site: "", username: "", password: "" });
                                setShowModal(true);
                            }}
                            className="bg-blue-600 text-white px-2 sm:px-4 py-2 text-sm sm:text-base rounded-md hover:bg-blue-700 disabled:opacity-50 hover:cursor-pointer whitespace-nowrap"
                        >
                            + Add Item
                        </button>
                    </div>
                </div>
                {error && (
                    <div className="mb-4 rounded-md border border-red-500/40 bg-red-950/70 p-3 text-base text-red-200">
                        {error}
                    </div>
                )}



                {/* Vault List */}
                {loading ? (
                    <p className="text-lg text-slate-300">Decrypting vault…</p>
                ) : items.length === 0 ? (
                    <div className="py-12 text-center text-lg text-slate-300">
                        Vault is empty
                    </div>
                ) : (
                    <ul className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-2 vault-scroll">
                        {items.map((item, i) => (
                            <li
                                key={i}
                                className="flex flex-col sm:flex-row sm:justify-between rounded-lg border border-slate-700 bg-slate-800/60 p-3 sm:p-4 hover:bg-slate-800 gap-3 sm:gap-0 sm:items-center"
                            >
                                <div className="min-w-0">
                                    <p className="text-base sm:text-lg font-medium truncate">{item.site}</p>
                                    <p className="text-sm sm:text-base text-slate-300 truncate">
                                        {item.username}
                                    </p>
                                </div>
                                {/* Icon-based action buttons for modern UX */}
                                <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                                    <span className="font-mono text-xs sm:text-base text-slate-200 order-first sm:order-0">
                                        {visibleIndex === i ? item.password : "••••••••"}
                                    </span>

                                    {/* View/Hide icon button */}
                                    <button
                                        onClick={() => handleToggleView(i)}
                                        className="rounded-lg p-1.5 sm:p-2 text-blue-300 transition hover:cursor-pointer hover:bg-blue-500/20"
                                        title={visibleIndex === i ? "Hide" : "View"}
                                    >
                                        <EyeIcon isOpen={visibleIndex === i} />
                                    </button>

                                    {/* Copy icon button */}
                                    <button
                                        onClick={() => copyPassword(item.password)}
                                        className="rounded-lg p-1.5 sm:p-2 text-slate-300 transition hover:cursor-pointer hover:bg-slate-700"
                                        title="Copy password"
                                    >
                                        <lord-icon
                                            src="https://cdn.lordicon.com/iykgtsbt.json"
                                            trigger="hover"
                                            // Bright cyan for better hover contrast.
                                            colors="primary:#ffffff,secondary:#00d9ff"
                                            className="icon-copy-sm"
                                        ></lord-icon>
                                    </button>

                                    {/* Edit icon button */}
                                    <button
                                        onClick={() => handleEditItem(item)}
                                        className="rounded-lg p-1.5 sm:p-2 text-green-300 transition hover:cursor-pointer hover:bg-green-500/20"
                                        title="Edit"
                                    >
                                        <lord-icon
                                            src="https://cdn.lordicon.com/gwlusjdu.json"
                                            trigger="hover"
                                            // Bright green for better hover contrast.
                                            colors="primary:#ffffff,secondary:#1eff5e"
                                            className="icon-edit-sm"
                                        ></lord-icon>
                                    </button>

                                    {/* Delete icon button */}
                                    <button
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="rounded-lg p-1.5 sm:p-2 text-red-300 transition hover:cursor-pointer hover:bg-red-500/20"
                                        title="Delete"
                                    >
                                        {/* Lordicon add action for modern interaction */}
                                        <lord-icon
                                            src="https://cdn.lordicon.com/skkahier.json"
                                            trigger="hover"
                                            // Bright red for better hover contrast.
                                            colors="primary:#ffffff,secondary:#ff2863"
                                            className="icon-delete-sm"
                                        ></lord-icon>
                                    </button>
                                </div>


                            </li>
                        ))}
                    </ul>
                )}

                {/* MODAL - Add or Edit */}
                {showModal && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-lg">
                            <h2 className="mb-4 text-2xl font-semibold">
                                {editingItemId ? "Edit Password" : "Add Password"}
                            </h2>

                            <form onSubmit={editingItemId ? handleSaveEdit : handleAddItem} className="space-y-4">
                                <input
                                    name="site"
                                    placeholder="Website"
                                    required
                                    value={formData.site}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, site: e.target.value }))
                                    }
                                    className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-base text-slate-100 focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    name="username"
                                    placeholder="Username"
                                    required
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, username: e.target.value }))
                                    }
                                    className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-base text-slate-100 focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="Password"
                                    required
                                    ref={passwordInputRef}
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, password: e.target.value }))
                                    }
                                    className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-base text-slate-100 focus:ring-2 focus:ring-blue-500"
                                />

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleGeneratePassword}
                                        className="text-base text-blue-400 hover:underline hover:cursor-pointer"
                                    >
                                        Generate a strong password
                                    </button>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={editingItemId ? handleCancelEdit : () => {
                                            setShowModal(false);
                                            setFormData({ site: "", username: "", password: "" });
                                        }}
                                        className="text-base text-slate-300 hover:underline hover:cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="rounded-md bg-blue-600 px-4 py-2 text-base text-white hover:cursor-pointer hover:bg-blue-700"
                                    >
                                        {isSaving ? (editingItemId ? "Updating..." : "Saving...") : (editingItemId ? "Update" : "Save")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Vault;


