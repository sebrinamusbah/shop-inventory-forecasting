import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import { useMemo } from "react";

const IconWrapper = ({ children, className = "" }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
    >
        {children}
    </svg>
);

const PackageIcon = (props) => (
    <IconWrapper {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </IconWrapper>
);

const TrendingUpIcon = (props) => (
    <IconWrapper {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </IconWrapper>
);

const AlertTriangleIcon = (props) => (
    <IconWrapper {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" />
    </IconWrapper>
);

const CreditCardIcon = (props) => (
    <IconWrapper {...props}>
        <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h3" />
    </IconWrapper>
);

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
    const { totalProducts, lowStockCount, todaySales, lowStockProducts, creditStats } =
        usePage().props;

    const isOverdue = creditStats?.status_label === 'Overdue';
    const isToday = creditStats?.status_label === 'Due Today';
    const isUrgent = creditStats?.status_label === 'Within 3 Days';

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
            {/* HEADER */}
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Inventory Dashboard
                </h1>
                <p className="text-gray-500">
                    Real-time insights into sales and stock performance
                </p>
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* CARD 1: Total Products */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition duration-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Products</p>
                            <h2 className="text-3xl font-bold text-gray-900 mt-1">
                                {totalProducts ?? 0}
                            </h2>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <PackageIcon className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-gray-400">
                        <span className="font-medium text-blue-600 mr-1">Active</span> inventory items
                    </div>
                </div>

                {/* CARD 2: Today's Sales */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition duration-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Today's Sales</p>
                            <h2 className="text-3xl font-bold text-gray-900 mt-1">
                                Br {Number(todaySales || 0).toLocaleString()}
                            </h2>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl">
                            <TrendingUpIcon className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-gray-400">
                        <span className="font-medium text-green-600 mr-1">Revenue</span> generated today
                    </div>
                </div>

                {/* CARD 3: Low Stock Alerts */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition duration-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Low Stock Alerts</p>
                            <h2 className="text-3xl font-bold text-red-600 mt-1">
                                {lowStockCount ?? 0}
                            </h2>
                        </div>
                        <div className="p-3 bg-red-50 rounded-xl">
                            <AlertTriangleIcon className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-gray-400">
                        <span className="font-medium text-red-600 mr-1">Urgent</span> needs attention
                    </div>
                </div>

                {/* CARD 4: Supplier Credit */}
                <div className={`rounded-2xl border shadow-sm p-5 transition-all duration-300 hover:shadow-md ${
                    isOverdue ? 'bg-red-50 border-red-200' :
                    isToday ? 'bg-orange-50 border-orange-200' :
                    isUrgent ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'
                }`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className={`text-sm font-medium ${
                                isOverdue ? 'text-red-600' :
                                isToday ? 'text-orange-600' :
                                isUrgent ? 'text-amber-700' : 'text-gray-500'
                            }`}>
                                Supplier Credit
                            </p>
                            <h2 className={`text-2xl font-bold mt-1 ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                                Br {Number(creditStats?.total_amount || 0).toLocaleString()}
                            </h2>
                        </div>
                        <div className={`p-3 rounded-xl ${isOverdue ? 'bg-red-100' : isToday ? 'bg-orange-100' : 'bg-gray-100'}`}>
                            <CreditCardIcon className={`w-6 h-6 ${isOverdue ? 'text-red-600' : isToday ? 'text-orange-600' : 'text-gray-600'}`} />
                        </div>
                    </div>

                    {/* Breakdown List including Upcoming (3d) */}
                    <div className="space-y-1 border-t border-gray-200/50 pt-3">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500 uppercase font-semibold">Overdue</span>
                            <span className={`font-bold ${creditStats.overdue_amount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                Br {Number(creditStats.overdue_amount || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500 uppercase font-semibold">Due Today</span>
                            <span className={`font-bold ${creditStats.today_amount > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                Br {Number(creditStats.today_amount || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500 uppercase font-semibold">Upcoming (3d)</span>
                            <span className={`font-bold ${creditStats.upcoming_amount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                                Br {Number(creditStats.upcoming_amount || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <span className={`flex h-2 w-2 rounded-full ${
                            isOverdue ? 'bg-red-500 animate-pulse' :
                            isToday ? 'bg-orange-500' :
                            isUrgent ? 'bg-amber-500' : 'bg-green-500'
                        }`}></span>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${
                            isOverdue ? 'text-red-600' :
                            isToday ? 'text-orange-600' :
                            isUrgent ? 'text-amber-700' : 'text-gray-400'
                        }`}>
                            {isOverdue ? `${creditStats.overdue_count} OVERDUE` : creditStats.status_label}
                        </p>
                    </div>
                </div>
            </div>

            {/* CHART SECTION */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="mb-5">
                    <h2 className="text-lg font-semibold text-gray-900">Sales Overview</h2>
                    <p className="text-sm text-gray-500">Daily performance tracking</p>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Line
                            type="monotone"
                            dataKey="sales"
                            stroke="#16a34a"
                            strokeWidth={4}
                            dot={{ r: 6, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 8 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* LOW STOCK TABLE */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="mb-5 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-red-600">Low Stock Products</h2>
                        <p className="text-sm text-gray-500">Items that require restocking soon</p>
                    </div>
                    <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full">
                        {lowStockCount} Items
                    </span>
                </div>

                {Array.isArray(lowStockProducts) && lowStockProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left border-b border-gray-50 text-gray-400 uppercase text-[10px] tracking-widest">
                                    <th className="py-4">Product</th>
                                    <th className="py-4">Stock</th>
                                    <th className="py-4">Min Level</th>
                                    <th className="py-4">Category</th>
                                    <th className="py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {lowStockProducts.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition">
                                        <td className="py-4 font-medium text-gray-900">{p.name}</td>
                                        <td className="py-4 font-bold text-red-600">{p.current_quantity}</td>
                                        <td className="py-4 text-gray-600">{p.min_stock_level}</td>
                                        <td className="py-4 text-gray-500">{p.category?.name || "-"}</td>
                                        <td className="py-4 text-right">
                                            <span className="px-2 py-1 text-[10px] rounded-md bg-red-100 text-red-600 font-bold">
                                                RESTOCK
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-gray-500 italic"> Your inventory levels are currently healthy.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

Dashboard.layout = (page) => <AuthenticatedLayout children={page} />;

export default Dashboard;
