<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Category;

class SaleController extends Controller
{
    public function index()
    {
        $sales = Sale::with(['employee', 'items.product'])
            ->latest()
            ->paginate(15);

        return Inertia::render('Sale/Index', [
            'sales' => $sales,
        ]);
    }

public function create()
{
    $products = Product::where('current_quantity', '>', 0)
        ->where('is_active', true)
        ->select('id', 'name', 'unit_sell_price', 'current_quantity', 'category_id')
        ->get();

    $categories = Category::select('id', 'name')->get();

    return Inertia::render('Sale/Create', [
        'products' => $products,
        'categories' => $categories,
    ]);
}

  

  public function store(Request $request)
{
$validated = $request->validate([
    'customer_name' => 'required|string|max:255',
    'customer_phone' => 'nullable|string|max:20',
    'payment_method' => 'required|in:cash,cbe,other_bank,telebirr',
    'total_amount' => 'required|numeric|min:0',

    'items' => 'required|array|min:1',
    'items.*.product_id' => 'required|exists:products,id',
    'items.*.quantity' => 'required|integer|min:1',
    'items.*.unit_price' => 'required|numeric|min:0',
]);

    return DB::transaction(function () use ($validated) {

       $sale = Sale::create([
    'user_id' => auth()->id(),
    'customer_name' => $validated['customer_name'],
    'customer_phone' => $validated['customer_phone'],
    'payment_method' => $validated['payment_method'],
    'total_amount' => $validated['total_amount'],
    'status' => 'completed',
]);

        $total = 0;

        foreach ($validated['items'] as $item) {

            $product = Product::findOrFail($item['product_id']);

            if ($product->current_quantity < $item['quantity']) {
                throw new \Exception("Not enough stock for {$product->name}");
            }

            $subtotal = $item['quantity'] * $item['unit_price'];

   $sale->items()->create([
    'product_id' => $item['product_id'],
    'quantity' => $item['quantity'],
    'unit_cost' => $product->unit_buy_price,
    'unit_price' => $item['unit_price'],
    'subtotal' => $subtotal,
    'profit' => $subtotal - ($product->unit_buy_price * $item['quantity']),
]);

            $product->decrement('current_quantity', $item['quantity']);

            $total += $subtotal;
        }

        $sale->update(['total_amount' => $total]);

        return redirect()->route('sales.index');
    });
}
               
    public function show(Sale $sale)
    {
        $sale->load(['employee', 'items.product']);
        return Inertia::render('Sale/Show', ['sale' => $sale]);
    }

    public function destroy(Sale $sale)
    {
        try {
            DB::transaction(function () use ($sale) {
                foreach ($sale->items as $item) {
                    $item->product->increment('current_quantity', $item->quantity);
                }
                $sale->update(['status' => 'cancelled']);
            });

            // FIX: Using redirect() instead of Inertia::location to avoid the method error
            return redirect()->route('sales.index')->with('success', 'Sale cancelled successfully!');

        } catch (\Exception $e) {
            return back()->withErrors(['general' => 'Failed to delete: ' . $e->getMessage()]);
        }
    }
}