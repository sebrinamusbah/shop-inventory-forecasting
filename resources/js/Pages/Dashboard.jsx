import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import { useMemo } from "react";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
    const { totalProducts, lowStockCount, todaySales, lowStockProducts } =
        usePage().props;

    // =========================
    // SALES DATA
    // =========================
    const salesData = useMemo(() => {
        return [
            {
                name: "Today",
                sales: Number(todaySales || 0),
            },
        ];
    }, [todaySales]);

    return (
        <div className="min-h-screen bg-gray-50 p-6 space-y-8">
            {/* =========================
                HEADER
            ========================= */}
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Inventory Dashboard
                </h1>
                <p className="text-gray-500">
                    Real-time insights into sales and stock performance
                </p>
            </div>

            {/* =========================
                KPI GRID
            ========================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* CARD 1 */}
                <div className="bg-white rounded-2xl border shadow-sm p-6 hover:shadow-md transition">
                    <p className="text-sm text-gray-500">Total Products</p>
                    <div className="mt-2 flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-gray-900">
                            {totalProducts ?? 0}
                        </h2>
                        <span className="text-xs text-gray-400">inventory</span>
                    </div>
                </div>

                {/* CARD 2 */}
                <div className="bg-white rounded-2xl border shadow-sm p-6 hover:shadow-md transition">
                    <p className="text-sm text-gray-500">Today's Sales</p>
                    <div className="mt-2 flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-green-600">
                            Br {Number(todaySales || 0).toLocaleString()}
                        </h2>
                        <span className="text-xs text-gray-400">revenue</span>
                    </div>
                </div>

                {/* CARD 3 */}
                <div className="bg-white rounded-2xl border shadow-sm p-6 hover:shadow-md transition">
                    <p className="text-sm text-gray-500">Low Stock Alerts</p>
                    <div className="mt-2 flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-red-500">
                            {lowStockCount ?? 0}
                        </h2>
                        <span className="text-xs text-gray-400">
                            needs attention
                        </span>
                    </div>
                </div>
            </div>

            {/* =========================
                CHART SECTION
            ========================= */}
            <div className="bg-white rounded-2xl border shadow-sm p-6">
                <div className="mb-5">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Sales Overview
                    </h2>
                    <p className="text-sm text-gray-500">
                        Daily performance tracking
                    </p>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />

                        <Line
                            type="monotone"
                            dataKey="sales"
                            stroke="#16a34a"
                            strokeWidth={3}
                            dot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* =========================
                LOW STOCK TABLE
            ========================= */}
            <div className="bg-white rounded-2xl border shadow-sm p-6">
                <div className="mb-5">
                    <h2 className="text-lg font-semibold text-red-600">
                        Low Stock Products
                    </h2>
                    <p className="text-sm text-gray-500">
                        Items that require restocking soon
                    </p>
                </div>

                {Array.isArray(lowStockProducts) &&
                lowStockProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left border-b text-gray-500">
                                    <th className="py-3">Product</th>
                                    <th className="py-3">Stock</th>
                                    <th className="py-3">Min Level</th>
                                    <th className="py-3">Category</th>
                                    <th className="py-3">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {lowStockProducts.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="border-b hover:bg-gray-50 transition"
                                    >
                                        <td className="py-3 font-medium text-gray-900">
                                            {p.name}
                                        </td>

                                        <td className="py-3 font-bold text-red-600">
                                            {p.current_quantity}
                                        </td>

                                        <td className="py-3 text-gray-600">
                                            {p.min_stock_level}
                                        </td>

                                        <td className="py-3 text-gray-600">
                                            {p.category?.name || "-"}
                                        </td>

                                        <td className="py-3">
                                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600 font-medium">
                                                LOW
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-gray-500">
                            🎉 No low stock products
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

Dashboard.layout = (page) => <AuthenticatedLayout>{page}</AuthenticatedLayout>;

export default Dashboard;
