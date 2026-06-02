import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function Forbidden() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <Head title="403 - Unauthorized Access" />

            <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                {/* Friendly Warning Icon */}
                <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center text-3xl mb-4">
                    ⚠️
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Access Denied
                </h1>
                
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                    Oops! It looks like you don't have permission to access this page. If you think this is a mistake, please reach out to your administrator.
                </p>

                {/* The "Go to Dashboard" Rescue Button */}
                <Link
                    href={route('dashboard')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md shadow-blue-100 text-center active:scale-95"
                >
                    🏠 Go Back to Dashboard
                </Link>
            </div>
        </div>
    );
}