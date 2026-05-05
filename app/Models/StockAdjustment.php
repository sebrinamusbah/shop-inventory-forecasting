<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
    
class StockAdjustment extends Model
{
 protected $fillable = [
    'product_id',
    'category_id',
    'type',
    'quantity',
    'total_cost',
    'previous_stock',
    'new_stock',
    'note',
];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}

