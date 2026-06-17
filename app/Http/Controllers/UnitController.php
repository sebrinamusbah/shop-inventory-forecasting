<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use Illuminate\Http\Request;

class UnitController extends Controller
{
public function store(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|unique:units,name',
        'symbol' => 'nullable|string|max:10',
    ]);

    $unit = Unit::create($validated);

    return response()->json($unit, 201);
}
}