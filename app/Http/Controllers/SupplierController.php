<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SupplierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Suppliers/Index', [
            'suppliers' => Supplier::all()
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return inertia('Suppliers/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            // Regex allows numbers, spaces, dashes, and a leading +
            'phone' => 'nullable|regex:/^([0-9\s\-\+\(\)]*)$/|min:10',
            'tin_number' => 'nullable|numeric|unique:suppliers,tin_number',
            'account_number' => 'nullable|numeric|unique:suppliers,account_number',
            'address' => 'nullable|string',
        ], [
            'phone.regex' => 'The phone number format is invalid.',
            'tin_number.numeric' => 'The TIN number must contain only digits.',
            'account_number.numeric' => 'The account number must contain only digits.',
        ]);

        Supplier::create($validated);

        return redirect()->route('suppliers.index')->with('success', 'Supplier added successfully!');
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

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|regex:/^([0-9\s\-\+\(\)]*)$/|min:10',
            'tin_number' => [
                'nullable',
                'numeric',
                Rule::unique('suppliers', 'tin_number')->ignore($supplier->id),
            ],
            'account_number' => [
                'nullable',
                'numeric',
                Rule::unique('suppliers', 'account_number')->ignore($supplier->id),
            ],
            'address' => 'nullable|string',
        ], [
            'phone.regex' => 'The phone number format is invalid.',
        ]);

        $supplier->update($validated);

        return redirect()->route('suppliers.index')->with('success', 'Supplier updated!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Supplier $supplier)
    {
        $supplier->delete();

        return redirect()->route('suppliers.index')->with('success', 'Supplier deleted!');
    }

    public function storeQuick(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'nullable|email|max:255',
        'phone' => 'nullable|string|max:20',
        'tin_number' => 'nullable|string|max:50',
        'account_number' => 'nullable|string|max:50',
        'address' => 'nullable|string',
    ]);

    $supplier = Supplier::create($validated);

    return response()->json([
        'success' => true,
        'supplier' => $supplier
    ]);
}

}