<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseItem extends Model
{
    protected $fillable = [
        'purchase_id',
        'product_id',
        'quantity',
        'unit_cost',
        'subtotal'
    ];

    // Each item in the list belongs to one specific product 
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Each purchase item belongs to a purchase
    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }
}