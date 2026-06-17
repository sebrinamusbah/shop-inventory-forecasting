<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\StockAdjustment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class ProductController extends Controller
{
  public function index()
{
    return Inertia::render('Products/Index', [
        'products' => Product::with('category')
            ->latest()
            ->paginate(10)
            ->withQueryString(),

        'categories' => Category::all(),
        'totalProducts' => Product::count(),
    ]);
}

    // CREATE PRODUCT (FIXED)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'sku' => 'required|string|unique:products,sku',
            'category_id' => 'nullable|exists:categories,id',
            'unit_buy_price' => 'required|numeric|min:0',
            'unit_sell_price' => 'required|numeric|gt:unit_buy_price',
             'tax_rate' => 'nullable|numeric|min:0|max:100',
            'current_quantity' => 'nullable|integer|min:0',
            'min_stock_level' => 'nullable|integer|min:0',
            
        ]);

        Product::create($validated);

        return back()->with('success', 'Product created');
    }

    //  UPDATE PRODUCT
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'sku' => [
                'required',
                'string',
                Rule::unique('products', 'sku')->ignore($product->id),
            ],
            'category_id' => 'nullable|exists:categories,id',
            'unit_buy_price' => 'required|numeric|min:0',
            'unit_sell_price' => 'required|numeric|gt:unit_buy_price',
            'current_quantity' => 'nullable|integer|min:0',
            'min_stock_level' => 'nullable|integer|min:0',
        ]);

        $product->update($validated);

        return back();
    }

    // SHOW PRODUCT DETAIL
    public function show(Product $product)
    {
        // eager load category and related purchase data (supplier + user)
        $product->load(['category', 'purchaseItems.purchase.supplier', 'purchaseItems.purchase.user']);

        // build a simplified purchases list related to this product
        $purchases = $product->purchaseItems->map(function ($item) {
            $purchase = $item->purchase;
            if (! $purchase) return null;

            return [
                'id' => $purchase->id,
                'invoice_no' => $purchase->invoice_no,
                'supplier' => $purchase->supplier ? [
                    'id' => $purchase->supplier->id,
                    'name' => $purchase->supplier->name,
                ] : null,
                'purchase_date' => $purchase->purchase_date,
                'quantity' => $item->quantity,
                'unit_cost' => $item->unit_cost,
                'subtotal' => $item->subtotal,
                'user' => $purchase->user ? [
                    'id' => $purchase->user->id,
                    'name' => $purchase->user->name,
                ] : null,
            ];
        })->filter()->values();

        // try to resolve who created the product using activity log (Spatie)
        $activity = Activity::where('subject_type', Product::class)
            ->where('subject_id', $product->id)
            ->orderBy('created_at')
            ->first();

        $created_by = null;
        $causer = $activity?->causer;
        if ($causer) {
            $created_by = [
                'id' => $causer->id,
                'name' => $causer->name,
                'role' => $causer->getRoleNames()->first() ?? null,
            ];
        }

        return Inertia::render('Products/Show', [
            'product' => $product,
            'purchases' => $purchases,
            'created_by' => $created_by,
        ]);
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return back();
    }
}