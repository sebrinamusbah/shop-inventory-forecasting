import { Link, router, usePage } from "@inertiajs/react";

export default function Index({ sales }) {
    const { auth } = usePage().props;
    const permissions = auth?.user?.permissions || [];
    const can = (permission) => permissions.includes(permission);

    // Dynamic payment labels
    const paymentLabels = {
        cash: "💵 Cash",
        cbe: "🏦 CBE",
        other_bank: "🏦 Other Bank",
        telebirr: "📱 Tele Birr",
    };

    // Delete sale
    const deleteSale = (sale) => {
        if (
            confirm(
                `⚠️ Are you sure you want to delete Sale #${sale.id}?\n\nThis will:\n- Cancel the sale\n- Restore ${sale.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                )} items to stock\n\nThis action cannot be undone!`,
            )
        ) {
            router.delete(route("sales.destroy", sale.id), {
                preserveScroll: true,
                onSuccess: () => {
                    console.log("✅ Sale deleted successfully!");
                },
                onError: (errors) => {
                    console.error("❌ Failed to delete sale:", errors);
                    alert(
                        "Failed to delete sale: " +
                            Object.values(errors).flat().join(", "),
                    );
                },
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link>
                            <svg
                                className="w-5 h-5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </Link>

                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                Sales
                            </h1>
                            <p className="text-gray-500 text-sm">
                                Manage sales transactions
                            </p>
                        </div>
                    </div>

                    {can("create sales") && (
                        <Link
                            href={route("sales.create")}
                            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg transition-all"
                        >
                            New Sale
                        </Link>
                    )}
                </div>

                {/* Summary */}
                {sales?.data?.length > 0 && (
                    <div className="mb-6">
                        <p className="text-sm text-gray-600">
                            Showing{" "}
                            <span className="font-semibold">
                                {sales.data.length}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold">{sales.total}</span>{" "}
                            sales
                        </p>
                    </div>
                )}

                {/* ✅ Card Layout */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sales.data.length > 0 ? (
                            sales.data.map((sale) => (
                                <div
                                    key={sale.id}
                                    className="bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition"
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-center mb-3">
                                        <h2 className="font-bold text-gray-900">
                                            {sale.customer_name ||
                                                "Walk-in Customer"}
                                        </h2>
                                        <span className="text-xs text-gray-400">
                                            #{sale.id}
                                        </span>
                                    </div>

                                    {/* Phone */}
                                    <p className="text-sm text-gray-500 mb-2">
                                        {sale.customer_phone || "No phone"}
                                    </p>

                                    {/* Total */}
                                    <p className="text-lg font-semibold text-gray-900 mb-2">
                                        Br{" "}
                                        {parseFloat(sale.total_amount).toFixed(
                                            2,
                                        )}
                                    </p>

                                    {/* ✅ Dynamic Payment */}
                                    <p className="text-sm text-gray-700 mb-2">
                                        {paymentLabels[sale.payment_method] ||
                                            sale.payment_method}
                                    </p>

                                    {/* Status */}
                                    <span
                                        className={`inline-block px-3 py-1 text-xs rounded-full mb-3 ${
                                            sale.status === "completed"
                                                ? "bg-green-100 text-green-700"
                                                : sale.status === "cancelled"
                                                  ? "bg-red-100 text-red-700"
                                                  : "bg-yellow-100 text-yellow-700"
                                        }`}
                                    >
                                        {sale.status}
                                    </span>

                                    {/* Date */}
                                    <p className="text-xs text-gray-400 mb-4">
                                        {new Date(
                                            sale.created_at,
                                        ).toLocaleDateString()}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex justify-between items-center">
                                        <Link
                                            href={route("sales.show", sale.id)}
                                            className="text-blue-600 text-sm hover:underline"
                                        >
                                            View
                                        </Link>

                                        {(can("delete sales") ||
                                            can("manage users")) && (
                                            <button
                                                onClick={() => deleteSale(sale)}
                                                className="text-red-600 text-sm hover:underline"
                                            >
                                                cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No sales found
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                   {/* Pagination */}
{sales.last_page > 1 && (
    <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-600">
            Page{" "}
            <span className="font-medium">
                {sales.current_page}
            </span>{" "}
            of{" "}
            <span className="font-medium">
                {sales.last_page}
            </span>
        </div>

        <div className="flex gap-2">

            {/* Previous */}
            <Link
                href={sales.prev_page_url || "#"}
                className={`px-4 py-2 border rounded-lg text-sm ${
                    !sales.prev_page_url
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={(e) =>
                    !sales.prev_page_url && e.preventDefault()
                }
            >
                ← Previous
            </Link>

            {/* Next */}
            <Link
                href={sales.next_page_url || "#"}
                className={`px-4 py-2 border rounded-lg text-sm ${
                    !sales.next_page_url
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={(e) =>
                    !sales.next_page_url && e.preventDefault()
                }
            >
                Next →
            </Link>

        </div>
    </div>
)}
                            
                       
                </div>
            </div>
        </div>
    );
}
