<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
       'user_id', 
        'customer_name',
        'customer_phone', 
        'total_amount', 
        'total_profit',
        'payment_method', 
        'sale_date',
        'status'
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'sale_date' => 'datetime',
    ];

    // A sale has many sale items
    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    // A sale belongs to a user (employee)
    public function employee()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}