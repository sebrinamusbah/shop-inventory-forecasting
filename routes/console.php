<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('ai:hourly', function () {
    $python = env('AI_PYTHON_EXECUTABLE', 'python');
    $script = base_path('inventory-ai/run_ai.py');

    $result = Process::run([$python, $script, '--mode', 'hourly']);

    if ($result->failed()) {
        $this->error($result->errorOutput());
        return 1;
    }

    $this->info($result->output());
    return 0;
})->purpose('Run hourly AI predictions and insights');

Artisan::command('ai:daily', function () {
    $python = env('AI_PYTHON_EXECUTABLE', 'python');
    $script = base_path('inventory-ai/run_ai.py');

    $result = Process::run([$python, $script, '--mode', 'daily']);

    if ($result->failed()) {
        $this->error($result->errorOutput());
        return 1;
    }

    $this->info($result->output());
    return 0;
})->purpose('Run daily AI snapshot');

Schedule::command('ai:daily')->everyMinute();
