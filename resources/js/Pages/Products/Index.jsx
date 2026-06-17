import { useForm, usePage, Link } from "@inertiajs/react";
import { useState, useEffect } from "react";

export default function Index() {
    // initialProducts comes directly from your Laravel controller
    const [priceError, setPriceError] = useState("");
    const { products: initialProducts, categories, auth } = usePage().props;
    const permissions = auth?.user?.permissions || [];
    const [search, setSearch] = useState("");
    const [editingId, setEditingId] = useState(null);

    const can = (permission) => permissions.includes(permission);

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        reset,
        processing,
    } = useForm({
        name: "",
        sku: "",
        category_id: "",
        unit_buy_price: "",
        unit_sell_price: "",
           tax_rate: "",
        current_quantity: "",
        min_stock_level: "",
    });

    // --- 1. THE TABLE STATE ---
    // We only use the data from the database now.
    // This stops "yes water" from appearing if the DB is empty.
   const [products, setProducts] = useState(initialProducts.data);

    // --- 2. SYNC WITH DATABASE ---
    // When you Add/Delete, Inertia refreshes initialProducts.
    // This effect ensures your table updates instantly.
  useEffect(() => {
    setProducts(initialProducts.data);
}, [initialProducts]);

    // --- 3. FORM RECOVERY ---
    // This loads your typed text back into the FORM inputs if you refresh,
    // but it DOES NOT touch the product table.
    useEffect(() => {
        const unsaved = JSON.parse(
            localStorage.getItem("unsaved_forms") || "{}",
        );
        if (unsaved.product) {
            setData(unsaved.product);
        }
    }, []);

    // --- 4. SUBMIT (ADD OR UPDATE) ---
    function submit(e) {
        e.preventDefault();

        if (processing) return; // prevents double submit

        setPriceError("");

        const buy = Number(data.unit_buy_price);
        const sell = Number(data.unit_sell_price);

        if (!buy || !sell) {
            setPriceError("Buy and Sell price are required.");
            return;
        }

        if (sell <= buy) {
            setPriceError("Sell price must be greater than buy price.");
            return;
        }

        post("/products", {
            onSuccess: () => {
                reset();
                setData({
                    name: "",
                    sku: "",
                    category_id: "",
                    unit_buy_price: "",
                    unit_sell_price: "",
                     tax_rate: "",
                    current_quantity: "",
                    min_stock_level: "",
                });
                setEditingId(null);
                setPriceError("");
            },

            onError: (errors) => {
                setPriceError(Object.values(errors).flat()[0]);
                setEditingId(editingId);
            },

            preserveScroll: true,
        });
        if (editingId) {
            put(`/products/${editingId}`, {
                data,
                preserveState: false,
            });
        } else {
            post("/products", options);
        }
    }
    function editProduct(product) {
        setEditingId(product.id);

        setData({
            name: product.name,
            sku: product.sku,
            category_id: product.category_id || "",
            unit_buy_price: product.unit_buy_price,
            unit_sell_price: product.unit_sell_price,
            tax_rate: product.tax_rate || 0,
            current_quantity: product.current_quantity,
            min_stock_level: product.min_stock_level,
        });
    }

    function deleteProduct(id) {
        if (!confirm("Delete this product?")) return;

        destroy(`/products/${id}`, {
            onSuccess: () => {
                if (editingId === id) {
                    reset();
                    setEditingId(null);
                }
            },
            onError: (errors) => console.log(errors),
        });
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Products</h1>

            {priceError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-300">
                    {priceError}
                </div>
            )}

            {/* Form */}
            {can("create products") && (
                <form
                    onSubmit={submit}
                    className="bg-white p-5 rounded-lg shadow mb-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <input
                            placeholder="Product name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className="border rounded-lg p-2"
                        />
                        <input
                            placeholder="SKU"
                            value={data.sku}
                            onChange={(e) => {
                                setData("sku", e.target.value);
                                setPriceError(""); // clears old "SKU taken" instantly
                            }}
                            className="border rounded-lg p-2"
                        />
                        <select
                            value={data.category_id}
                            onChange={(e) =>
                                setData("category_id", e.target.value)
                            }
                            className="border rounded-lg p-2"
                        >
                            <option value="">Select Category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            placeholder="Buy Price (ETB)"
                            value={data.unit_buy_price}
                            onChange={(e) => {
                                setData("unit_buy_price", e.target.value);
                                setPriceError(""); //
                            }}
                            className="border rounded-lg p-2"
                        />
                        <input
                            type="number"
                            placeholder="Sell Price (ETB)"
                            value={data.unit_sell_price}
                            onChange={(e) => {
                                setData("unit_sell_price", e.target.value);
                                setPriceError("");
                            }}
                            className="border rounded-lg p-2"
                        />
                        <input
                           type="number"
                           placeholder="Tax Rate (%)"
                           value={data.tax_rate}
                           onChange={(e) =>
                           setData("tax_rate", e.target.value)
                                             }
                               className="border rounded-lg p-2"
                           />
                        <input
                            type="number"
                            placeholder="Quantity"
                            value={data.current_quantity}
                            onChange={(e) =>
                                setData("current_quantity", e.target.value)
                            }
                            className="border rounded-lg p-2"
                        />
                        <input
                            type="number"
                            placeholder="Min Stock"
                            value={data.min_stock_level}
                            onChange={(e) =>
                                setData("min_stock_level", e.target.value)
                            }
                            className="border rounded-lg p-2"
                        />
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        {editingId && (
                            <button
                                type="button"
                                onClick={() => {
                                    reset();
                                    setEditingId(null);
                                }}
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            disabled={processing}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing
                                ? "Saving..."
                                : editingId
                                  ? "Update"
                                  : "Add Product"}
                        </button>
                    </div>
                </form>
            )}

            {/* Search */}
            <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded-lg p-2 mb-4 w-full"
            />

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Category</th>
                            <th className="px-4 py-3 text-left">Stock</th>
                            <th className="px-4 py-3 text-left">Buy (ETB)</th>
                            <th className="px-4 py-3 text-left">Sell (ETB)</th>
                            <th className="px-4 py-3 text-left">Tax (%)</th>
                            {(can("edit products") ||
                                can("delete products")) && (
                                <th className="px-4 py-3 text-center">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {products
                            .filter((p) =>
                                p.name
                                    .toLowerCase()
                                    .includes(search.toLowerCase()),
                            )
                            .map((p) => {
                                const lowStock =
                                    p.current_quantity <= p.min_stock_level;
                                return (
                                    <tr
                                        key={p.id}
                                        className={`border-b ${lowStock ? "bg-red-50" : ""}`}
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            {p.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            {p.category?.name || "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {p.current_quantity}
                                            {lowStock && (
                                                <span className="ml-2 text-xs text-red-600">
                                                    ⚠ Low
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {p.unit_buy_price}
                                        </td>
                                        <td className="px-4 py-3 font-semibold">
                                            {p.unit_sell_price}
                                        </td>
                                        <td className="px-4 py-3">
                                             {p.tax_rate ?? 0}%
                                        </td>
                                        <td className="px-4 py-3 text-center space-x-2">
                                            <Link
                                                href={route("products.show", p.id)}
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                View
                                            </Link>
                                            {can("edit products") && (
                                                <button
                                                    onClick={() =>
                                                        editProduct(p)
                                                    }
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {can("delete products") && (
                                                <button
                                                    onClick={() =>
                                                        deleteProduct(p.id)
                                                    }
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        {products.filter((p) =>
                            p.name.toLowerCase().includes(search.toLowerCase()),
                        ).length === 0 && (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="px-4 py-8 text-center text-gray-500"
                                >
                                    No products found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="flex justify-center mt-4 gap-2">
                {initialProducts.links.map((link, index) => (
                 <Link
                key={index}
                href={link.url || "#"}
                 dangerouslySetInnerHTML={{ __html: link.label }}
                 className={`px-3 py-1 rounded border ${
                link.active
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700"
               } ${!link.url ? "opacity-50 pointer-events-none" : ""}`}
                 />
         ))}
            </div>
            </div>
        </div>
    );
}