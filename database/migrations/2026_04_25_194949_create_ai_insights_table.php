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


                $table->unique('product_id');
            // ======================
            // PRODUCT INFO (DENORMALIZED)
            // ======================
            $table->string('product_name');

            // ======================
            // INSIGHT DATA
            // ======================

            // risk / opportunity / trend / warning
            $table->string('insight_type');

            // low / medium / high
            $table->string('severity')->default('low');

            // AI explanation
            $table->text('message');

            // optional short logic summary
            $table->text('reason_summary')->nullable();

            // ======================
            // TIMESTAMP
            // ======================
            
            $table->timestamps();

            // ======================
            // INDEXES
            // ======================
            $table->index(['product_id']);
            $table->index(['insight_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_insights');
    }
};