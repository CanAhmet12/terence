<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'error'   => true,
                'code'    => 'UNAUTHENTICATED',
                'message' => 'Bu işlem için giriş yapmanız gerekiyor',
            ], 401);
        }

        if (!in_array($user->role, $roles)) {
            return response()->json([
                'error'   => true,
                'code'    => 'FORBIDDEN',
                'message' => 'Bu işlem için yetkiniz yok',
            ], 403);
        }

        return $next($request);
    }
}
