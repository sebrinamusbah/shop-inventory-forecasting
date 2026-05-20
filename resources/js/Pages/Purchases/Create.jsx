import React, { useState, useEffect, useRef } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';

export default function Create({ auth, categories, suppliers, purchase }) {
    const paymentMethods = [
        { id: 'Cash', label: 'Cash', icon: '💵' },
        { id: 'CBE', label: 'CBE (Commercial Bank of Ethiopia)', icon: '🏦' },
        { id: 'Telebirr', label: 'Telebirr', icon: '📱' },
        { id: 'Other Bank', label: 'Other Bank', icon: '🏛️' },
        { id: 'Credit', label: 'Credit', icon: '📅' },
    ];

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Modal management and asynchronous suppliers state integration
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [suppliersList, setSuppliersList] = useState(suppliers || []);
    const [newSupplier, setNewSupplier] = useState({
        name: '', email: '', phone: '', tin_number: '', account_number: '', address: ''
    });

    const { data, setData, post, processing, errors } = useForm({
        supplier_id: purchase ? purchase.supplier_id : '', 
        payment_method: purchase ? (purchase.payment_method || 'Cash') : 'Cash',
        due_date: purchase ? purchase.due_date : '',
        items: purchase ? purchase.items.map(item => ({
            id: item.product_id, 
            name: item.product.name,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            sale_price: item.product.unit_sell_price || 0, 
            subtotal: item.subtotal
        })) : [], 
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedMethod = paymentMethods.find(m => m.id === data.payment_method) || paymentMethods[0];

    const [selectedCategory, setSelectedCategory] = useState('');
    const [availableProducts, setAvailableProducts] = useState([]);
    const [tempItem, setTempItem] = useState({ id: '', name: '', quantity: '', unit_cost: 0, sale_price: 0 });

    useEffect(() => {
        if (selectedCategory) {
            fetch(`/purchases/get-products/${selectedCategory}`)
                .then(res => res.json())
                .then(data => setAvailableProducts(data));
        } else {
            setAvailableProducts([]);
        }
    }, [selectedCategory]);

    const addItem = () => {
        if (!tempItem.id || !tempItem.quantity || tempItem.quantity <= 0) return;
        const subtotal = tempItem.quantity * tempItem.unit_cost;
        
        setData('items', [...data.items, { 
            id: tempItem.id,
            name: tempItem.name,
            quantity: parseFloat(tempItem.quantity),
            unit_cost: parseFloat(tempItem.unit_cost),
            sale_price: parseFloat(tempItem.sale_price), 
            subtotal: subtotal 
        }]);

        setTempItem({ id: '', name: '', quantity: '', unit_cost: 0, sale_price: 0 });
    };

    const removeItem = (index) => {
        setData('items', data.items.filter((_, i) => i !== index));
    };

    const handleInlineChange = (index, field, value) => {
        const updatedItems = [...data.items];
        updatedItems[index][field] = parseFloat(value) || 0;
        
        if (field === 'quantity' || field === 'unit_cost') {
            updatedItems[index].subtotal = updatedItems[index].quantity * updatedItems[index].unit_cost;
        }
        
        setData('items', updatedItems);
    };

    const total_cost = data.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0).toFixed(2);

    const handleSubmit = (e) => {
        e.preventDefault();
        const action = purchase ? route('purchases.update', purchase.id) : route('purchases.store');
        if (purchase) {
            post(action, { _method: 'PUT', ...data, total_cost });
        } else {
            post(action, { ...data, total_cost });
        }
    };

    const handleQuickSupplierSubmit = (e) => {
        e.preventDefault();
        axios.post(route('suppliers.quick-store'), newSupplier)
            .then(response => {
                if (response.data.success) {
                    const createdSupplier = response.data.supplier;
                    setSuppliersList([...suppliersList, createdSupplier]);
                    setData('supplier_id', createdSupplier.id);
                    setNewSupplier({ name: '', email: '', phone: '', tin_number: '', account_number: '', address: '' });
                    setIsModalOpen(false);
                }
            })
            .catch(error => {
                console.error(error);
                alert("Error saving supplier. Please confirm data validity.");
            });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={purchase ? "Edit Purchase" : "Create Purchase"} />
            <div className="max-w-7xl mx-auto py-8 px-4">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    
                    {/* SECTION 1: Add Inventory Items */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <span className="p-2 bg-blue-50 rounded-lg text-blue-600">📦</span>
                            Add Inventory Items
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div className="md:col-span-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">1. Category</label>
                                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full border-gray-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 transition">
                                    <option value="" disabled hidden>Select</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">2. Product</label>
                                <select 
                                    value={tempItem.id} 
                                    onChange={e => {
                                        const p = availableProducts.find(x => x.id == e.target.value);
                                        if (p) setTempItem({...tempItem, id: p.id, name: p.name, unit_cost: p.unit_buy_price, sale_price: p.unit_sell_price || 0});
                                    }} 
                                    className="w-full border-gray-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 transition"
                                    disabled={!selectedCategory}
                                >
                                    <option value="" disabled hidden>Choose product</option>
                                    {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Qty</label>
                                <input type="number" value={tempItem.quantity} onChange={e => setTempItem({...tempItem, quantity: e.target.value})} className="w-full border-gray-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
                            </div>
                            <button type="button" onClick={addItem} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-blue-100">Add</button>
                        </div>
                    </div>

                    {/* SECTION 2: Inventory Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase">
                                <tr>
                                    <th className="px-6 py-4 text-left">Item Name</th>
                                    <th className="px-4 py-4 text-center">Quantity</th>
                                    <th className="px-4 py-4 text-center">Buy Price</th>
                                    <th className="px-4 py-4 text-center">Sale Price</th>
                                    <th className="px-6 py-4 text-right">Subtotal</th>
                                    <th className="px-6 py-4 text-center w-[100px]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.items.map((item, index) => (
                                    <tr key={`${item.id}-${index}`} className="hover:bg-gray-50/50 transition">
                                        <td className="px-6 py-4 font-semibold text-gray-700 text-sm">{item.name}</td>
                                        <td className="px-4 py-4">
                                            <input 
                                                type="number" 
                                                className="w-20 mx-auto block border-gray-200 rounded-lg text-center text-sm focus:ring-blue-400"
                                                value={item.quantity}
                                                onChange={(e) => handleInlineChange(index, 'quantity', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <input 
                                                type="number" 
                                                className="w-24 mx-auto block border-gray-200 rounded-lg text-center text-sm font-medium text-blue-600 focus:ring-blue-400"
                                                value={item.unit_cost}
                                                onChange={(e) => handleInlineChange(index, 'unit_cost', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <input 
                                                type="number" 
                                                className="w-24 mx-auto block border-gray-200 rounded-lg text-center text-sm font-medium text-green-600 focus:ring-green-400"
                                                value={item.sale_price}
                                                onChange={(e) => handleInlineChange(index, 'sale_price', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-sm text-gray-800 whitespace-nowrap">
                                            ETB {parseFloat(item.subtotal).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                type="button" 
                                                onClick={() => removeItem(index)} 
                                                className="bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center mx-auto transition-all p-2"
                                                style={{ width: '40px', height: '40px' }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {data.items.length === 0 && (
                            <div className="p-12 text-center text-gray-400 text-sm italic bg-gray-50/20">
                                No items added to this purchase yet.
                            </div>
                        )}
                    </div>

                    {/* SECTION 3: Purchase Summary (Scaled and Balanced) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 border-b border-gray-50 pb-4">
                            Finalize Transaction
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                            {/* Supplier Selector */}
                            <div>
                                <label className="text-[11px] font-black text-gray-400 uppercase mb-2 block">Vendor / Supplier</label>
                                <div className="flex gap-2">
                                    <select value={data.supplier_id} onChange={e => setData('supplier_id', e.target.value)} className="flex-1 border-gray-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 h-11" required>
                                        <option value="" disabled hidden>Select Vendor</option>
                                        {suppliersList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl font-bold text-lg h-11 transition-all"
                                        title="Quick Add Supplier"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Payment Method Selector */}
                            <div className="relative" ref={dropdownRef}>
                                <label className="text-[11px] font-black text-gray-400 uppercase mb-2 block">Payment Method</label>
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 flex justify-between items-center text-left hover:border-blue-400 transition h-11"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-lg">{selectedMethod.icon}</span>
                                        <span className="text-gray-700 font-semibold text-sm">{selectedMethod.label}</span>
                                    </span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
                                        {paymentMethods.map((method) => (
                                            <div
                                                key={method.id}
                                                onClick={() => {
                                                    setData('payment_method', method.id);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="p-3 flex items-center gap-3 hover:bg-blue-50 cursor-pointer transition text-gray-700 border-b border-gray-50 last:border-0 text-sm"
                                            >
                                                <span>{method.icon}</span>
                                                <span className="font-medium">{method.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Compact Total and Button Area */}
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-blue-400 uppercase">Grand Total</span>
                                    <span className="text-xl font-bold text-blue-700">
                                        ETB {parseFloat(total_cost).toLocaleString()}
                                    </span>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={processing} 
                                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {processing ? '...' : (purchase ? 'Update' : 'Save Purchase')}
                                </button>
                            </div>
                        </div>

                        {/* Credit Due Date (Conditional) */}
                        {data.payment_method === 'Credit' && (
                            <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-xl max-w-xs animate-in fade-in slide-in-from-top-2">
                                <label className="text-[11px] font-black text-orange-500 uppercase mb-2 block">Expected Payment Date</label>
                                <input 
                                    type="date" 
                                    value={data.due_date} 
                                    onChange={e => setData('due_date', e.target.value)} 
                                    className="w-full border-orange-200 rounded-xl text-sm focus:ring-orange-500 focus:border-orange-500" 
                                    required 
                                />
                            </div>
                        )}
                    </div>
                </form>
            </div>

            {/* Quick Add Supplier Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in dynamic-modal-overlay">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-3">
                            <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
                                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm">🤝</span>
                                Quick Add New Supplier
                            </h3>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm font-semibold p-1">✕</button>
                        </div>
                        
                        <form onSubmit={handleQuickSupplierSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Supplier Name *</label>
                                <input type="text" required value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full border-gray-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 p-2.5" placeholder="Company or Vendor Name"/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
                                <input type="email" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} className="w-full border-gray-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 p-2.5" placeholder="example@domain.com"/>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Phone Number</label>
                                    <input type="text" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} className="w-full border-gray-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 p-2.5" placeholder="+251..."/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">TIN Number</label>
                                    <input type="text" value={newSupplier.tin_number} onChange={e => setNewSupplier({...newSupplier, tin_number: e.target.value})} className="w-full border-gray-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 p-2.5" placeholder="0101..."/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Account Number</label>
                                <input type="text" value={newSupplier.account_number} onChange={e => setNewSupplier({...newSupplier, account_number: e.target.value})} className="w-full border-gray-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 p-2.5" placeholder="1000...."/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Office Address</label>
                                <textarea value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} className="w-full border-gray-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 p-2.5" rows="2" placeholder="Physical location details..."></textarea>
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-50 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition-all">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-100 transition-all">
                                    Save Supplier
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}