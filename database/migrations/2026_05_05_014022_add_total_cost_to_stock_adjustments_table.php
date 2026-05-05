<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
      Schema::table('stock_adjustments', function (Blueprint $table) {
        // Adding the missing column after 'quantity'
        $table->decimal('total_cost', 10, 2)->default(0)->after('quantity');
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_adjustments', function (Blueprint $table) {
            //
        });
    }
};
