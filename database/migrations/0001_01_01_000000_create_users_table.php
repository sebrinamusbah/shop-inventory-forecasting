<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
               $table->timestamp('email_verified_at')->nullable(); 
            $table->string('password');
$table->string('status')->default('active');
            $table->timestamp('last_activity')->nullable();
            $table->boolean('must_reset_password')->default(true);
            $table->rememberToken(); // creates remember_token VARCHAR(100) NULL
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};