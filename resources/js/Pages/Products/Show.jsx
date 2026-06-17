import { Link } from "@inertiajs/react";
import { useState } from "react";

export default function Show({ product, purchases = [], created_by = null }) {
    const [invoiceSearch, setInvoiceSearch] = useState("");

    const filteredPurchases = purchases.filter((p) => {
        if (!invoiceSearch) return true;
        return p.invoice_no
            ?.toString()
            .toLowerCase()
            .includes(invoiceSearch.toLowerCase());
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Product #{product.id}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Product details and information
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href={route("products.index")}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            ← Back to Products
                        </Link>
                    </div>
                </div>

                {/* Product Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Product Information
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">
                                    Product Name
                                </label>
                                <p className="mt-1 text-lg font-medium text-gray-900">
                                    {product.name}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">
                                    SKU
                                </label>
                                <p className="mt-1 text-lg font-medium text-gray-900">
                                    {product.sku}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">
                                    Category
                                </label>
                                <p className="mt-1 text-lg font-medium text-gray-900">
                                    {product.category?.name || "Uncategorized"}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">
                                    Current Stock
                                </label>
                                <p
                                    className={`mt-1 text-2xl font-bold ${
                                        product.current_quantity <=
                                        product.min_stock_level
                                            ? "text-red-600"
                                            : "text-green-600"
                                    }`}
                                >
                                    {product.current_quantity}{" "}
                                    {product.unit?.symbol || ""}
                                </p>
                                {product.current_quantity <=
                                    product.min_stock_level && (
                                    <p className="text-sm text-red-600 mt-1">
                                        ⚠️ Low stock alert
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">
                                    Min Stock Level
                                </label>
                                <p className="mt-1 text-lg font-medium text-gray-900">
                                    {product.min_stock_level} units
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">
                                    Tax Rate
                                </label>
                                <p className="mt-1 text-lg font-medium text-gray-900">
                                    {product.tax_rate || 0}%
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">
                                    Added By
                                </label>
                                {created_by ? (
                                    <p className="mt-1 text-lg font-medium text-gray-900">
                                        {created_by.name}{" "}
                                        <span className="text-sm text-gray-500">
                                            ({created_by.role || "user"})
                                        </span>
                                    </p>
                                ) : (
                                    <p className="mt-1 text-sm text-gray-500">
                                        Unknown
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Purchases / Supplier History */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Purchase History
                        </h2>
                    </div>
                    <div className="p-4">
                        <input
                            type="text"
                            placeholder="Search by invoice number..."
                            value={invoiceSearch}
                            onChange={(e) => setInvoiceSearch(e.target.value)}
                            className="w-full border rounded-lg p-2 mb-3"
                        />
                    </div>
                    <div className="p-6">
                        {filteredPurchases.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                No purchases found for this product.
                            </p>
                        ) : (
                            <div
                                className={
                                    filteredPurchases.length > 4
                                        ? "space-y-4 max-h-64 overflow-y-auto pr-2"
                                        : "space-y-4"
                                }
                            >
                                {filteredPurchases.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-between border rounded p-3"
                                    >
                                        <div>
                                            <div className="text-sm text-gray-500">
                                                Invoice: {p.invoice_no}
                                            </div>
                                            <div className="font-medium">
                                                Supplier:{" "}
                                                {p.supplier?.name || "—"}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Date: {p.purchase_date}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm">
                                                Qty: {p.quantity}
                                            </div>
                                            <div className="text-sm">
                                                Unit Cost: Br{" "}
                                                {parseFloat(
                                                    p.unit_cost,
                                                ).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Pricing Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Pricing Information
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">
                                    Buy Price
                                </label>
                                <p className="mt-1 text-2xl font-bold text-blue-600">
                                    Br{" "}
                                    {parseFloat(product.unit_buy_price).toFixed(
                                        2,
                                    )}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">
                                    Sell Price
                                </label>
                                <p className="mt-1 text-2xl font-bold text-green-600">
                                    Br{" "}
                                    {parseFloat(
                                        product.unit_sell_price,
                                    ).toFixed(2)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">
                                    Profit Margin
                                </label>
                                <p className="mt-1 text-2xl font-bold text-purple-600">
                                    {(
                                        ((product.unit_sell_price -
                                            product.unit_buy_price) /
                                            product.unit_buy_price) *
                                        100
                                    ).toFixed(1)}
                                    %
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
