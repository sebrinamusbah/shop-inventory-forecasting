<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AIPrediction extends Model
{
    protected $table = 'ai_predictions';

    protected $fillable = [
        'product_id',
        'product_name',
        'predicted_demand',
        'current_quantity',
        'confidence_score',
        'recommended_action',
        'risk_score',
        'trend',
        'forecast_start',
        'forecast_end',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}