<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http; // ✅ ADD THIS
use Inertia\Inertia;
use App\Models\Sale;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // =========================
        // CORE BUSINESS DATA
        // =========================
        $lowStockProducts = Product::whereColumn('current_quantity', '<=', 'min_stock_level')
            ->with('category')
            ->get();

        $todaySales = Sale::whereDate('sale_date', Carbon::today())
            ->sum('total_amount');

        // =========================
        // AI SNAPSHOT (LATEST)
        // =========================
        $latestSnapshot = DB::table('ai_snapshots')
            ->orderByDesc('id')
            ->first();

        // =========================
        // AI PREDICTIONS (LATEST 10)
        // =========================
        $latestPredictions = DB::table('ai_predictions')
            ->leftJoin('products', 'ai_predictions.product_id', '=', 'products.id')
            ->select(
                'ai_predictions.*',
                DB::raw('COALESCE(products.name, "Unknown") as product_name')
            )
            ->orderByDesc('ai_predictions.id')
            ->limit(10)
            ->get();

        // =========================
        // AI INSIGHTS (LATEST 10)
        // =========================
        $latestInsights = DB::table('ai_insights')
            ->leftJoin('products', 'ai_insights.product_id', '=', 'products.id')
            ->select(
                'ai_insights.*',
                DB::raw('COALESCE(products.name, "Unknown") as product_name')
            )
            ->orderByDesc('ai_insights.id')
            ->limit(10)
            ->get();

        // =========================
        // SAFE FALLBACKS
        // =========================
        $aiSnapshot = $latestSnapshot ?? (object)[
            'total_sales' => 0,
            'total_profit' => 0,
            'sales_trend' => 'stable',
            'low_stock_count' => 0
        ];

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

            'totalProducts' => Product::count(),
            'lowStockCount' => $lowStockProducts->count(),
            'lowStockProducts' => $lowStockProducts,
            'todaySales' => $todaySales,

            'aiSnapshot' => $aiSnapshot,
            'aiPredictions' => $latestPredictions,
            'aiInsights' => $latestInsights,
        ]);
    }

    // ==================================================
    // 🚀 MANUAL AI RUN (ADD THIS PART)
    // ==================================================
    public function runAiManually($productId)
    {
        try {
            $response = Http::timeout(120)->post(
                env('AI_SERVICE_URL') . "/run-ai/{$productId}"
            );

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'AI executed successfully',
                    'data' => $response->json()
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'AI execution failed',
                'error' => $response->body()
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Server error',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}