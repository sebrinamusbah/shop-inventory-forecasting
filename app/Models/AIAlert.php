<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AIAlert extends Model
{
    protected $table = 'ai_alerts';

    protected $fillable = [
        'product_id',
        'product_name',
        'alert_type',
        'alert_message',
        'priority',
        'is_resolved',
    ];
}