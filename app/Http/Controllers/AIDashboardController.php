<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class AIDashboardController extends Controller
{
    public function dashboard()
    {
        return response()->json([
            'predictions' => DB::table('ai_predictions')
                ->latest('updated_at')
                ->get(),

            'insights' => DB::table('ai_insights')
                ->latest('updated_at')
                ->get(),

            'alerts' => DB::table('ai_alerts')
                ->where('is_resolved', false)
                ->latest('updated_at')
                ->get(),
        ]);
    }
}