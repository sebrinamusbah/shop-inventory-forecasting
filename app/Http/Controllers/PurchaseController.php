<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Product;
use App\Models\Supplier; 
use App\Models\Category;
use Inertia\Inertia;

class PurchaseController extends Controller
{
   public function index(Request $request)
{
    // 1. Start the query with relationships needed for the "pretty" UI and item tooltips
    $query = Purchase::with(['supplier', 'items.product']);

    // 2. Check if the user clicked the "Credit Ledger" button
    if ($request->get('filter') === 'credit') {
        $query->where('payment_method', 'Credit')
              ->orderBy('due_date', 'asc'); // Real-world priority: pay soonest first
    } else {
        $query->latest();
    }

    // 3. Return data along with the current filter state so the button knows its color
    return Inertia::render('Purchases/Index', [
        'purchases' => $query->get(),
        'filters'   => $request->only(['filter']),
    ]);
}

    public function create()
    {
        return Inertia::render('Purchases/Create', [
            'products' => Product::all(),
            'suppliers' => Supplier::all(),
            'categories' => Category::all(),
            'paymentMethods' => Purchase::PAYMENT_METHODS,
        ]);
    }

    public function getProductsByCategory($categoryId)
    {
        $products = Product::where('category_id', $categoryId)->get();
        return response()->json($products);
    }

   public function store(Request $request)
{
    // 1. Improved validation
    $validated = $request->validate([
        'supplier_id'    => 'required|exists:suppliers,id',
        'payment_method' => 'required|string', // Added validation
        'due_date'       => 'nullable|date',    // Added validation
        'items'          => 'required|array|min:1',
        'items.*.id'     => 'required|exists:products,id',
        'items.*.quantity' => 'required|numeric|min:1', 
        'items.*.unit_cost' => 'required|numeric|min:0',
        'items.*.sale_price' => 'required|numeric|min:0',
    ]);

    try {
        DB::beginTransaction();

        $supplier = Supplier::find($request->supplier_id);
        $invoiceNo = 'PUR-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4));

        $purchase = Purchase::create([
            'invoice_no'     => $invoiceNo,
            'user_id'        => Auth::id(),
            'supplier_id'    => $request->supplier_id,
            'supplier_name'  => $supplier->name ?? 'Unknown Supplier', 
            'purchase_date'  => now(),
            'payment_method' => $request->payment_method,
            'due_date'       => $request->due_date,
            'status'         => 'Completed',
            'total_cost'     => 0, 
        ]);

        $totalPurchaseCost = 0;

        foreach ($request->items as $item) {
            $product = Product::find($item['id']);
            
            // Cast to numeric values to avoid string calculation issues
            $qty = (float)$item['quantity'];
            $unitCost = (float)$item['unit_cost'];
            $salePrice = (float)$item['sale_price'];
            
            $subtotal = $qty * $unitCost;
            $totalPurchaseCost += $subtotal;

            // Save Historical Data for this specific purchase
            PurchaseItem::create([
                'purchase_id' => $purchase->id,
                'product_id'  => $item['id'],
                'quantity'    => $qty,
                'unit_cost'   => $unitCost,
                'subtotal'    => $subtotal,
            ]);

            // --- STEP 5: SYNC TO MASTER PRODUCT ---
            // We update the master product record to reflect the NEW stock level and prices
            $product->update([
                'unit_buy_price'   => $unitCost,
              'unit_sell_price'  => $salePrice,
                'current_quantity' => $product->current_quantity + $qty
            ]);
        }

        // Update total cost after loop
        $purchase->update(['total_cost' => $totalPurchaseCost]);

        DB::commit();
        return redirect()->route('purchases.index')
            ->with('success', 'Purchase recorded. Prices and stock synced successfully.');

    } catch (\Exception $e) {
        DB::rollback();
        \Log::error('Purchase Store Error: ' . $e->getMessage());
        return back()->withErrors(['error' => 'Failed to save: ' . $e->getMessage()]);
    }
}

    public function show(Purchase $purchase)
    {
        $purchase->load(['items.product', 'supplier']); 

        return Inertia::render('Purchases/Show', [
            'purchase' => $purchase
        ]);
    }

public function destroy(Purchase $purchase)
{
    // Safety check: Don't process if already cancelled
    if ($purchase->status === 'Returned') {
    return back()->withErrors(['error' => 'This purchase has already been returned.']);
}

    try {
        DB::beginTransaction();

        // 1. Loop through items and REVERSE the stock increment
        foreach ($purchase->items as $item) {
            $product = Product::find($item->product_id);
            if ($product) {
                // Since 'Completed' added stock, 'Cancelled' must remove it
                $product->decrement('current_quantity', $item->quantity);
            }
        }

        // 2. Update status to 'Cancelled' instead of deleting the record
       $purchase->update([
    'status' => 'Returned'
]);

        DB::commit();

       return redirect()->route('purchases.index')->with('success', 'Purchase marked as Returned and stock reversed successfully.');

    } catch (\Exception $e) {
        DB::rollback();
        \Log::error('Purchase Cancellation Error: ' . $e->getMessage());
        return back()->withErrors(['error' => 'Failed to cancel purchase: ' . $e->getMessage()]);
    }
}
public function updatePaymentStatus(Request $request, $id)
{
    // 1. Validate that the payment method is one of your allowed options
    $request->validate([
        'payment_method' => 'required|string',
    ]);

    // 2. Find the specific purchase using the ID from the URL
    $purchase = \App\Models\Purchase::findOrFail($id);

    // 3. Update the 'payment_method' column with the value from your dropdown
    $purchase->update([
        'payment_method' => $request->payment_method
    ]);

    // 4. Return back to the page with a success message
    return back()->with('message', 'Payment method updated to ' . $request->payment_method);
}

}