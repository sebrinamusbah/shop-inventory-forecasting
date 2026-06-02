<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Configuration\Exceptions;
use Inertia\Inertia;

use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
// Add Spatie's specific exception package here
use Spatie\Permission\Exceptions\UnauthorizedException; 

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
          api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Register Spatie middleware aliases correctly
        $middleware->alias([
            'permission' => PermissionMiddleware::class,
            'role' => RoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Catch Spatie's Role/Permission unauthorized restrictions
        $exceptions->render(function (UnauthorizedException $e, $request) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'This action is unauthorized.'], 403);
            }

            // Force it to load your clean custom component page
            return Inertia::render('Errors/403')->toResponse($request)->setStatusCode(403);
        });
    })
    ->create();