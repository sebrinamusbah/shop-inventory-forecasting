<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_snapshots', function (Blueprint $table) {
            $table->id();

            // ======================
            // TIME INFO
            // ======================
            $table->date('snapshot_date');

            // ======================
            // BUSINESS METRICS
            // ======================
            $table->decimal('total_sales', 12, 2)->default(0);
            $table->decimal('total_profit', 12, 2)->default(0);

            $table->foreignId('top_product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();

            // optional but useful (denormalized)
            $table->string('top_product_name')->nullable();

            $table->integer('low_stock_count')->default(0);

            // optional upgrade
            $table->integer('out_of_stock_count')->default(0);

            // up / down / stable
            $table->enum('sales_trend', ['up', 'down', 'stable'])->nullable();

            // extra analytics
            $table->integer('total_predictions_count')->default(0);
            $table->integer('critical_alerts_count')->default(0);

            // ======================
            // TIMESTAMP
            // ======================
            
            $table->timestamps();

            // prevent duplicate daily snapshot
            $table->unique('snapshot_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_snapshots');
    }
};