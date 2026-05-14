import React, { useMemo, useState } from "react";
import AuthenticatedLayout from "../Layouts/AuthenticatedLayout";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar,
    ResponsiveContainer,
} from "recharts";

export default function Analytics({
    predictions = [],
    insights = [],
    alerts = [],
}) {
    const [selectedAlertType, setSelectedAlertType] = useState(null);

    // ============================
    // PAGINATION STATES
    // ============================
    const [restockPage, setRestockPage] = useState(1);
    const restockPerPage = 10;

    const [insightPage, setInsightPage] = useState(1);
    const insightPerPage = 10;

    // ============================
    // TOP 10 DEMAND FORECAST
    // ============================
    const topDemandForecast = useMemo(() => {
        if (!Array.isArray(predictions)) return [];

        return [...predictions]
            .sort(
                (a, b) => (b.predicted_demand || 0) - (a.predicted_demand || 0),
            )
            .slice(0, 10);
    }, [predictions]);

    // ============================
    // DEMAND VS STOCK (ONLY OVER/UNDER)
    // ============================
    const stockFilteredData = useMemo(() => {
        if (!Array.isArray(predictions)) return [];

        return predictions
            .map((p) => {
                const demand = p.predicted_demand || 0;
                const stock = p.current_quantity || 0;

                return {
                    name: p.product_name,
                    demand,
                    stock,
                    status:
                        stock > demand
                            ? "OVERSTOCK"
                            : stock < demand
                              ? "UNDERSTOCK"
                              : "BALANCED",
                };
            })
            .filter((p) => p.status !== "BALANCED");
    }, [predictions]);

    // ============================
    // RESTOCK PRODUCTS (MERGED SECTION)
    // ============================
    const restockProducts = useMemo(() => {
        if (!Array.isArray(predictions)) return [];

        return predictions.filter((p) =>
            (p.recommended_action || "").toLowerCase().includes("restock"),
        );
    }, [predictions]);

    const paginatedRestock = useMemo(() => {
        const start = (restockPage - 1) * restockPerPage;
        return restockProducts.slice(start, start + restockPerPage);
    }, [restockProducts, restockPage]);

    // ============================
    // AI INSIGHTS PAGINATION
    // ============================
    const paginatedInsights = useMemo(() => {
        const start = (insightPage - 1) * insightPerPage;
        return insights.slice(start, start + insightPerPage);
    }, [insights, insightPage]);

    // ============================
    // ALERT PIE DATA
    // ============================
    const alertPieData = useMemo(() => {
        if (!Array.isArray(alerts)) return [];

        const map = {};
        alerts.forEach((a) => {
            const type = a?.alert_type || "UNKNOWN";
            map[type] = (map[type] || 0) + 1;
        });

        return Object.keys(map).map((key) => ({
            name: key,
            value: map[key],
        }));
    }, [alerts]);

    const COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6"];

    const selectedAlerts = useMemo(() => {
        if (!selectedAlertType) return [];
        return alerts.filter((a) => a?.alert_type === selectedAlertType);
    }, [selectedAlertType, alerts]);

    // ============================
    // TOOLTIP
    // ============================
    const PredictionTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null;

        const data = payload[0].payload;

        return (
            <div className="bg-white shadow border p-3 rounded">
                <p>
                    <b>Product:</b> {data?.name}
                </p>
                <p>
                    <b>Predicted:</b> {data?.predicted_demand}
                </p>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="max-w-7xl mx-auto py-10 px-4">
                {/* HEADER */}
                <div className="mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900">
                        AI Analytics Dashboard
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Real-time inventory intelligence & forecasting system
                    </p>
                </div>

                {/* KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                    {[
                        {
                            label: "Products",
                            value: predictions.length,
                            color: "text-blue-600",
                        },
                        {
                            label: "Alerts",
                            value: alerts.length,
                            color: "text-red-500",
                        },
                        {
                            label: "Critical Insights",
                            value: insights.filter((i) => i.severity === "high")
                                .length,
                            color: "text-purple-600",
                        },
                    ].map((kpi, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition"
                        >
                            <p className="text-gray-500 text-sm">{kpi.label}</p>
                            <h2
                                className={`text-4xl font-bold mt-2 ${kpi.color}`}
                            >
                                {kpi.value}
                            </h2>
                        </div>
                    ))}
                </div>

                {/* DEMAND FORECAST */}
                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-10 hover:shadow-md transition">
                    <div className="mb-5">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Demand Forecast (Top 10)
                        </h2>
                        <p className="text-gray-500 text-sm">
                            AI predicted demand trends
                        </p>
                    </div>

                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={topDemandForecast}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="product_name" />
                            <YAxis />
                            <Tooltip content={<PredictionTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="predicted_demand"
                                stroke="#2563eb"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* DEMAND VS STOCK */}
                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-10 hover:shadow-md transition">
                    <h2 className="text-2xl font-bold mb-2">Demand vs Stock</h2>
                    <p className="text-gray-500 text-sm mb-5">
                        Overstock and understock detection
                    </p>

                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={stockFilteredData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar
                                dataKey="demand"
                                fill="#2563eb"
                                radius={[6, 6, 0, 0]}
                            />
                            <Bar
                                dataKey="stock"
                                fill="#f59e0b"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* RESTOCK */}
                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-10 hover:shadow-md transition">
                    <h2 className="text-2xl font-bold mb-5">
                        Restock Recommendations
                    </h2>

                    <div className="space-y-3">
                        {paginatedRestock.map((p, i) => (
                            <div
                                key={i}
                                className="p-4 border rounded-xl bg-gray-50 hover:bg-white hover:shadow-sm transition"
                            >
                                <div className="flex justify-between items-center">
                                    <b className="text-gray-800">
                                        {p.product_name}
                                    </b>
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-600">
                                        RESTOCK
                                    </span>
                                </div>

                                <p className="text-sm text-gray-500 mt-1">
                                    Demand: {p.predicted_demand} | Stock:{" "}
                                    {p.current_quantity}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* pagination */}
                    <div className="flex justify-between items-center mt-6">
                        <button
                            disabled={restockPage === 1}
                            onClick={() => setRestockPage((p) => p - 1)}
                            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
                        >
                            Prev
                        </button>

                        <span className="text-sm text-gray-500">
                            Page {restockPage}
                        </span>

                        <button
                            disabled={
                                restockPage * restockPerPage >=
                                restockProducts.length
                            }
                            onClick={() => setRestockPage((p) => p + 1)}
                            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>

                {/* ALERT DISTRIBUTION */}
                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-10 hover:shadow-md transition">
                    <h2 className="text-2xl font-bold mb-6">
                        Alert Distribution & AI Alerts
                    </h2>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* PIE */}
                        <div className="flex justify-center items-center">
                            <div className="bg-gray-50 p-4 rounded-2xl border">
                                <PieChart width={380} height={320}>
                                    <Pie
                                        data={alertPieData}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={120}
                                        innerRadius={60}
                                        label
                                        onClick={(data) =>
                                            setSelectedAlertType(data?.name)
                                        }
                                        cursor="pointer"
                                    >
                                        {alertPieData.map((entry, index) => (
                                            <Cell
                                                key={index}
                                                fill={
                                                    COLORS[
                                                        index % COLORS.length
                                                    ]
                                                }
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </div>
                        </div>

                        {/* DETAILS */}
                        <div className="bg-gray-50 rounded-2xl border p-5 h-[360px] overflow-y-auto">
                            {!selectedAlertType ? (
                                <div className="flex items-center justify-center h-full text-gray-500 text-center">
                                    Click a category to view AI alerts
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-bold">
                                            {selectedAlertType} Alerts
                                        </h3>

                                        <button
                                            onClick={() =>
                                                setSelectedAlertType(null)
                                            }
                                            className="text-sm text-blue-600 hover:underline"
                                        >
                                            Reset
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {selectedAlerts.map((item, i) => (
                                            <div
                                                key={i}
                                                className="bg-white border rounded-xl p-4 hover:shadow-sm transition"
                                            >
                                                <div className="flex justify-between">
                                                    <b>{item.product_name}</b>
                                                    <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">
                                                        {item.priority}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-gray-600 mt-2">
                                                    {item.alert_message}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* AI INSIGHTS */}
                {/* AI INSIGHTS */}
                <div className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-lg transition">
                    {/* HEADER */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                AI Insights
                            </h2>
                            <p className="text-sm text-gray-500">
                                Intelligent recommendations & risk signals
                            </p>
                        </div>

                        <div className="bg-gray-100 px-3 py-1 rounded-lg text-sm text-gray-600">
                            Total: {insights.length}
                        </div>
                    </div>

                    {/* TABLE WRAPPER */}
                    <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-700">
                                <tr>
                                    <th className="p-4 text-left">Product</th>
                                    <th className="p-4 text-left">Type</th>
                                    <th className="p-4 text-left">Severity</th>
                                    <th className="p-4 text-left">Insight</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedInsights.map((i, index) => (
                                    <tr
                                        key={i.id}
                                        className={`border-b transition hover:bg-gray-50 ${
                                            index % 2 === 0
                                                ? "bg-white"
                                                : "bg-gray-50/40"
                                        }`}
                                    >
                                        {/* PRODUCT */}
                                        <td className="p-4 font-semibold text-gray-800">
                                            {i.product_name}
                                        </td>

                                        {/* TYPE */}
                                        <td className="p-4">
                                            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                                                {i.insight_type}
                                            </span>
                                        </td>

                                        {/* SEVERITY */}
                                        <td className="p-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    i.severity === "high"
                                                        ? "bg-red-100 text-red-600"
                                                        : i.severity ===
                                                            "medium"
                                                          ? "bg-yellow-100 text-yellow-700"
                                                          : "bg-green-100 text-green-700"
                                                }`}
                                            >
                                                {i.severity?.toUpperCase()}
                                            </span>
                                        </td>

                                        {/* MESSAGE */}
                                        <td className="p-4 text-gray-600 max-w-[420px]">
                                            <div className="line-clamp-2">
                                                {i.message}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="flex justify-between items-center mt-6">
                        <button
                            disabled={insightPage === 1}
                            onClick={() => setInsightPage((p) => p - 1)}
                            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition"
                        >
                            ← Previous
                        </button>

                        <div className="text-sm text-gray-500">
                            Page{" "}
                            <span className="font-semibold">{insightPage}</span>
                        </div>

                        <button
                            disabled={
                                insightPage * insightPerPage >= insights.length
                            }
                            onClick={() => setInsightPage((p) => p + 1)}
                            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

Analytics.layout = (page) => <AuthenticatedLayout>{page}</AuthenticatedLayout>;
