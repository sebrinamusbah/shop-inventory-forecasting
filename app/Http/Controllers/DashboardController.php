<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Inertia\Inertia;
use App\Models\Sale;
use Carbon\Carbon;


class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $lowStockProducts = Product::whereColumn('current_quantity', '<=', 'min_stock_level')
            ->with('category')
            ->get();
            $todaySales = Sale::whereDate('sale_date', Carbon::today())
    ->sum('total_amount');

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

        ]);
    }
}