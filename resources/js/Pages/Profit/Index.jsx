import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

export default function Index({ auth }) {
    const [viewType, setViewType] = useState('month');
    const [offset, setOffset] = useState(0); 
    const [customDate, setCustomDate] = useState(''); 
    const [dateLabel, setDateLabel] = useState(''); 
    const [metrics, setMetrics] = useState({
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        netProfit: 0,
        margin: 0
    });
    const [loading, setLoading] = useState(false);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/reports/profit-summary', {
                params: { 
                    range: viewType,
                    offset: offset,
                    date: customDate 
                }
            });
            setMetrics(response.data.metrics);
            setDateLabel(response.data.label);
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, [viewType, offset, customDate]);

    const handleRangeChange = (range) => {
        setCustomDate(''); 
        setOffset(0);
        setViewType(range);
    };

    const handleNavigation = (direction) => {
        setCustomDate(''); 
        setOffset(prev => direction === 'next' ? prev + 1 : prev - 1);
    };

    const formatCurrency = (val) => {
        const amount = parseFloat(val) || 0;
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'ETB',
        }).format(amount);
    };

    return (
        <AuthenticatedLayout 
            user={auth.user} 
            header={<h2 className="text-lg font-semibold text-gray-800">Financial Overview</h2>}
        >
            <Head title="Profit Report" />

            <div className="py-6 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* COMPACT HEADER CONTROLS */}
                    <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
                        <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-200 flex shrink-0">
                            {['today', 'week', 'month', 'year'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => handleRangeChange(range)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        viewType === range && !customDate
                                        ? 'bg-[#7c5dfa] text-white' 
                                        : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {range.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Smaller Date Picker */}
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 w-36">
                                <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                                <input 
                                    type="date" 
                                    value={customDate}
                                    onChange={(e) => {
                                        setCustomDate(e.target.value);
                                        setViewType('today'); 
                                        setOffset(0);
                                    }}
                                    className="text-xs border-none focus:ring-0 text-[#7c5dfa] font-bold p-0 w-full cursor-pointer"
                                />
                            </div>

                            {/* Smaller Navigator */}
                            <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <button onClick={() => handleNavigation('prev')} className="p-2 hover:bg-gray-50 text-gray-600 border-r">
                                    <ChevronLeftIcon className="w-4 h-4" />
                                </button>
                                <div className="px-4 text-center min-w-[120px]">
                                    <p className="text-[11px] text-[#7c5dfa] font-black tracking-tight">
                                        {loading ? 'LOADING...' : (dateLabel || viewType.toUpperCase())}
                                    </p>
                                </div>
                                <button onClick={() => handleNavigation('next')} className="p-2 hover:bg-gray-50 text-gray-600 border-l">
                                    <ChevronRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* REDUCED SIZE METRIC CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total Revenue', value: metrics.revenue, color: 'border-blue-500' },
                            { label: 'Cost of Goods', value: metrics.cogs, color: 'border-orange-400' },
                            { label: 'Gross Profit', value: metrics.grossProfit, color: 'border-indigo-500' },
                            { label: 'Net Profit', value: metrics.netProfit, color: 'border-green-500', isNet: true }
                        ].map((card, i) => (
                            <div key={i} className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${card.color}`}>
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">{card.label}</p>
                                <div className="flex items-center justify-between">
                                    <h3 className={`text-lg font-black ${card.isNet ? 'text-green-600' : 'text-gray-800'}`}>
                                        {loading ? '...' : formatCurrency(card.value)}
                                    </h3>
                                    {card.isNet && (
                                        <span className="text-[10px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded">
                                            {metrics.margin}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* COMPACT REPORT BREAKDOWN */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50/50 border-b px-6 py-3">
                            <h4 className="text-sm font-bold text-gray-700">Detailed Breakdown</h4>
                        </div>
                        <div className="p-6">
                            <div className="max-w-xl mx-auto space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Sales Income</span>
                                    <span className="font-bold text-gray-800">{formatCurrency(metrics.revenue)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Purchase Costs</span>
                                    <span className="font-bold text-orange-500">({formatCurrency(metrics.cogs)})</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-y border-dashed">
                                    <span className="font-bold text-gray-700">Gross Profit</span>
                                    <span className="font-bold text-indigo-600">{formatCurrency(metrics.grossProfit)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 italic">Adjustments</span>
                                    <span className="font-bold text-red-400">({formatCurrency(metrics.grossProfit - metrics.netProfit)})</span>
                                </div>
                                <div className="flex justify-between pt-4 mt-2 border-t-2 border-gray-100">
                                    <span className="text-base font-black text-gray-900 uppercase">Net Earnings</span>
                                    <span className="text-xl font-black text-green-600">{formatCurrency(metrics.netProfit)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}