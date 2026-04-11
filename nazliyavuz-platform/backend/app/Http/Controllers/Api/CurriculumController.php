<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CurriculumSubject;
use App\Models\CurriculumTopic;
use App\Models\CurriculumTopicProgress;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CurriculumController extends Controller
{
    /**
     * Kullanıcının grade ve exam_type'ına göre ders listesini döner.
     * GET /curriculum
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $grade     = $request->query('grade', $user?->grade ?? 'all');
        $examType  = $request->query('exam_type', $user?->target_exam ?? 'all');

        $subjects = CurriculumSubject::forUser($grade, $examType)
            ->with(['units' => function ($q) {
                $q->where('is_active', true)->orderBy('sort_order');
            }])
            ->get();

        // Her ders için tamamlanan konu sayısını hesapla
        $progressMap = [];
        if ($user) {
            $allTopicIds = $subjects->flatMap(fn($s) => $s->units->flatMap(fn($u) => $u->topics ?? []))->pluck('id')->filter();
            $progRows = CurriculumTopicProgress::where('user_id', $user->id)
                ->where('status', 'completed')
                ->whereIn('topic_id', $allTopicIds)
                ->get();
            foreach ($progRows as $p) {
                $progressMap[$p->topic_id] = $p->status;
            }
        }

        $result = $subjects->map(function ($subject) use ($progressMap) {
            $data = $subject->toApiArray(false);
            $totalTopics = 0;
            $completedTopics = 0;

            foreach ($subject->units as $unit) {
                $topicCount = $unit->topics()->count();
                $totalTopics += $topicCount;
                $completedTopics += collect(array_keys($progressMap))->filter(function ($topicId) use ($unit) {
                    return CurriculumTopic::where('id', $topicId)->where('unit_id', $unit->id)->exists();
                })->count();
            }

            $data['total_topics']     = $totalTopics;
            $data['completed_topics'] = $completedTopics;
            $data['progress_percent'] = $totalTopics > 0
                ? round(($completedTopics / $totalTopics) * 100)
                : 0;

            return $data;
        });

        return response()->json([
            'subjects'  => $result,
            'grade'     => $grade,
            'exam_type' => $examType,
        ]);
    }

    /**
     * Tek bir dersin ünite + konu ağacını döner.
     * GET /curriculum/{slug}
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $subject = CurriculumSubject::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $subject->load(['units' => function ($q) {
            $q->where('is_active', true)->orderBy('sort_order')
              ->with(['topics' => function ($tq) {
                  $tq->where('is_active', true)->orderBy('sort_order')
                    ->with(['linkedTopic.contentItems']);
              }]);
        }]);

        $user = $request->user();
        $progressMap = [];
        if ($user) {
            $allTopicIds = $subject->units->flatMap(fn($u) => $u->topics->pluck('id'));
            $progRows = CurriculumTopicProgress::where('user_id', $user->id)
                ->whereIn('topic_id', $allTopicIds)
                ->get()
                ->keyBy('topic_id');
            foreach ($progRows as $topicId => $prog) {
                $progressMap[$topicId] = $prog->status;
            }
        }

        $units = $subject->units->map(function ($unit) use ($progressMap) {
            $topics = $unit->topics->map(function ($topic) use ($progressMap) {
                $data = $topic->toApiArray();
                $data['status'] = $progressMap[$topic->id] ?? 'not_started';
                return $data;
            });

            $completed = $topics->where('status', 'completed')->count();

            return [
                'id'               => $unit->id,
                'subject_id'       => $unit->subject_id,
                'title'            => $unit->title,
                'description'      => $unit->description,
                'meb_code'         => $unit->meb_code,
                'sort_order'       => $unit->sort_order,
                'topics'           => $topics->values(),
                'total_topics'     => $topics->count(),
                'completed_topics' => $completed,
                'progress_percent' => $topics->count() > 0
                    ? round(($completed / $topics->count()) * 100)
                    : 0,
            ];
        });

        return response()->json([
            'subject' => $subject->toApiArray(false),
            'units'   => $units,
        ]);
    }

    /**
     * Öğrencinin bir konu için ilerlemesini günceller.
     * POST /curriculum/progress
     */
    public function updateProgress(Request $request): JsonResponse
    {
        $request->validate([
            'topic_id' => 'required|integer|exists:curriculum_topics,id',
            'status'   => 'required|in:not_started,in_progress,completed',
        ]);

        $user = $request->user();

        $progress = CurriculumTopicProgress::updateOrCreate(
            ['user_id' => $user->id, 'topic_id' => $request->topic_id],
            [
                'status'       => $request->status,
                'completed_at' => $request->status === 'completed' ? now() : null,
            ]
        );

        return response()->json([
            'success'  => true,
            'progress' => [
                'topic_id'     => $progress->topic_id,
                'status'       => $progress->status,
                'completed_at' => $progress->completed_at,
            ],
        ]);
    }

    /**
     * Öğrencinin tüm curriculum ilerlemesi özeti.
     * GET /curriculum/progress
     */
    public function myProgress(Request $request): JsonResponse
    {
        $user = $request->user();
        $grade    = $user?->grade ?? 'all';
        $examType = $user?->target_exam ?? 'all';

        $subjects = CurriculumSubject::forUser($grade, $examType)
            ->with('units.topics')
            ->get();

        $allTopicIds = $subjects->flatMap(fn($s) => $s->units->flatMap(fn($u) => $u->topics->pluck('id')));
        $progRows = CurriculumTopicProgress::where('user_id', $user->id)
            ->whereIn('topic_id', $allTopicIds)
            ->get()
            ->keyBy('topic_id');

        $result = $subjects->map(function ($subject) use ($progRows) {
            $topicIds = $subject->units->flatMap(fn($u) => $u->topics->pluck('id'));
            $total     = $topicIds->count();
            $completed = $topicIds->filter(fn($id) => ($progRows[$id]->status ?? '') === 'completed')->count();

            return [
                'slug'             => $subject->slug,
                'name'             => $subject->name,
                'total_topics'     => $total,
                'completed_topics' => $completed,
                'progress_percent' => $total > 0 ? round(($completed / $total) * 100) : 0,
            ];
        });

        return response()->json(['progress' => $result]);
    }
}
