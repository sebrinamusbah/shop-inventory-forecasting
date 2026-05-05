<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_alerts', function (Blueprint $table) {
            $table->id();

            // ======================
            // RELATION
            // ======================
            $table->foreignId('product_id')
            
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            // ======================
            // PRODUCT INFO (DENORMALIZED)
            // ======================
            $table->string('product_name');

            // ======================
            // ALERT DATA
            // ======================

            // low_stock / overstock / demand_spike / restock_needed
            $table->string('alert_type');

            $table->text('alert_message');

            // low / medium / high / critical
            $table->string('priority')->default('low');

            // whether alert is handled or not
            $table->boolean('is_resolved')->default(false);

            // ======================
            // TIMESTAMP
            // ======================
    

            $table->timestamps();

            // ======================
            // INDEXES (important for dashboard speed)
            // ======================
            $table->index(['product_id']);
            $table->index(['alert_type']);
            $table->index(['priority']);
            $table->index(['is_resolved']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_alerts');
    }
};