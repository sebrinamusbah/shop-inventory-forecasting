<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Concerns\RecordsActivity;

class Purchase extends Model
{
    use RecordsActivity;

    protected $fillable = [
        'user_id',
        'supplier_id',
        'supplier_name',
        'purchase_date',
        'invoice_no',
        'payment_method',
        'due_date',
        'unit_sell_price',
        'total_cost',
        'status'
    ];

    /**
     * Step 4: Payment Method definitions for the "Pretty" UI
     * This matches the style seen in your Sales section.
     */
    public const PAYMENT_METHODS = [
        'Cash'       => ['label' => 'Cash', 'icon' => '💵'],
        'CBE'        => ['label' => 'CBE (Commercial Bank of Ethiopia)', 'icon' => '🏦'],
        'Telebirr'   => ['label' => 'Telebirr', 'icon' => '📱'],
        'Other Bank' => ['label' => 'Other Bank', 'icon' => '🏛️'],
        'Credit'     => ['label' => 'Credit', 'icon' => '📅'],
    ];

    /**
     * Appends the display info so the frontend can easily access
     * the icon and full label.
     */
    protected $appends = ['payment_method_display'];

    public function getPaymentMethodDisplayAttribute()
    {
        return self::PAYMENT_METHODS[$this->payment_method] ?? ['label' => 'Other', 'icon' => '💰'];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
