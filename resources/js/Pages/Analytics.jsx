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

    // =================================
    // PIE DATA
    // =================================
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
    // =================================
    // DEMAND VS STOCK DATA
    // =================================
    const predictionData = useMemo(() => {
        if (!Array.isArray(predictions)) return [];

        return predictions.map((p) => ({
            name: p.product_name,
            demand: p.predicted_demand || 0,
            stock: p.current_quantity || 0,
        }));
    }, [predictions]);

    // =================================
    // TOOLTIP
    // =================================
    const PredictionTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null;

        const data = payload[0].payload;

        return (
            <div className="bg-white shadow border p-3 rounded">
                <p>
                    <b>Product:</b> {data?.product_name}
                </p>
                <p>
                    <b>Predicted:</b> {data?.predicted_demand}
                </p>
                <p>
                    <b>Confidence:</b> {data?.confidence_score}%
                </p>
            </div>
        );
    };

    // selected alert details
    const selectedAlerts = useMemo(() => {
        if (!selectedAlertType) return [];
        return alerts.filter((a) => a?.alert_type === selectedAlertType);
    }, [selectedAlertType, alerts]);

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* ================================= */}
                {/* PAGE HEADER */}
                {/* ================================= */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">
                        AI Analytics Dashboard
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Inventory forecasting, risk analysis, and AI insights
                    </p>
                </div>

                {/* ================================= */}
                {/* KPI CARDS */}
                {/* ================================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
                    <div className="bg-white rounded-2xl shadow-sm border p-4">
                        <p className="text-sm text-gray-500">
                            Products Analyzed
                        </p>

                        <h2 className="text-4xl font-bold mt-2 text-gray-900">
                            {predictions.length}
                        </h2>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border p-4">
                        <p className="text-sm text-gray-500">Critical Alerts</p>

                        <h2 className="text-4xl font-bold mt-2 text-red-500">
                            {alerts.filter((a) => a.priority === "HIGH").length}
                        </h2>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border p-3">
                        <p className="text-sm text-gray-500">
                            Avg AI Confidence
                        </p>
                        <h2 className="text-4xl font-bold mt-2 text-blue-500">
                            {predictions.length > 0
                                ? (
                                      (predictions.reduce(
                                          (acc, p) =>
                                              acc +
                                              Number(p.confidence_score || 0),
                                          0,
                                      ) /
                                          predictions.length) *
                                      100
                                  ).toFixed(0)
                                : 0}
                            %
                        </h2>
                    </div>
                </div>

                {/* ================================= */}
                {/* AI PREDICTION CHART */}
                {/* ================================= */}
                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-10">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Demand Forecast
                            </h2>

                            <p className="text-gray-500 text-sm">
                                AI predicted product demand
                            </p>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={predictions}>
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis dataKey="product_name" />

                            <YAxis />

                            <Tooltip content={<PredictionTooltip />} />

                            <Legend />

                            <Line
                                type="monotone"
                                dataKey="predicted_demand"
                                stroke="#2563eb"
                                strokeWidth={3}
                                dot={{ r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* ================================= */}
                {/* CHART GRID */}
                {/* ================================= */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
                    {/* DEMAND VS STOCK */}
                    <div className="bg-white rounded-2xl shadow-sm border p-6">
                        <h2 className="text-2xl font-bold mb-1">
                            Demand vs Stock
                        </h2>

                        <p className="text-gray-500 text-sm mb-6">
                            Compare inventory levels against forecasted demand
                        </p>

                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={predictionData}>
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

                    {/* ALERT DISTRIBUTION */}
                    <div className="bg-white rounded-2xl shadow-sm border p-6">
                        <h2 className="text-2xl font-bold mb-1">
                            Alert Distribution
                        </h2>

                        <p className="text-gray-500 text-sm mb-6">
                            AI-generated inventory alert categories
                        </p>

                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={alertPieData}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={110}
                                    innerRadius={60}
                                    label
                                >
                                    {alertPieData.map((entry, index) => (
                                        <Cell
                                            key={index}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>

                                <Tooltip />

                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ================================= */}
                {/* RECOMMENDED ACTIONS */}
                {/* ================================= */}
                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-10">
                    <h2 className="text-2xl font-bold mb-6">
                        Recommended Actions
                    </h2>

                    <div className="space-y-4">
                        {predictions.slice(0, 6).map((p, index) => (
                            <div
                                key={index}
                                className="border rounded-xl p-4 hover:bg-gray-50 transition"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-lg">
                                            {p.product_name}
                                        </h3>

                                        <p className="text-sm text-gray-500 mt-1">
                                            Forecast: {p.forecast_start} →{" "}
                                            {p.forecast_end}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2 min-w-[250px]">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">
                                                Risk Score
                                            </span>

                                            <span className="font-semibold">
                                                {(p.risk_score * 100).toFixed(
                                                    0,
                                                )}
                                                %
                                            </span>
                                        </div>

                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className={`h-3 rounded-full ${
                                                    p.risk_score > 0.7
                                                        ? "bg-red-500"
                                                        : p.risk_score > 0.4
                                                          ? "bg-yellow-500"
                                                          : "bg-green-500"
                                                }`}
                                                style={{
                                                    width: `${
                                                        p.risk_score * 100
                                                    }%`,
                                                }}
                                            />
                                        </div>

                                        <span className="inline-block text-center bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-semibold">
                                            {p.recommended_action}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ================================= */}
                {/* AI ALERTS */}
                {/* ================================= */}
                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-10">
                    <h2 className="text-2xl font-bold mb-6">AI Alerts</h2>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* PIE */}
                        <div className="flex justify-center">
                            <PieChart width={400} height={320}>
                                <Pie
                                    data={alertPieData}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={120}
                                    innerRadius={70}
                                    onClick={(data) =>
                                        setSelectedAlertType(data?.name)
                                    }
                                >
                                    {alertPieData.map((entry, index) => (
                                        <Cell
                                            key={index}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>

                                <Tooltip />

                                <Legend />
                            </PieChart>
                        </div>

                        {/* DETAILS */}
                        <div className="bg-gray-50 rounded-2xl border p-5 max-h-[350px] overflow-y-auto">
                            {!selectedAlertType ? (
                                <div className="flex items-center justify-center h-full text-center text-gray-500">
                                    Click an alert category to view details
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-xl font-bold mb-4">
                                        {selectedAlertType} Alerts
                                    </h3>

                                    <div className="space-y-4">
                                        {selectedAlerts.map((item, i) => (
                                            <div
                                                key={i}
                                                className="bg-white rounded-xl border p-4"
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="font-bold">
                                                        {item.product_name}
                                                    </h4>

                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                            item.priority ===
                                                            "HIGH"
                                                                ? "bg-red-100 text-red-600"
                                                                : "bg-yellow-100 text-yellow-700"
                                                        }`}
                                                    >
                                                        {item.priority}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-gray-600">
                                                    {item.alert_message}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ================================= */}
                {/* AI INSIGHTS TABLE */}
                {/* ================================= */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">AI Insights</h2>

                            <p className="text-gray-500 text-sm">
                                AI-generated inventory recommendations
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-100 text-left">
                                    <th className="p-4 font-semibold">
                                        Product
                                    </th>

                                    <th className="p-4 font-semibold">Type</th>

                                    <th className="p-4 font-semibold">
                                        Severity
                                    </th>

                                    <th className="p-4 font-semibold">
                                        Message
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {insights.length > 0 ? (
                                    insights.map((i) => (
                                        <tr
                                            key={i.id}
                                            className="border-b hover:bg-gray-50"
                                        >
                                            <td className="p-4 font-medium">
                                                {i.product_name}
                                            </td>

                                            <td className="p-4">
                                                {i.insight_type}
                                            </td>

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
                                                    {i.severity}
                                                </span>
                                            </td>

                                            <td className="p-4 text-gray-600">
                                                {i.message}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="text-center p-8 text-gray-500"
                                        >
                                            No AI insights available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ===============================
   LAYOUT WRAPPER
   =============================== */
Analytics.layout = (page) => <AuthenticatedLayout>{page}</AuthenticatedLayout>;
