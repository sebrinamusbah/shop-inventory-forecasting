<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Inertia\Inertia;
use Illuminate\Http\Request;

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

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required'
        ]);

        Category::create($request->all());

        return back();
    }

    public function update(Request $request, Category $category)
    {
        $category->update($request->all());

        return back();
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return back();
    }
}