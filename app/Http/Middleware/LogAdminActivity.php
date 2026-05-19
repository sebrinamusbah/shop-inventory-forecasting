<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class LogAdminActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $user = $request->user();

        if (! $user || ! $request->route()) {
            return $response;
        }

        $routeName = $request->route()->getName();
        $routePath = $request->route()->uri();
        $method = strtoupper($request->method());

        // Don't log the destructive clear action or plain GET views by default.
        if ($routeName === 'activity-logs.destroy') {
            return $response;
        }

        // Only record non-GET (mutating) requests by default to avoid noisy "Viewed" entries.
        if ($method === 'GET') {
            return $response;
        }

        $action = $method;
        $label = $routeName
            ? Str::headline(str_replace('.', ' ', $routeName))
            : Str::headline(trim($routePath, '/'));

        activity('admin')
            ->causedBy($user)
            ->withProperties([
                'method' => $method,
                'route' => '/' . ltrim($routePath, '/'),
                'ip_address' => $request->ip(),
                'status_code' => $response->getStatusCode(),
                'user_agent' => $request->userAgent(),
            ])
            ->log($action . ' ' . $label);

        return $response;
    }
}
