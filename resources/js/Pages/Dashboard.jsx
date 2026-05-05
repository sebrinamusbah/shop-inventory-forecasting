import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

import { usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";

const Dashboard = () => {
    const {
        products: initialProducts,
        categories,
        auth,
        totalProducts,
        lowStockCount,
        lowStockProducts,
        todaySales,
    } = usePage().props;

    return (
        <>
            {/* Stats Cards ONLY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-lg p-5">
                    <p className="text-sm text-gray-500">Total Products</p>
                    <p className="text-2xl font-semibold">{totalProducts}</p>
                </div>

                <div className="bg-white rounded-lg p-5">
                    <p className="text-sm text-gray-500">Today's Sales</p>
<p className="text-2xl font-semibold">
    Br {Number(todaySales || 0).toFixed(2)}
</p>                </div>

                <div className="bg-white rounded-lg p-5">
                    <p className="text-sm text-gray-500">Low Stock Products</p>
                    <p className="text-2xl font-semibold text-red-600">
                        {lowStockCount}
                    </p>
                </div>
            </div>
        </>
    );
};

Dashboard.layout = (page) => <AuthenticatedLayout>{page}</AuthenticatedLayout>;

export default Dashboard;
