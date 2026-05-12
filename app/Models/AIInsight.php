<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AIInsight extends Model
{
    protected $table = 'ai_insights';

    protected $fillable = [
        'product_id',
        'product_name',
        'insight_type',
        'severity',
        'message',
        'reason_summary',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}