<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends Controller
{
    public function index()
    {
        $activities = Activity::query()
            ->with(['causer'])
            ->inLog('admin')
            ->latest()
            ->paginate(25)
            ->through(function (Activity $activity) {
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
