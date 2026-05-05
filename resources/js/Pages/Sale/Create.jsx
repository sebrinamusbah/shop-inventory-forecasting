import { useState } from "react";
import { router } from "@inertiajs/react";

export default function Create({ products, categories }) {
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [category, setCategory] = useState("all");

    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [customer, setCustomer] = useState(null);

    const filteredProducts = products.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === "all" || p.category_id == category;
        return matchesSearch && matchesCategory;
    });

    const addToCart = (product) => {
        const price = Number(product.unit_sell_price || 0);
        if (price <= 0) return;

        setCart((prev) => {
            const exist = prev.find((p) => p.id === product.id);

            if (exist) {
                return prev.map((p) =>
                    p.id === product.id ? { ...p, qty: p.qty + 1 } : p
                );
            }

            return [
                ...prev,
                {
                    id: product.id,
                    name: product.name,
                    price,
                    qty: 1,
                },
            ];
        });
    };

    const removeItem = (id) => {
        setCart((prev) => prev.filter((item) => item.id !== id));
    };

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    const submitSale = () => {
        if (cart.length === 0) return alert("Cart is empty!");
        if (!customerName.trim()) return alert("Customer name is required!");

        router.post(route("sales.store"), {
            customer_name: customerName,
            customer_phone: customerPhone || null,
            payment_method: paymentMethod,
            total_amount: total,
            items: cart.map((item) => ({
                product_id: item.id,
                quantity: item.qty,
                unit_price: item.price,
            })),
        });
    };

    const cancelOrder = () => setCart([]);

    return (
        <div className="p-4 md:p-6 bg-gray-100 min-h-screen">

            {/* TOP BAR */}
            <div className="flex justify-between items-center mb-4">

                {/* BACK + TITLE */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.visit(route("sales.index"))}
                        className="text-blue-600 text-xl font-bold"
                    >
                        ←
                    </button>

                    <h1 className="text-lg font-bold text-blue-600">
                        New Sale
                    </h1>
                </div>

                <div className="text-sm text-gray-600">
                    Cart: {cart.length} • Br {total.toFixed(2)}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                {/* PRODUCTS */}
                <div className="md:col-span-5 bg-white p-4 rounded-xl shadow">
                    <h2 className="font-bold text-blue-600 mb-3">
                        Products
                    </h2>

                    <div className="flex gap-2 mb-3">
                        <select
                            className="border p-2 rounded w-1/3"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="all">All</option>
                            {categories?.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>

                        <input
                            className="border p-2 rounded w-2/3"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {filteredProducts.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => addToCart(p)}
                                className="border p-3 rounded hover:bg-gray-100 cursor-pointer"
                            >
                                <div className="font-semibold">{p.name}</div>

                                <div className="text-sm text-gray-500">
                                    Br {p.unit_sell_price}
                                </div>

                                <div className="text-xs text-gray-400 mt-1">
                                    Stock: {p.current_quantity} left
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* BILLING */}
                <div className="md:col-span-7 bg-white p-4 rounded-xl shadow flex flex-col h-[85vh]">

                    {/* HEADER */}
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="font-bold text-blue-600">
                            Billing
                        </h2>

                        <button
                            onClick={() => setShowCustomerForm(true)}
                            className="bg-blue-600 text-white text-xs px-3 py-1 rounded"
                        >
                            + Customer
                        </button>
                    </div>

                    {/* CUSTOMER */}
                    {customer && (
                        <div className="bg-gray-100 p-3 rounded mb-3 text-center">
                            <div className="font-semibold">{customer.name}</div>
                            <div className="text-sm">{customer.phone}</div>
                            <div className="text-xs text-gray-500">
                                {customer.payment}
                            </div>
                        </div>
                    )}

                    {/* CART HEADER */}
                    <div className="grid grid-cols-12 bg-gray-100 p-2 text-sm font-semibold rounded">
                        <div className="col-span-5">Item</div>
                        <div className="col-span-2 text-center">Qty</div>
                        <div className="col-span-3 text-right">Price</div>
                        <div className="col-span-2 text-right">Del</div>
                    </div>

                    {/* CART LIST */}
                    <div className="flex-1 overflow-y-auto mt-2">

                        {cart.length === 0 ? (
                            <p className="text-gray-400 mt-4">
                                No items in cart
                            </p>
                        ) : (
                            cart.map((item) => (
                                <div
                                    key={item.id}
                                    className="grid grid-cols-12 p-2 border-b bg-gray-50"
                                >
                                    <div className="col-span-5">
                                        {item.name}
                                    </div>

                                    <div className="col-span-2 text-center">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            className="w-10 border rounded text-center"
                                            value={item.qty}
                                            onChange={(e) => {
                                                const val = e.target.value;

                                                if (val === "") {
                                                    setCart((prev) =>
                                                        prev.map((p) =>
                                                            p.id === item.id
                                                                ? { ...p, qty: "" }
                                                                : p
                                                        )
                                                    );
                                                    return;
                                                }

                                                if (!/^\d+$/.test(val)) return;

                                                setCart((prev) =>
                                                    prev.map((p) =>
                                                        p.id === item.id
                                                            ? { ...p, qty: Number(val) }
                                                            : p
                                                    )
                                                );
                                            }}
                                        />
                                    </div>

                                    <div className="col-span-3 text-right">
                                        {(item.price * item.qty).toFixed(2)}
                                    </div>

                                    <div className="col-span-2 text-right">
                                        <button
                                            className="text-red-500"
                                            onClick={() => removeItem(item.id)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* TOTAL */}
                    <div className="mt-3 border-t pt-3">
                        <div className="flex justify-between font-bold mb-2">
                            <span>Total</span>
                            <span>Br {total.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={submitSale}
                            className="w-full bg-blue-600 text-white py-2 rounded"
                        >
                            Place Order
                        </button>

                        <button
                            onClick={cancelOrder}
                            className="w-full mt-2 bg-red-500 text-white py-2 rounded"
                        >
                            Cancel
                        </button>
                    </div>

                </div>
            </div>

            {/* CUSTOMER MODAL */}
            {showCustomerForm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white w-[360px] p-5 rounded-xl shadow-lg">

                        <h2 className="font-bold mb-4 text-center">
                            Customer Info
                        </h2>

                        <input
                            className="w-full border p-2 mb-3 rounded"
                            placeholder="Name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />

                        <input
                            className="w-full border p-2 mb-3 rounded"
                            placeholder="Phone"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                        />

                        <select
                            className="w-full border p-2 mb-4 rounded"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <option value="cash">Cash</option>
                            <option value="cbe">CBE</option>
                            <option value="telebirr">Telebirr</option>
                            <option value="bank">Bank</option>
                        </select>

                        <button
                            onClick={() => {
                                setCustomer({
                                    name: customerName,
                                    phone: customerPhone,
                                    payment: paymentMethod,
                                });

                                setShowCustomerForm(false);
                            }}
                            className="w-full bg-blue-600 text-white py-2 rounded"
                        >
                            Save Customer
                        </button>

                    </div>
                </div>
            )}

        </div>
    );
}