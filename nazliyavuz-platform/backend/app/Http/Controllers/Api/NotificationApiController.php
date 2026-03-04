<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class NotificationApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user    = Auth::user();
        $perPage = (int) $request->query('per_page', 20);
        $page    = (int) $request->query('page', 1);
        $offset  = ($page - 1) * $perPage;

        $total = DB::table('notifications')->where('user_id', $user->id)->count();

        $rows = DB::table('notifications')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit($perPage)
            ->offset($offset)
            ->get();

        $data = $rows->map(function ($n) {
            $payload = is_string($n->payload) ? json_decode($n->payload, true) : (array)$n->payload;
            return [
                'id'         => $n->id,
                'type'       => $n->type,
                'title'      => $payload['title'] ?? $n->type,
                'body'       => $payload['body'] ?? $payload['message'] ?? '',
                'message'    => $payload['body'] ?? $payload['message'] ?? '',
                'is_read'    => !is_null($n->read_at),
                'created_at' => $n->created_at,
            ];
        })->values();

        return response()->json([
            'data'         => $data,
            'current_page' => $page,
            'last_page'    => max(1, (int) ceil($total / $perPage)),
            'total'        => $total,
            'per_page'     => $perPage,
        ]);
    }

    public function markAsRead(int $id): JsonResponse
    {
        $user = Auth::user();
        DB::table('notifications')
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->update(['read_at' => now()]);
        return response()->json(['message' => 'Okundu olarak isaretlendi']);
    }

    public function markAllRead(): JsonResponse
    {
        $user = Auth::user();
        DB::table('notifications')
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        return response()->json(['message' => 'Tumu okundu olarak isaretlendi']);
    }

    public function destroy(int $id): JsonResponse
    {
        $user    = Auth::user();
        $deleted = DB::table('notifications')
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->delete();

        if (!$deleted) {
            return response()->json(['error' => true, 'message' => 'Bildirim bulunamadi'], 404);
        }
        return response()->json(['success' => true, 'message' => 'Bildirim silindi']);
    }
}
