<?php

use Illuminate\Support\Facades\Route;
use App\Events\DashboardUpdated;

Route::post('/ai-updated', function () {

    broadcast(new DashboardUpdated());

    return response()->json([
        'message' => 'broadcast sent'
    ]);

});