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

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    // 🚀 MANUAL AI RUN
Route::post('/ai/run/{productId}', [DashboardController::class, 'runAiManually'])
    ->name('ai.run');

    // Profile routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // User Management - Admin only
    Route::middleware(['permission:manage users'])->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    // Categories, Products, and Suppliers
    Route::resource('categories', CategoryController::class)->except(['create', 'edit', 'show']);
    Route::resource('products', ProductController::class)->except(['create', 'edit', 'show']);
    Route::resource('suppliers', SupplierController::class);
    // Stock Adjustments
Route::get('/stock-adjustments/create', [StockAdjustmentController::class, 'create'])
    ->name('stock-adjustments.create');

Route::post('/stock-adjustments', [StockAdjustmentController::class, 'store'])
    ->name('stock-adjustments.store');
    Route::put('/stock-adjustments/{id}', [StockAdjustmentController::class, 'update']);
Route::delete('/stock-adjustments/{id}', [StockAdjustmentController::class, 'destroy']);
Route::put('/stock-adjustments/{id}', [StockAdjustmentController::class, 'update']);
Route::delete('/stock-adjustments/{id}', [StockAdjustmentController::class, 'destroy']);
    // Sales Routes
    Route::resource('sales', SaleController::class);

    // --- Purchases Section (Cleaned Up) ---
    
    // 1. Index (List)
    Route::get('/purchases', [PurchaseController::class, 'index'])->name('purchases.index');

    // 2. Creation & Storage (Moved outside specific permission for testing)
    Route::get('/purchases/create', [PurchaseController::class, 'create'])->name('purchases.create');
    Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchases.store');
    Route::post('/purchases/{id}/update-payment', [PurchaseController::class, 'updatePaymentStatus'])->name('purchases.updatePayment');
    
    // 3. Dynamic Filter Route
    Route::get('/purchases/get-products/{categoryId}', [PurchaseController::class, 'getProductsByCategory'])
        ->name('purchases.getProducts');

    // 4. Other Actions (Show, Edit, Update, Destroy)
    Route::resource('purchases', PurchaseController::class)->except(['index', 'create', 'store']);

    


    // Analytics & Profit Reports
    Route::middleware(['permission:view analytics'])->group(function () {
        Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
    });

    Route::middleware(['permission:view profit reports'])->group(function () {
        Route::get('/profit', [ReportController::class, 'index'])->name('profit.index');
       Route::get('/reports/profit-summary', [ReportController::class, 'getProfitSummary']);
    });
    

});

require __DIR__.'/auth.php';