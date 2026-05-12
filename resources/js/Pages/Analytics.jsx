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
    Legend
} from "recharts";

export default function Analytics({
    predictions = [],
    insights = [],
    alerts = []
}) {

    const [selectedAlertType, setSelectedAlertType] = useState(null);

    // =================================
    // PIE DATA
    // =================================
    const alertPieData = useMemo(() => {
        if (!Array.isArray(alerts)) return [];

        const map = {};

        alerts.forEach(a => {
            const type = a?.alert_type || "UNKNOWN";
            map[type] = (map[type] || 0) + 1;
        });

        return Object.keys(map).map(key => ({
            name: key,
            value: map[key]
        }));
    }, [alerts]);

    const COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6"];

    // =================================
    // TOOLTIP
    // =================================
    const PredictionTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null;

        const data = payload[0].payload;

        return (
            <div className="bg-white shadow border p-3 rounded">
                <p><b>Product:</b> {data?.product_name}</p>
                <p><b>Predicted:</b> {data?.predicted_demand}</p>
                <p><b>Confidence:</b> {data?.confidence_score}%</p>
            </div>
        );
    };

    // selected alert details
    const selectedAlerts = useMemo(() => {
        if (!selectedAlertType) return [];
        return alerts.filter(a => a?.alert_type === selectedAlertType);
    }, [selectedAlertType, alerts]);

    return (
        <div className="max-w-7xl mx-auto py-8 px-6">

            {/* =============================== */}
            {/* TITLE */}
            {/* =============================== */}
            <h1 className="text-4xl font-bold mb-8">
                AI Analytics
            </h1>

            {/* =============================== */}
            {/* AI PREDICTIONS */}
            {/* =============================== */}
            <div className="bg-white rounded-lg shadow p-6 mb-10">

                <h2 className="text-2xl font-semibold mb-4">
                    AI Predictions
                </h2>

                <LineChart width={900} height={300} data={predictions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product_name" />
                    <YAxis />
                    <Tooltip content={<PredictionTooltip />} />
                    <Legend />

                    <Line
                        type="monotone"
                        dataKey="predicted_demand"
                        stroke="#3b82f6"
                        strokeWidth={3}
                    />
                </LineChart>

            </div>

            {/* =============================== */}
            {/* AI ALERTS PIE + SIDE PANEL */}
            {/* =============================== */}
            <div className="bg-white rounded-lg shadow p-6 mb-10">

                <h2 className="text-2xl font-semibold mb-6">
                    AI Alerts
                </h2>

                <div className="flex gap-10 items-center">

                    {/* PIE CHART */}
                    <PieChart width={450} height={320}>

                        <Pie
                            data={alertPieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={130}
                            innerRadius={70}
                            stroke="#fff"
                            strokeWidth={2}

                            onClick={(data) => {
                                setSelectedAlertType(data?.name);
                            }}
                        >

                            {alertPieData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}

                        </Pie>

                        <Tooltip />
                        <Legend />

                    </PieChart>

                    {/* SIDE PANEL */}
                    <div className="w-[360px] bg-gray-50 border rounded p-4 max-h-[320px] overflow-y-auto">

                        {!selectedAlertType ? (
                            <div className="text-center py-10">
                                <p className="text-gray-600 font-bold text-base mb-2">
                                    👈 Click a slice to view alert information
                                </p>
                                <p className="text-gray-400 text-sm">
                                    Select a category from the pie chart to see AI-generated alerts
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-lg">
                                        {selectedAlertType} Alerts
                                    </h3>

                
                                   
                                </div>

                                {selectedAlerts.slice(0, 5).map((item, i) => (
                                    <div key={i} className="border-b py-2 text-sm">

                                        <p><b>Product:</b> {item?.product_name}</p>
                                        <p><b>Priority:</b> {item?.priority}</p>
                                        <p><b>Message:</b> {item?.alert_message}</p>

                                    </div>
                                ))}

                                {selectedAlerts.length > 5 && (
                                    <p className="mt-2 text-blue-600 text-sm font-semibold">
                                        + {selectedAlerts.length - 5} more
                                    </p>
                                )}
                            </>
                        )}

                    </div>

                </div>

            </div>

            {/* =============================== */}
            {/* AI INSIGHTS TABLE */}
            {/* =============================== */}
            <div className="bg-white rounded-lg shadow p-6">

                <h2 className="text-2xl font-semibold mb-4">
                    AI Insights
                </h2>

                <table className="w-full border">

                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border p-3">Product</th>
                            <th className="border p-3">Type</th>
                            <th className="border p-3">Severity</th>
                            <th className="border p-3">Message</th>
                        </tr>
                    </thead>

                    <tbody>

                        {Array.isArray(insights) && insights.length > 0 ? (
                            insights.map((i) => (
                                <tr key={i.id}>
                                    <td className="border p-3">{i?.product_name}</td>
                                    <td className="border p-3">{i?.insight_type}</td>
                                    <td className="border p-3">{i?.severity}</td>
                                    <td className="border p-3">{i?.message}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center p-4">
                                    No insight data available
                                </td>
                            </tr>
                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}

/* ===============================
   LAYOUT WRAPPER
   =============================== */
Analytics.layout = page => (
    <AuthenticatedLayout>
        {page}
    </AuthenticatedLayout>
);