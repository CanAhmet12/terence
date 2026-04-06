<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     * 
     * Supports multiple roles passed as comma-separated string or variadic parameters.
     * Usage: ->middleware('role:admin,teacher') or ->middleware('role:admin')
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles  One or more roles to check against
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // Check if user is authenticated
        if (!auth()->check()) {
            return response()->json([
                'error' => [
                    'code' => 'UNAUTHORIZED',
                    'message' => 'Giriş yapmanız gerekiyor'
                ]
            ], 401);
        }

        $user = auth()->user();
        
        // Check if user is suspended
        if ($user->suspended_at && (!$user->suspended_until || now()->lessThan($user->suspended_until))) {
            return response()->json([
                'error' => [
                    'code' => 'ACCOUNT_SUSPENDED',
                    'message' => 'Hesabınız askıya alınmıştır',
                    'details' => $user->suspension_reason ?? 'Hesabınız yönetici tarafından askıya alınmıştır'
                ]
            ], 403);
        }
        
        // Flatten roles if they were passed as comma-separated string
        $allowedRoles = collect($roles)
            ->flatMap(fn($role) => explode(',', $role))
            ->map(fn($role) => trim($role))
            ->filter()
            ->unique()
            ->values()
            ->toArray();
        
        // Check if user has any of the required roles
        if (!in_array($user->role, $allowedRoles, true)) {
            return response()->json([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Bu işlem için yetkiniz bulunmuyor',
                    'required_roles' => $allowedRoles,
                    'your_role' => $user->role
                ]
            ], 403);
        }

        return $next($request);
    }
}