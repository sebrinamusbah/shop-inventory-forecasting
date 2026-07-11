<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = Activity::query()->with(['causer'])->latest();

        // By default only show entries in the 'admin' log and exclude GET/view events
        // Use `?show=all` to view across all logs (for debugging).
        if ($request->query('show') === 'all') {
            // keep $query as-is (all logs)
        } else {
    $query->inLog('admin');

    // Support PostgreSQL (Neon) and MySQL
   if (DB::connection()->getDriverName() === 'pgsql') {
    $query->where(function ($q) {
        $q->whereNull('properties->>method')
          ->orWhereRaw("properties->>'method' != ?", ['GET']);
    });
} else {
    $query->whereRaw("json_extract(properties, '$.method') != ?", ['GET']);
}
}

        $activities = $query->paginate(25)->through(function (Activity $activity) {
                $properties = $activity->properties?->toArray() ?? [];

                return [
                    'id' => $activity->id,
                    'description' => $activity->description,
                    'user_name' => $activity->causer?->name ?? ($properties['user_name'] ?? 'System'),
                    'method' => $properties['method'] ?? '-',
                    'route' => $properties['route'] ?? '-',
                    'ip_address' => $properties['ip_address'] ?? '-',
                    'created_at' => optional($activity->created_at)?->format('M d, Y h:i A'),
                    'time_ago' => optional($activity->created_at)?->diffForHumans(),
                ];
            });

        return Inertia::render('ActivityLogs/Index', [
            'activities' => $activities,
        ]);
    }

    public function destroy(): RedirectResponse
    {
        Activity::query()->inLog('admin')->delete();

        return redirect()->route('activity-logs.index')->with('success', 'Activity log cleared successfully.');
    }
}
