<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    use HasFactory;

  protected $fillable = [
    'sale_id',
    'product_id',
    'quantity',
    'unit_price',
    'unit_cost',
    'subtotal',
    'profit',
];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'profit' => 'decimal:2',
    ];

    // A sale item belongs to a sale
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    // A sale item belongs to a product
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}