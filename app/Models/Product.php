<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\RecordsActivity;

class Product extends Model
{
    use SoftDeletes;
    use HasFactory, RecordsActivity;

    protected $fillable = [
        'category_id',
        'name',
        'sku',
        'current_quantity',
        'unit_buy_price',
        'unit_sell_price',
        'min_stock_level',
        'is_active',
    ];

   // Add this inside your Product class
public function purchaseItems(): \Illuminate\Database\Eloquent\Relations\HasMany
{
    return $this->hasMany(PurchaseItem::class);
}

public function category(): \Illuminate\Database\Eloquent\Relations\BelongsTo
{
    return $this->belongsTo(Category::class);
}
}
