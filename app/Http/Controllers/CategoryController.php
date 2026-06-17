<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index()
    {
        return Inertia::render('Categories/Index', [
            'categories' => Category::latest()
                ->paginate(10)
                ->withQueryString()
        ]);
    }

    // CREATE (for Product page AJAX + normal use)
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:categories,name',
        ]);

        $category = Category::create([
            'name' => $request->name,
        ]);

        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category)
    {
        $request->validate([
            'name' => 'required|string',
        ]);

        $category->update([
            'name' => $request->name,
        ]);

        return back();
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return back();
    }
}