<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContentItem;
use App\Models\Course;
use App\Models\CurriculumSubject;
use App\Models\CurriculumTopic;
use App\Models\CurriculumTopicProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class CurriculumController extends Controller
{
    /**
     * content_items.type alanındaki varyasyonları (Video, LINK, url vb.) katalog için video|pdf|text'e indirger.
     */
    private function normalizeMediaCatalogContentType(string $raw): ?string
    {
        $t = strtolower(trim($raw));

        return match ($t) {
            'video', 'pdf', 'text' => $t,
            'link', 'url', 'external', 'embed', 'html' => 'text',
            default => null,
        };
    }

    /**
     * Kullanıcının grade ve exam_type'ına göre ders listesini döner.
     * GET /curriculum
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $responseExamType = null;
        if ($user && $user->isStudent()) {
            $scope = $user->learningScope();
            $grade = $scope['grade'];
            $responseExamType = $scope['exam_type'];
            $examType = $user->allowedExamTypes();
        } else {
            $grade = $request->query('grade', $user?->grade ?? 'all');
            $examType = $request->query('exam_type', $user?->target_exam ?? 'all');
            $responseExamType = is_array($examType) ? implode(',', $examType) : $examType;
        }

        $subjects = CurriculumSubject::forUser($grade, $examType)
            ->with(['units' => function ($q) {
                $q->where('is_active', true)->orderBy('sort_order')
                    ->with(['topics' => function ($tq) {
                        $tq->where('is_active', true)->orderBy('sort_order');
                    }]);
            }])
            ->get();

        // Her ders için tamamlanan konu sayısını hesapla
        $progressMap = [];
        if ($user) {
            $allTopicIds = $subjects->flatMap(fn ($s) => $s->units->flatMap(fn ($u) => $u->topics->pluck('id')))->filter();
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
                $topics = $unit->topics;
                $topicCount = $topics->count();
                $totalTopics += $topicCount;
                $completedTopics += $topics->filter(fn ($t) => ($progressMap[$t->id] ?? '') === 'completed')->count();
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
            'exam_type' => $responseExamType,
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
        if ($user && $user->isStudent()) {
            $scope = $user->learningScope();
            $subjectExamType = $subject->exam_type ?? 'all';

            $gradeMatch = $subject->grade === $scope['grade'] || $subject->grade === 'all';
            $examTypeMatch = $user->matchesExamType($subjectExamType);

            if (!$gradeMatch || !$examTypeMatch) {
                return response()->json([
                    'error' => true,
                    'code' => 'FORBIDDEN_SCOPE',
                    'message' => 'Bu ders içeriğine erişim yetkiniz yok.',
                ], 403);
            }
        }

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
     * Öğrenci kapsamındaki müfredat medya içeriklerini (video, pdf, text) tek istekte düz listeler.
     * GET /curriculum/media-catalog
     */
    public function mediaCatalog(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user || ! $user->isStudent()) {
            return response()->json([
                'error'   => true,
                'code'    => 'FORBIDDEN',
                'message' => 'Bu uç nokta yalnızca öğrenci hesapları içindir.',
            ], 403);
        }

        $scope = $user->learningScope();
        $grade = $scope['grade'];
        $examType = $user->allowedExamTypes();

        $subjects = CurriculumSubject::forUser($grade, $examType)
            ->with([
                'units' => function ($q) {
                    $q->where('is_active', true)->orderBy('sort_order')
                        ->with([
                            'topics' => function ($tq) {
                                $tq->where('is_active', true)->orderBy('sort_order')
                                    ->with([
                                        'linkedTopic' => function ($ltq) {
                                            $ltq->with([
                                                'contentItems' => function ($ciq) {
                                                    $ciq->where('is_active', true)->orderBy('sort_order')->with('video');
                                                },
                                            ]);
                                        },
                                    ]);
                            },
                        ]);
                },
            ])
            ->get();

        $allTopicIds = $subjects->flatMap(fn ($s) => $s->units->flatMap(fn ($u) => $u->topics->pluck('id')))->filter()->unique()->values();
        $progRows = $allTopicIds->isNotEmpty()
            ? CurriculumTopicProgress::where('user_id', $user->id)
                ->whereIn('topic_id', $allTopicIds)
                ->get()
                ->keyBy('topic_id')
            : collect();

        $items = [];
        $countsBySlug = [];

        foreach ($subjects as $subject) {
            $countsBySlug[$subject->slug] = 0;
            foreach ($subject->units as $unit) {
                foreach ($unit->topics as $topic) {
                    $linked = $topic->linkedTopic;
                    $contentItems = $this->resolveMediaCatalogContentItems($topic, $linked);
                    if ($contentItems->isEmpty()) {
                        continue;
                    }
                    $topicStatus = ($progRows[$topic->id] ?? null)?->status ?? 'not_started';
                    foreach ($contentItems as $ci) {
                        $canonicalType = $this->normalizeMediaCatalogContentType((string) $ci->type);
                        if ($canonicalType === null) {
                            continue;
                        }
                        $countsBySlug[$subject->slug]++;
                        $items[] = [
                            'key'                   => 'cur-'.$topic->id.'-'.$ci->id,
                            'source'                => 'curriculum',
                            'content_type'          => $canonicalType,
                            'id'                    => (int) $ci->id,
                            'title'                 => $ci->title,
                            'url'                   => $this->resolveMediaCatalogItemUrl($ci, $canonicalType),
                            'duration_seconds'      => $ci->duration_seconds ?? ($ci->video?->duration_seconds ?? null),
                            'is_free'               => (bool) $ci->is_free,
                            'subject_slug'          => $subject->slug,
                            'subject_name'          => $subject->name,
                            'subject_icon'          => $subject->icon,
                            'subject_color'         => $subject->color,
                            'grade'                 => $subject->grade,
                            'exam_type'             => $subject->exam_type,
                            'curriculum_topic_id'   => (int) $topic->id,
                            'topic_title'           => $topic->title,
                            'unit_title'            => $unit->title,
                            'topic_status'          => $topicStatus,
                            'sort_order'            => (int) $ci->sort_order,
                        ];
                    }
                }
            }
        }

        $progressMap = [];
        foreach ($subjects as $subject) {
            $totalTopics = 0;
            $completedTopics = 0;
            foreach ($subject->units as $unit) {
                foreach ($unit->topics as $topic) {
                    $totalTopics++;
                    if (($progRows[$topic->id] ?? null)?->status === 'completed') {
                        $completedTopics++;
                    }
                }
            }
            $progressMap[$subject->slug] = [
                'total_topics'     => $totalTopics,
                'completed_topics' => $completedTopics,
                'progress_percent'   => $totalTopics > 0 ? round(($completedTopics / $totalTopics) * 100) : 0,
            ];
        }

        $subjectsSummary = $subjects->map(function ($subject) use ($countsBySlug, $progressMap) {
            $p = $progressMap[$subject->slug] ?? ['total_topics' => 0, 'completed_topics' => 0, 'progress_percent' => 0];

            return [
                'slug'             => $subject->slug,
                'name'             => $subject->name,
                'icon'             => $subject->icon,
                'color'            => $subject->color,
                'grade'            => $subject->grade,
                'exam_type'        => $subject->exam_type,
                'media_count'      => $countsBySlug[$subject->slug] ?? 0,
                'total_topics'     => $p['total_topics'],
                'completed_topics' => $p['completed_topics'],
                'progress_percent' => $p['progress_percent'],
            ];
        })->values();

        return response()->json([
            'items'            => $items,
            'subjects_summary' => $subjectsSummary,
            'grade'            => $grade,
            'exam_type'        => $scope['exam_type'] ?? '',
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
        $examType = $user && method_exists($user, 'allowedExamTypes')
            ? $user->allowedExamTypes()
            : ($user?->target_exam ?? 'all');

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

    /**
     * @return Collection<int, ContentItem>
     */
    private function resolveMediaCatalogContentItems(CurriculumTopic $topic, ?\App\Models\Topic $linked): Collection
    {
        if ($linked) {
            return $linked->contentItems;
        }

        $bridge = $this->contentItemsForBridgeCurriculumTopic($topic->id);
        $legacy = $this->legacyContentItemsLinkedToCurriculumTopicId($topic->id);

        return $bridge->concat($legacy)->unique('id')->values();
    }

    /**
     * Öğretmen müfredat içerik API'sinin oluşturduğu köprü kursu (slug: ct-topic-{curriculumTopicId}).
     *
     * @return Collection<int, ContentItem>
     */
    private function contentItemsForBridgeCurriculumTopic(int $curriculumTopicId): Collection
    {
        $base = 'ct-topic-'.$curriculumTopicId;
        $course = Course::query()
            ->where('slug', $base)
            ->orWhere('slug', 'like', $base.'-%')
            ->first();
        if (! $course) {
            return collect();
        }

        return ContentItem::query()
            ->where('is_active', true)
            ->whereHas('topic.unit', fn ($q) => $q->where('course_id', $course->id))
            ->with('video')
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * Bazı kurulumlarda content_items.topic_id doğrudan curriculum_topics.id ile eşleştirilmiş olabiliyor.
     *
     * @return Collection<int, ContentItem>
     */
    private function legacyContentItemsLinkedToCurriculumTopicId(int $curriculumTopicId): Collection
    {
        return ContentItem::query()
            ->join('curriculum_topics', 'curriculum_topics.id', '=', 'content_items.topic_id')
            ->where('curriculum_topics.id', $curriculumTopicId)
            ->where('content_items.is_active', true)
            ->select('content_items.*')
            ->with('video')
            ->orderBy('content_items.sort_order')
            ->get();
    }

    private function resolveMediaCatalogItemUrl(ContentItem $ci, string $canonicalType): ?string
    {
        if ($canonicalType !== 'video') {
            return $ci->url;
        }

        $v = $ci->relationLoaded('video') ? $ci->video : null;
        if ($v === null) {
            $v = $ci->video()->first();
        }

        return ($v && $v->cdn_url) ? $v->cdn_url : $ci->url;
    }
}
