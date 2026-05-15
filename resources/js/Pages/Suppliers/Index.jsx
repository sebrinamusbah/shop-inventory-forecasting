import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ auth, suppliers }) {

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) {
            router.delete(route('suppliers.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="font-bold text-3xl text-gray-900 tracking-tight">Suppliers</h2>
                            <p className="text-sm text-gray-500 font-medium">Manage your supply partners and contact details</p>
                        </div>
                    </div>

                    <Link
                        href={route('suppliers.create')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-md transition duration-150 ease-in-out font-bold flex items-center gap-2"
                    >
                        <span className="text-xl">+</span> Add New Supplier
                    </Link>
                </div>
            }
        >
            <Head title="Suppliers" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">

                    {/* Table Container - Added overflow-x-auto for responsiveness */}
                    <div className="bg-white overflow-x-auto shadow-sm sm:rounded-2xl border border-gray-100">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-black uppercase tracking-wider w-40">Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-black uppercase tracking-wider w-56">Email</th>
                                    <th className="px-6 py-4 text-xs font-bold text-black uppercase tracking-wider w-36">Phone</th>
                                    <th className="px-6 py-4 text-xs font-bold text-black uppercase tracking-wider w-40">TIN Number</th>
                                    <th className="px-6 py-4 text-xs font-bold text-black uppercase tracking-wider w-48">Account Number</th>
                                    <th className="px-6 py-4 text-xs font-bold text-black uppercase tracking-wider">Address</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-black uppercase tracking-wider w-32">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {suppliers.length > 0 ? (
                                    suppliers.map((supplier) => (
                                        <tr key={supplier.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                                {supplier.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {supplier.email || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {supplier.phone || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {supplier.tin_number || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {supplier.account_number || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="max-w-xs truncate" title={supplier.address}>
                                                    {supplier.address || '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium">
                                                <div className="flex justify-end items-center gap-3">
                                                    <Link
                                                        href={route('suppliers.edit', supplier.id)}
                                                        className="text-blue-600 hover:text-blue-800 transition-colors font-bold"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <span className="text-gray-200">|</span>
                                                    <button
                                                        onClick={() => handleDelete(supplier.id)}
                                                        className="text-red-500 hover:text-red-700 transition-colors font-bold"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-400 italic">
                                            No suppliers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}