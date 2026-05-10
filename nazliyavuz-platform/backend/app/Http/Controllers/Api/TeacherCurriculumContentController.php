<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContentItem;
use App\Models\Course;
use App\Models\CurriculumTopic;
use App\Models\Topic;
use App\Models\Unit;
use App\Services\CacheService;
use App\Services\CurriculumThumbnailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class TeacherCurriculumContentController extends Controller
{
    public function __construct(
        private CacheService $cache,
        private CurriculumThumbnailService $thumbnailService,
    ) {}

    /**
     * Öğretmenin müfredat konusu araması (içerik yükleme seçici).
     * GET /api/teacher/curriculum/topics?q=
     */
    public function searchTopics(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        $limit = min(80, max(5, (int) $request->query('limit', 40)));

        $topics = CurriculumTopic::query()
            ->where('is_active', true)
            ->with(['unit.subject'])
            ->whereHas('unit', fn ($uq) => $uq->where('is_active', true))
            ->whereHas('unit.subject', fn ($sq) => $sq->where('is_active', true))
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($qq) use ($q) {
                    $qq->where('title', 'like', '%'.$q.'%')
                        ->orWhere('meb_code', 'like', '%'.$q.'%');
                });
            })
            ->orderBy('id', 'desc')
            ->limit($limit)
            ->get();

        $data = $topics->map(function (CurriculumTopic $t) {
            $unit = $t->unit;
            $subject = $unit?->subject;

            return [
                'id' => $t->id,
                'title' => $t->title,
                'meb_code' => $t->meb_code,
                'unit_title' => $unit?->title,
                'subject_name' => $subject?->name,
                'subject_slug' => $subject?->slug,
                'grade' => $subject?->grade,
                'exam_type' => $subject?->exam_type,
            ];
        });

        return response()->json(['success' => true, 'topics' => $data]);
    }

    /**
     * Müfredat konusuna video/PDF içerik ekler; gerekirse Course→Unit→Topic köprüsü kurar.
     * POST /api/teacher/curriculum-content
     */
    public function store(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'curriculum_topic_id' => 'required|integer|exists:curriculum_topics,id',
            'title' => 'sometimes|nullable|string|max:255',
            'file' => 'required|file|max:51200',
            'content_type' => 'required|in:video,pdf',
            'is_free' => 'sometimes|boolean',
            'thumbnail' => 'sometimes|nullable|image|mimes:jpeg,jpg,png,webp|max:10240',
        ]);

        if ($v->fails()) {
            return response()->json(['error' => true, 'errors' => $v->errors()], 422);
        }

        $teacher = Auth::user();
        $data = $v->validated();
        $contentType = $data['content_type'];
        $isFree = filter_var($request->input('is_free', true), FILTER_VALIDATE_BOOLEAN);

        /** @var CurriculumTopic $cTopic */
        $cTopic = CurriculumTopic::query()
            ->with(['unit.subject'])
            ->whereKey((int) $data['curriculum_topic_id'])
            ->firstOrFail();

        $cUnit = $cTopic->unit;
        $cSubject = $cUnit?->subject;
        if (! $cUnit || ! $cSubject) {
            return response()->json(['error' => true, 'message' => 'Geçersiz müfredat yapısı.'], 422);
        }

        $title = trim((string) ($data['title'] ?? '')) ?: ($cTopic->title.' — '.($contentType === 'video' ? 'Video' : 'PDF'));

        $thumbService = $this->thumbnailService;

        try {
            $result = DB::transaction(function () use ($request, $cTopic, $cUnit, $cSubject, $teacher, $contentType, $title, $isFree, $thumbService) {
                $lTopic = $this->resolveLinkedTopic($cTopic, $cUnit, $cSubject, $teacher->id);

                $file = $request->file('file');
                $ext = strtolower($file->getClientOriginalExtension() ?: 'bin');
                $safe = 'ct_'.$lTopic->id.'_'.time().'_'.Str::random(6).'.'.$ext;
                $path = $file->storeAs('curriculum_content', $safe, 'public');
                $url = rtrim($request->getSchemeAndHttpHost(), '/').'/storage/'.$path;

                $thumbnailUrl = null;
                if ($contentType === 'video') {
                    if ($request->hasFile('thumbnail')) {
                        $thumbnailUrl = $thumbService->storeOptimizedCover($request->file('thumbnail'), $request, (int) $lTopic->id);
                    } else {
                        $thumbnailUrl = $thumbService->genericContentCover($request, (int) $lTopic->id, 'video');
                    }
                } elseif ($contentType === 'pdf') {
                    $thumbnailUrl = $thumbService->genericContentCover($request, (int) $lTopic->id, 'pdf');
                }

                $maxOrder = (int) ContentItem::where('topic_id', $lTopic->id)->max('sort_order');

                $item = ContentItem::create([
                    'topic_id' => $lTopic->id,
                    'type' => $contentType,
                    'title' => $title,
                    'url' => $url,
                    'thumbnail_url' => $thumbnailUrl,
                    'duration_seconds' => null,
                    'size_bytes' => $request->hasFile('file') ? $request->file('file')->getSize() : null,
                    'sort_order' => $maxOrder + 1,
                    'is_free' => $isFree,
                    'is_active' => true,
                ]);

                $courseId = (int) $lTopic->unit->course_id;

                return ['item' => $item->fresh(), 'course_id' => $courseId];
            });
        } catch (\Throwable $e) {
            return response()->json([
                'error' => true,
                'message' => $e->getMessage() ?: 'İçerik kaydedilemedi.',
            ], 500);
        }

        $this->cache->invalidateCourse((int) $result['course_id']);

        return response()->json([
            'success' => true,
            'content_item' => [
                'id' => $result['item']->id,
                'type' => $result['item']->type,
                'title' => $result['item']->title,
                'url' => $result['item']->url,
                'thumbnail_url' => $result['item']->thumbnail_url,
                'is_free' => $result['item']->is_free,
            ],
            'curriculum_topic_id' => $cTopic->id,
        ], 201);
    }

    private function resolveLinkedTopic(CurriculumTopic $cTopic, $cUnit, $cSubject, int $teacherId): Topic
    {
        if ($cTopic->linked_topic_id) {
            $t = Topic::query()->with('unit')->whereKey($cTopic->linked_topic_id)->first();
            if ($t && $t->unit) {
                return $t;
            }
        }

        $courseSubject = $this->mapSubjectEnum($cSubject->name ?? '');
        $examType = $this->mapExamTypeForCourse($cSubject->exam_type ?? 'Genel');
        $grade = ($cSubject->grade !== null && $cSubject->grade !== '' && $cSubject->grade !== 'all')
            ? (int) $cSubject->grade
            : null;

        $slugBase = 'ct-topic-'.$cTopic->id;
        $slug = $slugBase;
        if (Course::where('slug', $slug)->exists()) {
            $slug = $slugBase.'-'.Str::lower(Str::random(4));
        }

        $course = Course::create([
            'title' => $cSubject->name.' — '.$cTopic->title,
            'slug' => $slug,
            'description' => 'Öğretmen müfredat içeriği köprüsü',
            'thumbnail_url' => null,
            'subject' => $courseSubject,
            'exam_type' => $examType,
            'grade' => $grade,
            'level' => 'intermediate',
            'is_active' => true,
            'is_free' => true,
            'sort_order' => 0,
            'created_by' => $teacherId,
        ]);

        $unit = Unit::create([
            'course_id' => $course->id,
            'title' => $cUnit->title ?: 'Ünite',
            'description' => null,
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $topic = Topic::create([
            'unit_id' => $unit->id,
            'title' => $cTopic->title,
            'description' => $cTopic->description,
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $cTopic->update(['linked_topic_id' => $topic->id]);

        return Topic::query()->with('unit')->whereKey($topic->id)->firstOrFail();
    }

    private function mapSubjectEnum(string $name): string
    {
        $allowed = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Edebiyat', 'Tarih', 'Coğrafya', 'İngilizce', 'Felsefe', 'Din', 'Geometri', 'Diğer'];
        foreach ($allowed as $sub) {
            if ($sub !== 'Diğer' && $name !== '' && mb_stripos($name, $sub) !== false) {
                return $sub;
            }
        }

        return 'Diğer';
    }

    private function mapExamTypeForCourse(?string $exam): string
    {
        $exam = $exam ?? 'Genel';
        $allowed = ['LGS', 'TYT', 'AYT', 'TYT-AYT', 'KPSS', 'Genel'];
        if (in_array($exam, $allowed, true)) {
            return $exam;
        }
        if ($exam === 'all') {
            return 'Genel';
        }

        return 'Genel';
    }
}
