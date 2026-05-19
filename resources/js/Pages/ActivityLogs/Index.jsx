import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

function methodStyles(method) {
    switch ((method || "").toUpperCase()) {
        case "GET":
            return "bg-sky-100 text-sky-700";
        case "POST":
            return "bg-amber-100 text-amber-700";
        case "PUT":
        case "PATCH":
            return "bg-violet-100 text-violet-700";
        case "DELETE":
            return "bg-rose-100 text-rose-700";
        default:
            return "bg-slate-100 text-slate-700";
    }
}

function toTimeLabel(createdAt, timeAgo) {
    return timeAgo || createdAt || "-";
}

export default function ActivityLogsIndex({ activities }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const rows = activities?.data || [];
    const totalEvents = useMemo(() => activities?.total ?? 0, [activities]);

    const handleClear = () => {
        setMenuOpen(false);

        if (confirm("Clear all activity log entries?")) {
            router.delete(route("activity-logs.destroy"), {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Activity Log" />

            <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1500px] rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-semibold text-slate-900">Activity Log</h1>
                            <span className="rounded bg-slate-700 px-2 py-0.5 text-[11px] font-medium text-white">
                                {totalEvents} Events
                            </span>
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setMenuOpen((open) => !open)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-100"
                                aria-label="Open activity log actions"
                            >
                                ⋮
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                    >
                                        <span>🗑</span>
                                        Clear Activity Log
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => router.reload({ preserveScroll: true })}
                                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                    >
                                        <span>↻</span>
                                        Refresh
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Id</th>
                                    <th className="px-4 py-3 text-left font-medium">Time</th>
                                    <th className="px-4 py-3 text-left font-medium">Description</th>
                                    <th className="px-4 py-3 text-left font-medium">User</th>
                                    <th className="px-4 py-3 text-left font-medium">Method</th>
                                    <th className="px-4 py-3 text-left font-medium">Route</th>
                                    <th className="px-4 py-3 text-left font-medium">Ip Address</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-200">
                                {rows.length > 0 ? (
                                    rows.map((activity) => (
                                        <tr key={activity.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-slate-600">{activity.id}</td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {toTimeLabel(activity.created_at, activity.time_ago)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">
                                                {activity.description}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">
                                                    {activity.user_name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${methodStyles(activity.method)}`}>
                                                    {activity.method}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {activity.route}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {activity.ip_address}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="px-4 py-12 text-center text-slate-500" colSpan={7}>
                                            No activity log entries yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {activities?.links?.map((link, index) => (
                                <a
                                    key={`${link.label}-${index}`}
                                    href={link.url || "#"}
                                    className={`min-w-9 rounded border px-3 py-2 text-center text-sm ${
                                        link.active
                                            ? "border-blue-500 bg-blue-600 text-white"
                                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                    } ${!link.url ? "pointer-events-none opacity-50" : ""}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>

                        <p className="text-center text-sm text-slate-600">
                            Showing {activities?.from ?? 0} - {activities?.to ?? 0} of {totalEvents} results ({activities?.per_page ?? 25} per page)
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

ActivityLogsIndex.layout = (page) => <AuthenticatedLayout>{page}</AuthenticatedLayout>;
