<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_predictions', function (Blueprint $table) {
            // Add avg_daily_demand column after predicted_demand if it doesn't exist
            if (!Schema::hasColumn('ai_predictions', 'avg_daily_demand')) {
                $table->decimal('avg_daily_demand', 10, 2)->nullable()->after('predicted_demand');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ai_predictions', function (Blueprint $table) {
            if (Schema::hasColumn('ai_predictions', 'avg_daily_demand')) {
                $table->dropColumn('avg_daily_demand');
            }
        });
    }
};
