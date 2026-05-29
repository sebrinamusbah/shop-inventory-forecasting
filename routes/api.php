<?php
use Illuminate\Support\Facades\Route;
use App\Events\DashboardUpdated;
use App\Models\AIPrediction;
use App\Models\AIInsight;
use App\Models\AIAlert;

Route::post('/ai-updated', function () {

    broadcast(new DashboardUpdated(
        AIPrediction::latest()->get(),
        AIInsight::latest()->get(),
        AIAlert::latest()->get()
    ));

    return response()->json(['ok' => true]);
});