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
                        
                        {/* BACK ARROW BUTTON - Consistent with Sales & Purchase */}
                      { /* <Link
                            href={route('dashboard')}
                            className="bg-black p-3 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center shadow-sm border border-black"
                        >
                            <svg 
                                className="w-5 h-5 text-white" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2.5} 
                                    d="M15 19l-7-7 7-7" 
                                />
                            </svg>
                        </Link> */}

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
                    
                    {/* Table Container */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-2xl border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {/* Updated Headers: Changed text-gray-400 to text-black */}
                                    <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-widest">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-widest">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-widest">Phone</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-widest">Address</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-black uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {suppliers.length > 0 ? (
                                    suppliers.map((supplier) => (
                                        <tr key={supplier.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {supplier.name}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                                                {supplier.email || '—'}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                                                {supplier.phone || '—'}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-400">
                                                {supplier.address || '—'}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end items-center gap-4">
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
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
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