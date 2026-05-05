<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SupplierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
  public function index()
{
    return \Inertia\Inertia::render('Suppliers/Index', [
        'suppliers' => \App\Models\Supplier::all()
    ]);
}

    /**
     * Show the form for creating a new resource.
     */
   public function create()
{
    // This will point to the "Add Supplier" form we will build next
    return inertia('Suppliers/Create');
}

    /**
     * Store a newly created resource in storage.
     */
   public function store(\Illuminate\Http\Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'nullable|email',
        'phone' => 'nullable|string',
        'tin_number' => 'nullable|string|unique:suppliers,tin_number',
        'account_number' => 'nullable|string|unique:suppliers,account_number',
        'address' => 'nullable|string',
    ]);

    \App\Models\Supplier::create($validated);

    return redirect()->route('suppliers.index')->with('success', 'Supplier added successfully!');
}

    /**
     * Display the specified resource.
     */
    public function show(Supplier $supplier)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Supplier $supplier)
{
    return inertia('Suppliers/Edit', [
        'supplier' => $supplier
    ]);
}

public function update(Request $request, Supplier $supplier)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'nullable|email',
        'phone' => 'nullable|string',
        'tin_number' => [
            'nullable',
            'string',
            Rule::unique('suppliers', 'tin_number')->ignore($supplier->id),
        ],
        'account_number' => [
            'nullable',
            'string',
            Rule::unique('suppliers', 'account_number')->ignore($supplier->id),
        ],
        'address' => 'nullable|string',
    ]);

    $supplier->update($validated);

    return redirect()->route('suppliers.index')->with('success', 'Supplier updated!');
}

public function destroy(Supplier $supplier)
{
    $supplier->delete();

    return redirect()->route('suppliers.index')->with('success', 'Supplier deleted!');
}
}
