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
    // =========================
    // DASHBOARD
    // =========================
    public function index()
    {
        $user = auth()->user();

        // =========================
        // BUSINESS DATA
        // =========================
        $lowStockProducts = Product::whereColumn(
                'current_quantity',
                '<=',
                'min_stock_level'
            )
            ->with('category')
            ->get();

        $todaySales = Sale::whereDate(
                'sale_date',
                Carbon::today()
            )
            ->sum('total_amount');

        // =========================
        // AI SNAPSHOT
        // =========================
        $aiSnapshot = DB::table('ai_snapshots')
            ->latest('id')
            ->first();

        if (!$aiSnapshot) {
            $aiSnapshot = (object) [
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
        }

        // =========================
        // LATEST AI PREDICTIONS
        // IMPORTANT:
        // only latest prediction per product
        // =========================
        $latestPredictionIds = DB::table('ai_predictions')
            ->select(DB::raw('MAX(id) as id'))
            ->groupBy('product_id');

        $aiPredictions = DB::table('ai_predictions')
            ->joinSub($latestPredictionIds, 'latest', function ($join) {
                $join->on('ai_predictions.id', '=', 'latest.id');
            })
            ->leftJoin('products', 'ai_predictions.product_id', '=', 'products.id')
            ->select(
                'ai_predictions.*',
                DB::raw('COALESCE(products.name, ai_predictions.product_name) as product_name')
            )
            ->orderByDesc('ai_predictions.updated_at')
            ->get();

        // =========================
        // LATEST AI INSIGHTS
        // =========================
        $latestInsightIds = DB::table('ai_insights')
            ->select(DB::raw('MAX(id) as id'))
            ->groupBy('product_id');

        $aiInsights = DB::table('ai_insights')
            ->joinSub($latestInsightIds, 'latest', function ($join) {
                $join->on('ai_insights.id', '=', 'latest.id');
            })
            ->leftJoin('products', 'ai_insights.product_id', '=', 'products.id')
            ->select(
                'ai_insights.*',
                DB::raw('COALESCE(products.name, ai_insights.product_name) as product_name')
            )
            ->orderByDesc('ai_insights.updated_at')
            ->get();

        // =========================
        // ACTIVE AI ALERTS
        // =========================
        $aiAlerts = DB::table('ai_alerts')
            ->leftJoin('products', 'ai_alerts.product_id', '=', 'products.id')
            ->select(
                'ai_alerts.*',
                DB::raw('COALESCE(products.name, ai_alerts.product_name) as product_name')
            )
            ->where('ai_alerts.is_resolved', false)
            ->orderByDesc('ai_alerts.updated_at')
            ->limit(50)
            ->get();

        // =========================
        // RESPONSE
        // =========================
        return Inertia::render('Dashboard', [

            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,

                    'roles' => method_exists($user, 'getRoleNames')
                        ? $user->getRoleNames()->toArray()
                        : [],

                    'permissions' => method_exists($user, 'getAllPermissions')
                        ? $user->getAllPermissions()
                            ->pluck('name')
                            ->toArray()
                        : [],
                ],
            ],

            // =========================
            // BUSINESS
            // =========================
            'totalProducts' => Product::count(),

            'lowStockCount' => $lowStockProducts->count(),

            'lowStockProducts' => $lowStockProducts,

            'todaySales' => $todaySales,

            // =========================
            // AI
            // =========================
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

            // IMPORTANT
            // Example:
            // AI_SERVICE_URL=http://127.0.0.1:8000
            $baseUrl = rtrim(env('AI_SERVICE_URL'), '/');

            if (!$baseUrl) {
                return response()->json([
                    'success' => false,
                    'message' => 'AI_SERVICE_URL missing'
                ], 500);
            }

            // =========================
            // CALL FASTAPI
            // =========================
            $response = Http::timeout(120)
                ->post("{$baseUrl}/run-ai/{$productId}");

            // =========================
            // SUCCESS
            // =========================
            if ($response->successful()) {

                return response()->json([
                    'success' => true,
                    'message' => 'AI executed successfully',
                    'data' => $response->json()
                ]);
            }

            // =========================
            // FAILED RESPONSE
            // =========================
            return response()->json([
                'success' => false,
                'message' => 'AI execution failed',
                'error' => $response->body()
            ], 500);

        } catch (\Throwable $e) {

            return response()->json([
                'success' => false,
                'message' => 'Server error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

}