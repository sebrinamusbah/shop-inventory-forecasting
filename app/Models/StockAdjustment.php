<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\RecordsActivity;

class StockAdjustment extends Model
{
    use RecordsActivity;

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

