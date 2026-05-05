<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Sale;
use App\Models\StockAdjustment; // Ensure you have this model
use Carbon\Carbon;

class ReportController extends Controller
{
    public function getProfitSummary(Request $request)
    {
        $period = $request->query('range', 'today'); 
        $offset = (int)$request->query('offset', 0);
        $selectedDate = $request->query('date');
        $date = Carbon::now();

        if ($selectedDate) {
            $date = Carbon::parse($selectedDate);
            $start = $date->copy()->startOfDay();
            $end = $date->copy()->endOfDay();
            $label = $date->format('M d, Y');
        } else {
            switch ($period) {
                case 'week':
                    $date->addWeeks($offset);
                    $start = $date->copy()->startOfWeek();
                    $end = $date->copy()->endOfWeek();
                    $label = $start->format('M d') . ' - ' . $end->format('M d, Y');
                    break;
                case 'month':
                    $date->addMonths($offset);
                    $start = $date->copy()->startOfMonth();
                    $end = $date->copy()->endOfMonth();
                    $label = $date->format('F Y');
                    break;
                case 'year':
                    $date->addYears($offset);
                    $start = $date->copy()->startOfYear();
                    $end = $date->copy()->endOfYear();
                    $label = $date->format('Y');
                    break;
                default: 
                    $date->addDays($offset);
                    $start = $date->copy()->startOfDay();
                    $end = $date->copy()->endOfDay();
                    $label = $date->format('M d, Y');
            }
        }

        // 1. Calculate Revenue and Gross Profit
        $revenue = Sale::whereBetween('sale_date', [$start, $end])->sum('total_amount') ?? 0;
        $grossProfit = Sale::whereBetween('sale_date', [$start, $end])->sum('total_profit') ?? 0;
        
        // 2. Calculate COGS (Revenue - Gross Profit)
        $cogs = $revenue - $grossProfit;

        // 3. Calculate Stock Adjustments (Damages/Losses)
        // If you don't have a table for this yet, set to 0 for now
        $adjustments = 0; 
        
        // 4. Final Net Profit
        $netProfit = $grossProfit - $adjustments;

        // 5. Margin Percentage
        $margin = $revenue > 0 ? ($netProfit / $revenue) * 100 : 0;

        return response()->json([
            'metrics' => [
                'revenue' => (float)$revenue,
                'cogs' => (float)$cogs,
                'grossProfit' => (float)$grossProfit,
                'netProfit' => (float)$netProfit,
                'margin' => round($margin, 2)
            ],
            'label' => $label 
        ]);
    }

    public function index()
    {
        return Inertia::render('Profit/Index');
    }
}