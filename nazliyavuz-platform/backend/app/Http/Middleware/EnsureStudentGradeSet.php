<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStudentGradeSet
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (
            $user
            && $user->isStudent()
            && !$user->hasLearningScope()
        ) {
            return new JsonResponse([
                'error' => [
                    'code' => 'GRADE_REQUIRED',
                    'message' => 'Öğrenci hesabı için sınıf bilgisi zorunludur.',
                ],
            ], 422);
        }

        return $next($request);
    }
}
