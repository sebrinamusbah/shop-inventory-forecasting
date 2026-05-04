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
            // FORECAST INFO
            // ======================
            $table->enum('forecast_type', ['7d', '30d', '90d']);

            $table->integer('predicted_demand');

            $table->decimal('confidence_score', 5, 2)->nullable();

            // how accurate this prediction was (filled later)
            $table->decimal('accuracy_score', 5, 2)->nullable();

            // error margin of prediction
            $table->decimal('error_margin', 8, 2)->nullable();

            // ======================
            // ACTIONS
            // ======================
            $table->text('recommended_action')->nullable();

            // ======================
            // TIME RANGE
            // ======================
            $table->date('forecast_start');
            $table->date('forecast_end');

            // ======================
            // AI / ML METADATA
            // ======================

            // model used (Prophet, LSTM, etc.)
            $table->string('model')->nullable();

            // model version (important for tracking improvements)
            $table->string('model_version')->nullable();

            // raw prediction output (future-proofing)
            $table->json('ai_payload')->nullable();

            // explanation from AI (why prediction was made)
            $table->text('explanation')->nullable();

            // features used for prediction (optional but powerful for retraining)
            $table->json('features_used')->nullable();

            // when prediction was generated
            $table->timestamp('generated_at')->nullable();

            $table->timestamps();

            // helpful index for analytics
            $table->index(['product_id', 'forecast_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_predictions');
    }
};