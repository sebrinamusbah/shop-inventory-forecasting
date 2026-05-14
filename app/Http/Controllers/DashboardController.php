<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Purchase;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $today = Carbon::today();
        $threeDaysFromNow = Carbon::today()->addDays(3);

        // =========================
        // LOW STOCK PRODUCTS
        // =========================
        $lowStockProducts = Product::whereColumn(
            'current_quantity',
            '<=',
            'min_stock_level'
        )
        ->with('category')
        ->get();

        // =========================
        // TODAY SALES
        // =========================
        $todaySales = Sale::whereDate('sale_date', $today)->sum('total_amount');

        // =========================
        // TOTAL PRODUCTS
        // =========================
        $totalProducts = Product::count();

        // =========================
        // CREDIT & DEBT LOGIC (Refined Breakdown)
        // =========================
        
        // Fetch all unpaid credit purchases
        $credits = Purchase::whereIn('payment_method', ['Credit', 'credit'])->get();

        // 1. Calculate Amount Breakdowns
        $overdueSum = $credits->filter(fn($p) => 
            Carbon::parse($p->due_date)->isPast() && !Carbon::parse($p->due_date)->isToday()
        )->sum('total_cost');

        $dueTodaySum = $credits->filter(fn($p) => 
            Carbon::parse($p->due_date)->isToday()
        )->sum('total_cost');

        $upcomingSum = $credits->filter(fn($p) => 
            Carbon::parse($p->due_date)->isBetween($today->copy()->addDay(), $threeDaysFromNow)
        )->sum('total_cost');

        // 2. Count for the status badge
        $overdueCount = $credits->filter(fn($p) => 
            Carbon::parse($p->due_date)->isPast() && !Carbon::parse($p->due_date)->isToday()
        )->count();

        // 3. Determine the Status Label based on priority
        $statusLabel = 'Accounts Clear';
        if ($credits->isNotEmpty()) {
            if ($overdueSum > 0) {
                $statusLabel = 'Overdue';
            } elseif ($dueTodaySum > 0) {
                $statusLabel = 'Due Today';
            } elseif ($upcomingSum > 0) {
                $statusLabel = 'Within 3 Days';
            } else {
                $statusLabel = 'Due Soon';
            }
        }

        // =========================
        // RESPONSE
        // =========================
        return Inertia::render('Dashboard', [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => method_exists($user, 'getRoleNames') ? $user->getRoleNames()->toArray() : [],
                    'permissions' => method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name')->toArray() : [],
                ],
            ],

            'totalProducts'    => $totalProducts,
            'todaySales'       => $todaySales,
            'lowStockCount'    => $lowStockProducts->count(),
            'lowStockProducts' => $lowStockProducts,

            'creditStats' => [
                'total_amount'    => (float) $credits->sum('total_cost'), 
                'status_label'    => $statusLabel,
                'overdue_amount'  => (float) $overdueSum,
                'today_amount'    => (float) $dueTodaySum,
                'upcoming_amount' => (float) $upcomingSum,
                'overdue_count'   => $overdueCount,
            ],
        ]);
    }
}