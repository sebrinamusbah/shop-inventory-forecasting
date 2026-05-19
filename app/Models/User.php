<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Concerns\RecordsActivity;
use Spatie\Permission\Traits\HasRoles; // Spatie Role/Permission trait

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles, RecordsActivity;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'status',
        'last_activity',
        'must_reset_password',
    ];

    /**
     * The attributes that should be hidden for arrays.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
         'password' => 'hashed',
        'email_verified_at' => 'datetime',
        'last_activity' => 'datetime',
        'must_reset_password' => 'boolean',
    ];


    /**
     * Automatically hash password when set
     */

}
