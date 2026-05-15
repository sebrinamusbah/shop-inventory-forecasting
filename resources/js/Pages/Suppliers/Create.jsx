import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';

export default function Create({ auth }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        tin_number: '',
        account_number: '',
        address: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('suppliers.store'));
    };

    // Helper to filter out non-numeric characters (allows + for phone)
    const handleNumericChange = (field, value, allowPlus = false) => {
        const regex = allowPlus ? /[^0-9+]/g : /[^0-9]/g;
        const cleanedValue = value.replace(regex, '');
        setData(field, cleanedValue);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Add New Supplier
                    </h2>
                </div>
            }
        >
            <Head title="Add Supplier" />

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

                            {/* Phone Field - Allows numbers and + */}
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-black mb-2">Phone Number</label>
                                <input
                                    type="text"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={data.phone}
                                    onChange={e => handleNumericChange('phone', e.target.value, true)}
                                    placeholder="e.g. +251..."
                                />
                                {errors.phone && <div className="text-red-500 text-xs mt-1">{errors.phone}</div>}
                            </div>

                            {/* TIN Number Field - Numbers only */}
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-black mb-2">TIN Number</label>
                                <input
                                    type="text"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={data.tin_number}
                                    onChange={e => handleNumericChange('tin_number', e.target.value)}
                                    placeholder="e.g. 0101..."
                                />
                                {errors.tin_number && <div className="text-red-500 text-xs mt-1">{errors.tin_number}</div>}
                            </div>

                            {/* Account Number Field - Numbers only */}
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-black mb-2">Account Number</label>
                                <input
                                    type="text"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={data.account_number}
                                    onChange={e => handleNumericChange('account_number', e.target.value)}
                                    placeholder="e.g. 1000..."
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
                                    {processing ? 'Saving...' : 'Save Supplier'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}