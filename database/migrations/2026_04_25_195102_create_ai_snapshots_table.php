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
            // CORE BUSINESS METRICS
            // ======================
            $table->decimal('total_sales', 12, 2)->default(0);
            $table->decimal('total_profit', 12, 2)->default(0);

            $table->foreignId('top_product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();

            $table->integer('low_stock_count')->default(0);

            $table->enum('sales_trend', ['up', 'down', 'stable'])->nullable();

            // ======================
            // AI METADATA (IMPORTANT)
            // ======================

            // model used for generating snapshot (Prophet, LSTM, etc.)
            $table->string('model')->nullable();

            // confidence of overall snapshot prediction
            $table->decimal('confidence_score', 5, 2)->nullable();

            // full raw AI output (flexible future-proof storage)
            $table->json('ai_payload')->nullable();

            // optional notes from AI system / explanation
            $table->text('insight_summary')->nullable();

            // ======================
            // AUDIT / TRACKING
            // ======================
            $table->timestamps();

            // prevent duplicate snapshots per day
            $table->unique('snapshot_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_snapshots');
    }
};