<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            // Category relation
            $table->foreignId('category_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

                 // unit relation
           $table->foreignId('unit_id')
        ->nullable()
        ->constrained()
        ->nullOnDelete();

            // Product identity
            $table->string('name');
            $table->string('sku')->unique();

          

            // Inventory tracking (CORE)
            $table->integer('current_quantity')->default(0);
            $table->integer('min_stock_level')->default(0);

            //  Pricing (CORE for profit AI)
            $table->decimal('unit_buy_price', 10, 2);
            $table->decimal('unit_sell_price', 10, 2);

            // AI / Analytics tracking
            $table->integer('total_sold_quantity')->default(0);
            $table->timestamp('last_sold_at')->nullable();

            //  Status
            $table->boolean('is_active')->default(true);

            // System fields
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};