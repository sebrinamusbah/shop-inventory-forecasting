<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    // This "unlocks" these fields so they can be saved to the database
    protected $fillable = [
        'name',
        'email',
        'phone',
        'tin_number',
        'account_number',
        'address',
        'is_active',
    ];
}
