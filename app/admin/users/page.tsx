"use client";

import { useState, useEffect } from "react";
import { getUsers, updateUser, deleteUser } from "@/app/actions/admin";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_superadmin: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ full_name?: string; is_superadmin?: boolean }>({});

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(userId: string, updates: { full_name?: string; is_superadmin?: boolean }) {
    try {
      await updateUser(userId, updates);
      setEditingId(null);
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  }

  async function handleDelete(userId: string) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteUser(userId);
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600 mt-2">Manage user profiles and superadmin access</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Full Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Superadmin</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    {editingId === user.id ? (
                      <input
                        type="text"
                        value={editData.full_name || user.full_name || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            full_name: e.target.value,
                          })
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="text-gray-700">{user.full_name || "-"}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {editingId === user.id ? (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editData.is_superadmin ?? user.is_superadmin}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              is_superadmin: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <span>Superadmin</span>
                      </label>
                    ) : (
                      <span className={user.is_superadmin ? "text-green-600 font-medium" : "text-gray-500"}>
                        {user.is_superadmin ? "✓ Yes" : "✗ No"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {editingId === user.id ? (
                      <>
                        <button
                          onClick={() =>
                            handleUpdate(user.id, editData)
                          }
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(user.id);
                            setEditData({
                              full_name: user.full_name || "",
                              is_superadmin: user.is_superadmin,
                            });
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {users.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No users found</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 text-sm">
        <p className="font-medium mb-1">Note on User Creation</p>
        <p>
          To add new users, they must first log in with Google OAuth, which automatically creates a profile in the
          system. You can then promote them to superadmin using the Edit button above if needed.
        </p>
      </div>
    </div>
  );
}
