<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // =========================
        // BUSINESS DATA
        // =========================
        $lowStockProducts = Product::whereColumn('current_quantity', '<=', 'min_stock_level')
            ->with('category')
            ->get();

        $todaySales = Sale::whereDate('sale_date', Carbon::today())
            ->sum('total_amount');

        // =========================
        // AI SNAPSHOT (LATEST)
        // =========================
        $aiSnapshot = DB::table('ai_snapshots')
            ->orderByDesc('id')
            ->first();

        // fallback safety
        $aiSnapshot = $aiSnapshot ?? (object)[
            'total_sales' => 0,
            'total_profit' => 0,
            'sales_trend' => 'stable',
            'low_stock_count' => 0,
            'out_of_stock_count' => 0,
            'top_product_id' => null,
            'top_product_name' => null,
            'total_predictions_count' => 0,
            'critical_alerts_count' => 0,
        ];

        // =========================
        // AI PREDICTIONS
        // =========================
        $aiPredictions = DB::table('ai_predictions')
            ->leftJoin('products', 'ai_predictions.product_id', '=', 'products.id')
            ->select(
                'ai_predictions.*',
                DB::raw('COALESCE(products.name, "Unknown") as product_name')
            )
            ->orderByDesc('ai_predictions.id')
            ->limit(20)
            ->get();

        // =========================
        // AI INSIGHTS
        // =========================
        $aiInsights = DB::table('ai_insights')
            ->leftJoin('products', 'ai_insights.product_id', '=', 'products.id')
            ->select(
                'ai_insights.*',
                DB::raw('COALESCE(products.name, "Unknown") as product_name')
            )
            ->orderByDesc('ai_insights.id')
            ->limit(20)
            ->get();

        // =========================
        // AI ALERTS (IMPORTANT)
        // =========================
        $aiAlerts = DB::table('ai_alerts')
            ->leftJoin('products', 'ai_alerts.product_id', '=', 'products.id')
            ->select(
                'ai_alerts.*',
                DB::raw('COALESCE(products.name, "Unknown") as product_name')
            )
            ->orderByDesc('ai_alerts.id')
            ->limit(20)
            ->get();

        // =========================
        // RETURN TO UI
        // =========================
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

            // BUSINESS
            'totalProducts' => Product::count(),
            'lowStockCount' => $lowStockProducts->count(),
            'lowStockProducts' => $lowStockProducts,
            'todaySales' => $todaySales,

            // AI SYSTEM
            'aiSnapshot' => $aiSnapshot,
            'aiPredictions' => $aiPredictions,
            'aiInsights' => $aiInsights,
            'aiAlerts' => $aiAlerts,
        ]);
    }

    // =========================
    // MANUAL AI RUN
    // =========================
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