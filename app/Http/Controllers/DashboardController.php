<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

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
        $todaySales = Sale::whereDate(
            'sale_date',
            Carbon::today()
        )->sum('total_amount');

        // =========================
        // TOTAL PRODUCTS
        // =========================
        $totalProducts = Product::count();

        // =========================
        // RESPONSE
        // =========================
        return Inertia::render('Dashboard', [

            // AUTH (SAFE FOR SPA + PERMISSIONS READY)
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,

                    // Spatie roles
                    'roles' => method_exists($user, 'getRoleNames')
                        ? $user->getRoleNames()->toArray()
                        : [],

                    // Spatie permissions
                    'permissions' => method_exists($user, 'getAllPermissions')
                        ? $user->getAllPermissions()->pluck('name')->toArray()
                        : [],
                ],
            ],

            // =========================
            // BUSINESS DATA ONLY
            // =========================
            'totalProducts' => $totalProducts,

            'todaySales' => $todaySales,

            'lowStockCount' => $lowStockProducts->count(),

            'lowStockProducts' => $lowStockProducts,
        ]);
    }
}