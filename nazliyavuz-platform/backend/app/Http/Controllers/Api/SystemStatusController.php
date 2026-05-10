<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;

class SystemStatusController extends Controller
{
    /**
     * Kimlik doğrulaması gerektirmez; Next.js edge middleware ve istemci için.
     */
    public function publicStatus(): JsonResponse
    {
        return response()
            ->json([
                'maintenance_mode' => SystemSetting::maintenanceEnabled(),
            ])
            ->header('Cache-Control', 'public, max-age=5');
    }
}
