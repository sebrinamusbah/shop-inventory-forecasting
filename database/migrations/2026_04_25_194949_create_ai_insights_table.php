<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_insights', function (Blueprint $table) {
            $table->id();

            // ======================
            // RELATION
            // ======================
            $table->foreignId('product_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            // ======================
            // INSIGHT CLASSIFICATION
            // ======================
            $table->enum('type', [
                'spike',
                'drop',
                'warning',
                'opportunity'
            ]);

            $table->enum('severity', [
                'low',
                'medium',
                'high'
            ])->default('low');

            // ======================
            // AI OUTPUT
            // ======================
            $table->text('message');

            // explanation from AI (WHY this insight was generated)
            $table->text('reasoning')->nullable();

            // confidence score of this insight (0-1 or 0-100)
            $table->decimal('confidence_score', 5, 2)->nullable();

            // raw AI response (LLM or model output)
            $table->json('ai_payload')->nullable();

            // optional structured metadata (risk score, signals, etc.)
            $table->json('metadata')->nullable();

            // ======================
            // TRACKING
            // ======================
            $table->string('model')->nullable(); // e.g. "prophet_v2", "gpt-4"
            $table->timestamp('generated_at')->nullable();

            $table->timestamps();

            // helpful index for dashboard filtering
            $table->index(['product_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_insights');
    }
};