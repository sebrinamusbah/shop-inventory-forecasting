<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\RecordsActivity;
use App\Models\PurchaseItem;
use App\Models\Category;
use App\Models\Unit;

class Product extends Model
{
    use SoftDeletes, HasFactory, RecordsActivity;

    protected $fillable = [
        'category_id',
        'unit_id',
        'name',
        'sku',
        'current_quantity',
        'unit_buy_price',
        'unit_sell_price',
        'tax_rate',
        'min_stock_level',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'tax_rate' => 'float',
    ];

    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }
}