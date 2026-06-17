<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:units,name',
            'symbol' => 'nullable|string|max:10',
        ]);

        $unit = Unit::create([
            'name' => $request->name,
            'symbol' => $request->symbol,
        ]);

        return response()->json($unit, 201);
    }
}