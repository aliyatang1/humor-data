"use client";

import { useState, useEffect } from "react";
import { getUsers, updateUser, deleteUser } from "@/app/actions/admin";

interface User {
  id: string;
  email: string;
  is_superadmin: boolean;
  created_datetime_utc: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ is_superadmin?: boolean }>({});

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

  async function handleUpdate(userId: string, updates: { is_superadmin?: boolean }) {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users Management</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-2">Manage user profiles and superadmin access</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-slate-400">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">Superadmin</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">Created</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-slate-100">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    {editingId === user.id ? (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editData.is_superadmin ?? user.is_superadmin}
                          onChange={(e) =>
                            setEditData({ ...editData, is_superadmin: e.target.checked })
                          }
                          className="rounded"
                        />
                        <span className="text-gray-900 dark:text-slate-100">Superadmin</span>
                      </label>
                    ) : (
                      <span className={user.is_superadmin ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-500 dark:text-slate-400"}>
                        {user.is_superadmin ? "✓ Yes" : "✗ No"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                    {new Date(user.created_datetime_utc).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {editingId === user.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(user.id, editData)}
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-600 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(user.id);
                            setEditData({ is_superadmin: user.is_superadmin });
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
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
          <p className="text-gray-500 dark:text-slate-400">No users found</p>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-blue-700 dark:text-blue-400 text-sm">
        <p className="font-medium mb-1">Note on User Creation</p>
        <p>
          To add new users, they must first log in with Google OAuth, which automatically creates a profile in the
          system. You can then promote them to superadmin using the Edit button above if needed.
        </p>
      </div>
    </div>
  );
}
