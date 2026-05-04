<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $lowStockProducts = Product::whereColumn('current_quantity', '<=', 'min_stock_level')
            ->with('category')
            ->get();

        // =========================
        // AI DATA (NEW ADDITION)
        // =========================

        $latestSnapshot = DB::table('ai_snapshots')
            ->orderBy('id', 'desc')
            ->first();

        $latestPredictions = DB::table('ai_predictions')
            ->join('products', 'ai_predictions.product_id', '=', 'products.id')
            ->select(
                'ai_predictions.*',
                'products.name as product_name'
            )
            ->orderBy('ai_predictions.id', 'desc')
            ->limit(10)
            ->get();

        $latestInsights = DB::table('ai_insights')
            ->join('products', 'ai_insights.product_id', '=', 'products.id')
            ->select(
                'ai_insights.*',
                'products.name as product_name'
            )
            ->orderBy('ai_insights.id', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('Dashboard', [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames()->toArray(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                ],
            ],

            // =========================
            // YOUR EXISTING DATA
            // =========================
            'totalProducts' => Product::count(),
            'lowStockCount' => $lowStockProducts->count(),
            'lowStockProducts' => $lowStockProducts,

            // =========================
            // NEW AI DATA (ADDED)
            // =========================
            'aiSnapshot' => $latestSnapshot,
            'aiPredictions' => $latestPredictions,
            'aiInsights' => $latestInsights,
        ]);
    }
}