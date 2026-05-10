<?php

namespace App\Http\Middleware;

use App\Models\SystemSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MaintenanceModeExceptAdmin
{
    /**
     * Bakım modundayken yalnızca admin API kullanımına izin verir.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! SystemSetting::maintenanceEnabled()) {
            return $next($request);
        }

        $user = $request->user();
        if ($user && $user->role === 'admin') {
            return $next($request);
        }

        return response()->json([
            'error' => [
                'code'    => 'MAINTENANCE_MODE',
                'message' => 'Sistem şu anda bakımda. Lütfen daha sonra tekrar deneyin.',
            ],
        ], 503);
    }
}
