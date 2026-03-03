<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Unit;
use App\Models\Topic;
use App\Models\ContentItem;
use App\Models\StudentProgress;
use App\Models\CourseEnrollment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CourseController extends Controller
{
    // GET /api/courses — tüm kursları listele
    public function index(Request $request): JsonResponse
    {
        $q = Course::with('units:id,course_id,title,sort_order')->where('is_active', true);

        if ($request->filled('subject')) {
            $q->where('subject', $request->subject);
        }
        if ($request->filled('exam_type')) {
            $q->where(function ($query) use ($request) {
                $query->where('exam_type', $request->exam_type)->orWhere('exam_type', 'Genel');
            });
        }
        if ($request->filled('grade')) {
            $q->where(function ($query) use ($request) {
                $query->where('grade', $request->grade)->orWhereNull('grade');
            });
        }

        $courses = $q->orderBy('sort_order')->orderBy('id')->get();

        // Öğrenci için ilerleme bilgisi ekle
        $user = Auth::user();
        if ($user && $user->isStudent()) {
            $enrollments = CourseEnrollment::where('user_id', $user->id)
                ->pluck('completion_percentage', 'course_id');
            $courses = $courses->map(function ($c) use ($enrollments) {
                $c->completion_percentage = $enrollments[$c->id] ?? 0;
                $c->is_enrolled = isset($enrollments[$c->id]);
                return $c;
            });
        }

        return response()->json(['success' => true, 'data' => $courses]);
    }

    // GET /api/courses/{id} — kurs detayı
    public function show(int $id): JsonResponse
    {
        $course = Course::with([
            'units' => function ($q) {
                $q->where('is_active', true)->orderBy('sort_order')->with([
                    'topics' => function ($q2) {
                        $q2->where('is_active', true)->orderBy('sort_order')->with([
                            'contentItems' => function ($q3) {
                                $q3->where('is_active', true)->orderBy('sort_order');
                            }
                        ]);
                    }
                ]);
            }
        ])->where('is_active', true)->findOrFail($id);

        $user = Auth::user();
        if ($user && $user->isStudent()) {
            // Öğrencinin bu kursta hangi içerikleri tamamladığını ekle
            $progressMap = StudentProgress::where('user_id', $user->id)
                ->whereHas('contentItem', fn($q) => $q->whereHas('topic', fn($q2) => $q2->whereHas('unit', fn($q3) => $q3->where('course_id', $id))))
                ->pluck('status', 'content_item_id');

            foreach ($course->units as $unit) {
                foreach ($unit->topics as $topic) {
                    foreach ($topic->contentItems as $item) {
                        $item->progress_status = $progressMap[$item->id] ?? 'not_started';
                    }
                }
            }
        }

        return response()->json(['success' => true, 'data' => $course]);
    }

    // POST /api/courses/{id}/enroll
    public function enroll(int $id): JsonResponse
    {
        $user = Auth::user();
        $course = Course::where('is_active', true)->findOrFail($id);

        $enrollment = CourseEnrollment::firstOrCreate(
            ['user_id' => $user->id, 'course_id' => $id],
            ['enrolled_at' => now()]
        );

        return response()->json([
            'success' => true,
            'message' => 'Kursa kaydolundu',
            'enrollment' => $enrollment,
        ]);
    }

    // POST /api/progress — içerik ilerlemesi güncelle
    public function updateProgress(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'content_item_id'   => 'required|integer|exists:content_items,id',
            'status'            => 'required|in:in_progress,completed',
            'watch_seconds'     => 'sometimes|integer|min:0',
            'marked_understood' => 'sometimes|boolean',
            'needs_repeat'      => 'sometimes|boolean',
        ]);
        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        $user = Auth::user();
        $data = $v->validated();

        $progress = StudentProgress::updateOrCreate(
            ['user_id' => $user->id, 'content_item_id' => $data['content_item_id']],
            array_merge($data, [
                'completed_at' => $data['status'] === 'completed' ? now() : null,
            ])
        );

        // Kurs tamamlanma yüzdesini güncelle
        $item = ContentItem::find($data['content_item_id']);
        if ($item) {
            $this->recalculateCourseCompletion($user->id, $item->topic->unit->course_id);
        }

        return response()->json(['success' => true, 'progress' => $progress]);
    }

    // GET /api/courses/{id}/progress
    public function progress(int $courseId): JsonResponse
    {
        $user = Auth::user();
        $enrollment = CourseEnrollment::where('user_id', $user->id)
            ->where('course_id', $courseId)->first();

        if (!$enrollment) {
            return response()->json(['success' => true, 'completion_percentage' => 0, 'enrolled' => false]);
        }

        return response()->json([
            'success' => true,
            'enrolled' => true,
            'completion_percentage' => $enrollment->completion_percentage,
            'enrolled_at' => $enrollment->enrolled_at,
        ]);
    }

    // -------------------------------------------------------
    private function recalculateCourseCompletion(int $userId, int $courseId): void
    {
        $totalItems = ContentItem::whereHas('topic.unit', fn($q) => $q->where('course_id', $courseId))
            ->where('is_active', true)->count();

        if ($totalItems === 0) return;

        $completedItems = StudentProgress::where('user_id', $userId)
            ->where('status', 'completed')
            ->whereHas('contentItem.topic.unit', fn($q) => $q->where('course_id', $courseId))
            ->count();

        CourseEnrollment::updateOrCreate(
            ['user_id' => $userId, 'course_id' => $courseId],
            ['completion_percentage' => round(($completedItems / $totalItems) * 100, 2)]
        );
    }
}
