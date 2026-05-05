<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockAdjustment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockAdjustmentController extends Controller
{
    public function create()
    {
        return Inertia::render('StockAdjustments/Create', [
            'categories' => \App\Models\Category::select('id', 'name')->get(),
            'products' => \App\Models\Product::select('id','name','current_quantity','category_id')->get(),
            'adjustments' => StockAdjustment::with('product')->latest()->get()
        ]);
    }

   public function store(Request $request)
{
    $validated = $request->validate([
        'product_id' => 'required|exists:products,id',
        'type' => 'required|in:increment,decrement',
        'quantity' => 'required|integer|min:1',
        'note' => 'nullable|string',
    ]);

    $product = Product::findOrFail($validated['product_id']);
    $previousStock = $product->current_quantity;
    
    // Initialize total_cost as 0.00
    $totalCost = 0;

    if ($validated['type'] === 'increment') {
        $product->current_quantity += $validated['quantity'];
    } else {
        if ($product->current_quantity < $validated['quantity']) {
            return back()->withErrors(['quantity' => 'Not enough stock']);
        }
        $product->current_quantity -= $validated['quantity'];
        
        /* 
         * FIX: Calculate the financial loss for decrements (damages/loss).
         * We multiply the quantity by the unit_buy_price to get the total loss value.
         */
        $totalCost = $validated['quantity'] * $product->unit_buy_price;
    }

    $product->save();

    StockAdjustment::create([
        'product_id' => $product->id,
        'category_id' => $product->category_id,
        'type' => $validated['type'],
        'quantity' => $validated['quantity'],
        'total_cost' => $totalCost, // This will now populate your database correctly
        'previous_stock' => $previousStock,
        'new_stock' => $product->current_quantity,
        'note' => $validated['note'],
    ]);

    return back();
}

    public function destroy($id)
    {
        $adjustment = StockAdjustment::findOrFail($id);
        $product = Product::findOrFail($adjustment->product_id);

        if ($adjustment->type === 'increment') {
            $product->current_quantity -= $adjustment->quantity;
        } else {
            $product->current_quantity += $adjustment->quantity;
        }

        $product->save();
        $adjustment->delete();

        return back();
    }

    public function update(Request $request, $id)
    {
        $adjustment = StockAdjustment::findOrFail($id);
        $product = Product::findOrFail($adjustment->product_id);

        $validated = $request->validate([
            'type' => 'required|in:increment,decrement',
            'quantity' => 'required|integer|min:1',
            'note' => 'nullable|string',
        ]);

        if ($adjustment->type === 'increment') {
            $product->current_quantity -= $adjustment->quantity;
        } else {
            $product->current_quantity += $adjustment->quantity;
        }

        if ($validated['type'] === 'increment') {
            $product->current_quantity += $validated['quantity'];
        } else {
            if ($product->current_quantity < $validated['quantity']) {
                return back()->withErrors(['quantity' => 'Not enough stock']);
            }
            $product->current_quantity -= $validated['quantity'];
        }

        $product->save();

        $adjustment->update([
            'type' => $validated['type'],
            'quantity' => $validated['quantity'],
            'note' => $validated['note'],
            'new_stock' => $product->current_quantity,
        ]);

        return back();
    }
}