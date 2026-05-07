<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassRoom;
use App\Models\DailyPlan;
use App\Models\PlanTask;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class TeacherPlanController extends Controller
{
    /**
     * POST /api/teacher/classes/{classId}/plan-tasks
     * Sınıftaki öğrencilere (veya seçilenlere) belirli güne görev paketi yazar.
     */
    public function assignClassPlanTasks(Request $request, int $id): JsonResponse
    {
        $teacher = Auth::user();
        $class = ClassRoom::where('teacher_id', $teacher->id)->findOrFail($id);

        $v = Validator::make($request->all(), [
            'plan_date' => 'required|date',
            'tasks' => 'required|array|min:1|max:50',
            'tasks.*.title' => 'required|string|max:255',
            'tasks.*.type' => 'sometimes|in:video,question,exam,read,repeat,custom',
            'tasks.*.subject' => 'sometimes|nullable|string|max:120',
            'tasks.*.planned_minutes' => 'sometimes|integer|min:5|max:480',
            'tasks.*.priority' => 'sometimes|in:low,normal,high',
            'tasks.*.kazanim_code' => 'sometimes|nullable|string|max:30',
            'student_ids' => 'sometimes|array|max:200',
            'student_ids.*' => 'integer|exists:users,id',
            'client_batch_id' => 'sometimes|nullable|uuid',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        $planDate = Carbon::parse($request->input('plan_date'))->toDateString();
        $batchId = $request->input('client_batch_id') ?: (string) Str::uuid();
        $taskPayloads = $v->validated()['tasks'];

        $classStudentIds = $class->students()->pluck('id')->all();
        if ($classStudentIds === []) {
            return response()->json(['error' => true, 'message' => 'Sınıfta öğrenci yok.'], 422);
        }

        $requestedIds = $request->input('student_ids');
        if (is_array($requestedIds) && $requestedIds !== []) {
            $targetIds = array_values(array_intersect($classStudentIds, array_map('intval', $requestedIds)));
            if ($targetIds === []) {
                return response()->json(['error' => true, 'message' => 'Seçilen öğrenciler bu sınıfa ait değil.'], 422);
            }
        } else {
            $targetIds = $classStudentIds;
        }

        $created = 0;
        DB::transaction(function () use ($planDate, $batchId, $taskPayloads, $targetIds, $teacher, $class, &$created) {
            foreach ($targetIds as $studentId) {
                $student = User::where('id', $studentId)->where('role', 'student')->first();
                if (!$student) {
                    continue;
                }

                $plan = DailyPlan::firstOrCreate(
                    ['user_id' => $studentId, 'plan_date' => $planDate],
                    ['status' => 'active']
                );

                PlanTask::query()
                    ->where('daily_plan_id', $plan->id)
                    ->where('teacher_batch_id', $batchId)
                    ->delete();

                $order = 0;
                foreach ($taskPayloads as $row) {
                    PlanTask::create([
                        'daily_plan_id' => $plan->id,
                        'user_id' => $studentId,
                        'source' => 'teacher',
                        'assigned_by_user_id' => $teacher->id,
                        'class_room_id' => $class->id,
                        'teacher_batch_id' => $batchId,
                        'student_editable' => false,
                        'requirement' => 'required',
                        'title' => $row['title'],
                        'type' => $row['type'] ?? 'custom',
                        'subject' => $row['subject'] ?? null,
                        'planned_minutes' => $row['planned_minutes'] ?? 30,
                        'priority' => $row['priority'] ?? 'normal',
                        'kazanim_code' => $row['kazanim_code'] ?? null,
                        'sort_order' => $order++,
                        'is_completed' => false,
                    ]);
                    $created++;
                }

                $plan->syncTaskCounts();
                if ($plan->status === 'completed' && $plan->completed_tasks < $plan->total_tasks) {
                    $plan->update(['status' => 'active']);
                }
            }
        });

        return response()->json([
            'success' => true,
            'teacher_batch_id' => $batchId,
            'students_affected' => count($targetIds),
            'tasks_created' => $created,
        ], 201);
    }
}
