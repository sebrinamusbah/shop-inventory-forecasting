<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_predictions', function (Blueprint $table) {
            $table->id();

            // ======================
            // RELATION
            // ======================
            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            // ======================
            // PRODUCT INFO (DENORMALIZED for speed)
            // ======================
            $table->string('product_name');

            // ======================
            // FORECAST OUTPUT
            // ======================
            $table->integer('predicted_demand');
            $table->integer('current_stock')->nullable();

            $table->decimal('confidence_score', 5, 2)->nullable();

            // RESTOCK / HOLD / DROP
            $table->string('recommended_action')->nullable();

            $table->decimal('risk_score', 5, 2)->nullable();

            // up / down / stable
            $table->string('trend')->nullable();

            // ======================
            // TIME RANGE
            // ======================
            $table->date('forecast_start');
            $table->date('forecast_end');

           // ======================
            // TIMESTAMP
            // ======================
            
            $table->timestamps();
            // ======================
            // INDEXES (important for dashboard speed)
            // ======================
            $table->index(['product_id']);
            $table->index(['recommended_action']);
            $table->index(['trend']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_predictions');
    }
};