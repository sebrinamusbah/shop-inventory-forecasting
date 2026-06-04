import { useForm, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";

export default function Index() {
    const { categories } = usePage().props;

    const [editingId, setEditingId] = useState(null);

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        reset,
    } = useForm({
        name: "",
        description: "",
    });
    useEffect(() => {
        const saveFormData = () => {
            localStorage.setItem("form_data", JSON.stringify(data));
        };

        const interval = setInterval(saveFormData, 10000); // save every 10 sec
        return () => clearInterval(interval);
    }, [data]);

    function submit(e) {
        e.preventDefault();

        if (editingId) {
            put(`/categories/${editingId}`, {
                onSuccess: () => {
                    reset();
                    setEditingId(null);
                },
            });
        } else {
            post("/categories", {
                onSuccess: () => reset(),
            });
        }
    }

    function editCategory(category) {
        setEditingId(category.id);
        setData({
            name: category.name || "",
            description: category.description || "",
        });
    }

    function deleteCategory(id) {
        if (confirm("Are you sure you want to delete this category?")) {
            destroy(`/categories/${id}`);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Categories
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Manage your product categories
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-800">
                            {editingId ? "Edit Category" : "Add New Category"}
                        </h2>
                    </div>

                    <form onSubmit={submit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Electronics, Clothing, Books"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    placeholder="Brief description (optional)"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        reset();
                                        setEditingId(null);
                                    }}
                                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all ${
                                    editingId
                                        ? "bg-amber-600 hover:bg-amber-700"
                                        : "bg-blue-600 hover:bg-blue-700"
                                }`}
                            >
                                {editingId ? "Update Category" : "Add Category"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Categories Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800">
                                All Categories
                            </h2>
                            <span className="text-sm text-gray-500">
                                Total: {categories.data.length}
                            </span>
                        </div>
                    </div>

                    {categories.data.length === 0? (
                        <div className="text-center py-12">
                            <svg
                                className="w-16 h-16 mx-auto text-gray-300 mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                />
                            </svg>
                            <p className="text-gray-500">No categories yet</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Add your first category using the form above
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {categories.data.map((c) => (
                                        <tr
                                            key={c.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                        <svg
                                                            className="w-4 h-4 text-blue-600"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <span className="font-medium text-gray-900">
                                                        {c.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {c.description || (
                                                    <span className="text-gray-400 italic">
                                                        No description
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() =>
                                                            editCategory(c)
                                                        }
                                                        className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            deleteCategory(c.id)
                                                        }
                                                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex justify-center gap-2 p-4">
                   {categories.links.map((link, index) => (
                 <Link
                   key={index}
                   href={link.url || "#"}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                  className={`px-3 py-1 border rounded ${
                    link.active
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700"
                } ${!link.url ? "opacity-50 pointer-events-none" : ""}`}
                 />
              ))}
                </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
