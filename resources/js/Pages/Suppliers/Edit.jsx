import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';

export default function Edit({ auth, supplier }) {
    // Pre-fill the form with the existing supplier data
    const { data, setData, put, processing, errors } = useForm({
        name: supplier.name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        tin_number: supplier.tin_number || '',
        account_number: supplier.account_number || '',
        address: supplier.address || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('suppliers.update', supplier.id));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Edit Supplier: {supplier.name}</h2>}
        >
            <Head title="Edit Supplier" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <form onSubmit={submit}>
                            {/* Name Field */}
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-black mb-2">Supplier Name *</label>
                                <input
                                    type="text"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                            </div>

                            {/* Email Field */}
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-black mb-2">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                />
                                {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                            </div>

                            {/* Phone Field */}
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-black mb-2">Phone Number</label>
                                <input
                                    type="text"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={data.phone}
                                    onChange={e => setData('phone', e.target.value)}
                                />
                                {errors.phone && <div className="text-red-500 text-xs mt-1">{errors.phone}</div>}
                            </div>

                            {/* tin_number Field */}
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-black mb-2">TIN Number</label>
                                <input
                                    type="text"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={data.tin_number}
                                    onChange={e => setData('tin_number', e.target.value)}
                                />
                                {errors.tin_number && <div className="text-red-500 text-xs mt-1">{errors.tin_number}</div>}
                            </div>

                            {/* account_number Field */}
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-black mb-2">Account Number</label>
                                <input
                                    type="text"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={data.account_number}
                                    onChange={e => setData('account_number', e.target.value)}
                                />
                                {errors.account_number && <div className="text-red-500 text-xs mt-1">{errors.account_number}</div>}
                            </div>

                            {/* Address Field */}
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-black mb-2">Office/Shop Address</label>
                                <textarea
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    rows="3"
                                    value={data.address}
                                    onChange={e => setData('address', e.target.value)}
                                ></textarea>
                                {errors.address && <div className="text-red-500 text-xs mt-1">{errors.address}</div>}
                            </div>

                            <div className="flex items-center justify-between border-t pt-4">
                                <Link href={route('suppliers.index')} className="text-sm text-gray-600 hover:underline">
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md shadow transition disabled:opacity-50"
                                >
                                    {processing ? 'Updating...' : 'Update Supplier'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
