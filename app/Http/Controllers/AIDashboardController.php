<?php

namespace App\Http\Controllers;

use App\Models\AIAlert;
use App\Models\AIPrediction;
use App\Models\AIInsight;

class AIDashboardController extends Controller
{
    public function dashboard()
    {
        $predictions = AIPrediction::latest()->get();
    $insights = AIInsight::latest()->get();
    $alerts = AIAlert::latest()->get();

    return inertia('Analytics', [
        'predictions' => $predictions,
        'insights' => $insights,
        'alerts' => $alerts,
    ]);
}
}