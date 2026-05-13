<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\StockAdjustment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        return Inertia::render('Products/Index', [
            'products' => Product::with('category')->latest()->get(),
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

    public function destroy(Product $product)
    {
        $product->delete();
        return back();
    }
}