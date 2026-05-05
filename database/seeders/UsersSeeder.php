<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UsersSeeder extends Seeder
{
    public function run()
    {
        // --- Admin Account ---
        $admin = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('Admin@123'),
                'must_reset_password' => false,
            ]
        );

        $admin->assignRole('Admin');

        // --- Employee Account ---
        $employeePassword = 'Employee@123';

        $employee = User::updateOrCreate(
            ['email' => 'employee@example.com'],
            [
                'name' => 'Employee',
                'password' => Hash::make($employeePassword),
                'must_reset_password' => true,
            ]
        );

        $employee->assignRole('Employee');

        $this->command->info("Employee temp password: $employeePassword");
    }
}