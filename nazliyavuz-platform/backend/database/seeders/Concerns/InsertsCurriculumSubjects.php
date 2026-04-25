<?php

namespace Database\Seeders\Concerns;

use Illuminate\Support\Facades\DB;

/**
 * Ortaokul/lise/sınav müfredatı satırlarını curriculum_* tablolarına yazar.
 * Her seeder yalnızca kendi grade + exam_type aralığını purge eder (tek başına çalıştırılabilir).
 */
trait InsertsCurriculumSubjects
{
    protected function purgeByGradeAndExamType(string $grade, string $examType): void
    {
        $subjectIds = DB::table('curriculum_subjects')
            ->where('grade', $grade)
            ->where('exam_type', $examType)
            ->pluck('id');

        if ($subjectIds->isEmpty()) {
            return;
        }

        $unitIds = DB::table('curriculum_units')->whereIn('subject_id', $subjectIds)->pluck('id');
        if ($unitIds->isNotEmpty()) {
            DB::table('curriculum_topic_progress')
                ->whereIn('topic_id', function ($q) use ($unitIds) {
                    $q->select('id')->from('curriculum_topics')->whereIn('unit_id', $unitIds);
                })->delete();
            DB::table('curriculum_topics')->whereIn('unit_id', $unitIds)->delete();
            DB::table('curriculum_units')->whereIn('id', $unitIds)->delete();
        }
        DB::table('curriculum_subjects')->whereIn('id', $subjectIds)->delete();
    }

    /**
     * @param  array<int, array{name: string, slug: string, icon: string, color: string, grade: string, exam_type: string, sort_order: int, units: array<int, array{title: string, meb_code?: string|null, description?: string|null, topics: array<int, string|array{title: string, code?: string|null}>}>  $curriculum
     */
    protected function insertCurriculumSubjects(array $curriculum): void
    {
        foreach ($curriculum as $subjectData) {
            $subjectId = DB::table('curriculum_subjects')->insertGetId([
                'name'       => $subjectData['name'],
                'slug'       => $subjectData['slug'],
                'icon'       => $subjectData['icon'],
                'color'      => $subjectData['color'],
                'grade'      => $subjectData['grade'],
                'exam_type'  => $subjectData['exam_type'],
                'sort_order' => $subjectData['sort_order'],
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($subjectData['units'] as $uOrder => $unitData) {
                $unitId = DB::table('curriculum_units')->insertGetId([
                    'subject_id'  => $subjectId,
                    'title'       => $unitData['title'],
                    'description' => $unitData['description'] ?? null,
                    'meb_code'    => $unitData['meb_code'] ?? null,
                    'sort_order'  => $uOrder + 1,
                    'is_active'   => true,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);

                foreach ($unitData['topics'] as $tOrder => $topicTitle) {
                    $title = is_array($topicTitle) ? $topicTitle['title'] : $topicTitle;
                    $code  = is_array($topicTitle) ? ($topicTitle['code'] ?? null) : null;
                    DB::table('curriculum_topics')->insert([
                        'unit_id'    => $unitId,
                        'title'      => $title,
                        'meb_code'   => $code,
                        'sort_order' => $tOrder + 1,
                        'is_active'  => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}
