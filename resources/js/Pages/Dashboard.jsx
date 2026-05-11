import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage, router } from "@inertiajs/react";
import { useState, useEffect, useMemo } from "react";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

const Dashboard = () => {
    const {
        totalProducts,
        lowStockCount,
        todaySales,
        aiSnapshot,
        aiPredictions,
        aiInsights,
        aiAlerts,
    } = usePage().props;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // =========================
    // RUN AI (MANUAL BUTTON)
    // =========================
    const runAI = async () => {
        if (loading) return;

        setLoading(true);

        try {
            const res = await fetch("/ai/run-all", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
            });

            const data = await res.json();

            if (!data.success) {
                console.error("AI failed:", data);
            }

            router.reload({
                only: ["aiSnapshot", "aiPredictions", "aiInsights", "aiAlerts"],
                preserveScroll: true,
            });
        } catch (err) {
            console.error(err);
        }

        setLoading(false);
    };

    // =========================
    // AUTO REFRESH
    // =========================
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ["aiSnapshot", "aiPredictions", "aiInsights", "aiAlerts"],
                preserveState: true,
                preserveScroll: true,
            });
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // =========================
    // SAFE PRIORITY HELPER
    // =========================
    const getPriority = (a) => (a?.priority || "").toLowerCase();

    // =========================
    // CHART DATA
    // =========================

    const snapshotData = useMemo(() => {
        if (!aiSnapshot) return [];
        return [
            {
                name: "Today",
                sales: aiSnapshot.total_sales || 0,
                profit: aiSnapshot.total_profit || 0,
            },
        ];
    }, [aiSnapshot]);

    const predictionData = useMemo(() => {
        return (aiPredictions || []).slice(0, 6).map((p) => ({
            name: p.product_name || "Unknown",
            demand: p.predicted_demand || 0,
            stock: p.current_quantity || 0,
        }));
    }, [aiPredictions]);

    const alertData = useMemo(() => {
        const high =
            aiAlerts?.filter((a) => getPriority(a) === "high").length || 0;

        const medium =
            aiAlerts?.filter((a) => getPriority(a) === "medium").length || 0;

        const low =
            aiAlerts?.filter((a) => getPriority(a) === "low").length || 0;

        return [
            { name: "High", value: high },
            { name: "Medium", value: medium },
            { name: "Low", value: low },
        ];
    }, [aiAlerts]);

    const COLORS = ["#ef4444", "#f59e0b", "#10b981"];

    return (
        <div className="space-y-6">
            {/* ERROR */}
            {error && (
                <div className="bg-red-100 text-red-700 p-2 rounded">
                    {error}
                </div>
            )}

            {/* RUN BUTTON */}
            <div className="flex justify-end"></div>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded shadow">
                    <p>Total Products</p>
                    <h2 className="text-2xl">{totalProducts}</h2>
                </div>

                <div className="bg-white p-5 rounded shadow">
                    <p>Today's Sales</p>
                    <h2 className="text-2xl">
                        Br {Number(todaySales || 0).toFixed(2)}
                    </h2>
                </div>

                <div className="bg-white p-5 rounded shadow">
                    <p>Low Stock</p>
                    <h2 className="text-2xl text-red-500">{lowStockCount}</h2>
                </div>
            </div>

            {/* SALES CHART */}
            <div className="bg-white p-4 rounded shadow">
                <h2 className="font-bold mb-3">Sales Overview</h2>

                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={snapshotData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="sales"
                            stroke="#3b82f6"
                        />
                        <Line
                            type="monotone"
                            dataKey="profit"
                            stroke="#10b981"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* DEMAND VS STOCK */}
            <div className="bg-white p-4 rounded shadow">
                <h2 className="font-bold mb-3">Demand vs Stock</h2>

                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={predictionData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="demand" fill="#3b82f6" />
                        <Bar dataKey="stock" fill="#f59e0b" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* ALERT CHART */}
            <div className="bg-white p-4 rounded shadow">
                <h2 className="font-bold mb-3">Alert Distribution</h2>

                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={alertData}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={100}
                        >
                            {alertData.map((entry, index) => (
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

            {/* INSIGHTS + ALERTS */}
            <div className="grid md:grid-cols-2 gap-5">
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="font-bold mb-2">AI Insights</h2>
                    {(aiInsights || []).slice(0, 5).map((i) => (
                        <div key={i.id} className="border p-2 mb-2 text-sm">
                            <b>{i.product_name}</b> - {i.message}
                        </div>
                    ))}
                </div>

                <div className="bg-white p-4 rounded shadow">
                    <h2 className="font-bold mb-2">AI Alerts</h2>
                    {(aiAlerts || []).slice(0, 5).map((a) => (
                        <div key={a.id} className="border p-2 mb-2 text-sm">
                            <b>{a.product_name}</b> ({a.priority})
                            <br />
                            {a.alert_message}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

Dashboard.layout = (page) => <AuthenticatedLayout>{page}</AuthenticatedLayout>;

export default Dashboard;
