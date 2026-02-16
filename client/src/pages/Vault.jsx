import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { fetchVault, addVaultItem, deleteVaultItem, updateVaultItem } from "../api/vaultApi";
import { encryptData, decryptData } from "../crypto/crypto";



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
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-md p-8 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Your Vault
                </h1>

                <div className="flex gap-3">
                    <button
                        onClick={onLogout}
                        className="text-sm text-gray-600 hover:underline hover:cursor-pointer"
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
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 hover:cursor-pointer"
                    >
                        + Add Item
                    </button>
                </div>
            </div>
            {error && (
                <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">
                    {error}
                </div>
            )}



            {/* Vault List */}
            {loading ? (
                <p className="text-gray-500">Decrypting vault…</p>
            ) : items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    Vault is empty
                </div>
            ) : (
                <ul className="space-y-3">
                    {items.map((item, i) => (
                        <li
                            key={i}
                            className="border rounded-lg p-4 flex justify-between hover:bg-gray-50"
                        >
                            <div>
                                <p className="font-medium">{item.site}</p>
                                <p className="text-sm text-gray-500">
                                    {item.username}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-700">
                                    {visibleIndex === i ? item.password : "••••••••"}
                                </span>

                                <button
                                    onClick={() => handleToggleView(i)}
                                    className="text-sm text-blue-600 hover:underline hover:cursor-pointer"
                                >
                                    {visibleIndex === i ? "Hide" : "View"}
                                </button>

                                <button
                                    onClick={() => copyPassword(item.password)}
                                    className="text-sm text-gray-500 hover:underline hover:cursor-pointer"
                                >
                                    Copy
                                </button>

                                <button
                                    onClick={() => handleEditItem(item)}
                                    className="text-sm text-green-600 hover:underline hover:cursor-pointer"
                                >
                                    Edit
                                </button>

                                <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="text-sm text-red-600 hover:underline hover:cursor-pointer"
                                >
                                    Delete
                                </button>
                            </div>


                        </li>
                    ))}
                </ul>
            )}

            {/* MODAL - Add or Edit */}
            {showModal && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg">
                        <h2 className="text-lg font-semibold mb-4">
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
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                name="username"
                                placeholder="Username"
                                required
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, username: e.target.value }))
                                }
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
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
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                            />

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleGeneratePassword}
                                    className="text-sm text-blue-600 hover:underline hover:cursor-pointer"
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
                                    className="text-gray-600 hover:underline hover:cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 hover:cursor-pointer"
                                >
                                    {isSaving ? (editingItemId ? "Updating..." : "Saving...") : (editingItemId ? "Update" : "Save")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Vault;


