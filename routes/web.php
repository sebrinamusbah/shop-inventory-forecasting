<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\ProfitController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StockAdjustmentController;
use App\Http\Controllers\AIDashboardController;

use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// --- Welcome page (public) ---
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Logout route
Route::post('/logout', function () {
    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return redirect('/');
})->name('logout');

// --- Authenticated routes ---
Route::middleware(['auth', 'verified'])->group(function () {

    // ==========================================
    // SHARED ROUTES (Admin & Employee)
    // ==========================================
    
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Profile routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Products & Categories (Viewing/Managing as per your requirement)
    Route::resource('categories', CategoryController::class)->except(['create', 'edit', 'show']);
    Route::resource('products', ProductController::class)->except(['create', 'edit', 'show']);
    
    // Sales
    Route::resource('sales', SaleController::class);

    // Purchases (Allowing access for both for now)
    Route::get('/purchases', [PurchaseController::class, 'index'])->name('purchases.index');
    Route::get('/purchases/create', [PurchaseController::class, 'create'])->name('purchases.create');
    Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchases.store');
    Route::post('/purchases/{id}/update-payment', [PurchaseController::class, 'updatePaymentStatus'])->name('purchases.updatePayment');
    Route::get('/purchases/get-products/{categoryId}', [PurchaseController::class, 'getProductsByCategory'])->name('purchases.getProducts');
    Route::resource('purchases', PurchaseController::class)->except(['index', 'create', 'store']);

    // ==========================================
    // ADMIN ONLY ROUTES (Restricted)
    // ==========================================

    Route::middleware(['permission:manage users'])->group(function () {
        // User Management
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

        // Suppliers - RESTRICTED
        Route::resource('suppliers', SupplierController::class);

        // Stock Adjustments - RESTRICTED
        Route::get('/stock-adjustments/create', [StockAdjustmentController::class, 'create'])->name('stock-adjustments.create');
        Route::post('/stock-adjustments', [StockAdjustmentController::class, 'store'])->name('stock-adjustments.store');
        Route::post('/suppliers/quick-store', [App\Http\Controllers\SupplierController::class, 'storeQuick'])->name('suppliers.quick-store');
        Route::put('/stock-adjustments/{id}', [StockAdjustmentController::class, 'update']);
        Route::delete('/stock-adjustments/{id}', [StockAdjustmentController::class, 'destroy']);

        // AI Management (Manual triggers)
        Route::post('/ai/run/{productId}', [DashboardController::class, 'runAiManually']);
        Route::post('/ai/run-all', [DashboardController::class, 'runAllAi']);
    });

    // ==========================================
    // ANALYTICS & REPORTS
    // ==========================================

    Route::middleware(['permission:view analytics'])->group(function () {
        Route::get('/ai/dashboard', [AIDashboardController::class, 'dashboard']);
        Route::get('/analytics', [AIDashboardController::class, 'dashboard'])->name('analytics.index');
    });

    Route::middleware(['permission:view profit reports'])->group(function () {
        Route::get('/profit', [ReportController::class, 'index'])->name('profit.index');
        Route::get('/reports/profit-summary', [ReportController::class, 'getProfitSummary']);
    });
});

require __DIR__.'/auth.php';