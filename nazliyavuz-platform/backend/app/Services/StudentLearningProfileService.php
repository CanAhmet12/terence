<?php

namespace App\Services;

use App\Models\User;

/**
 * Öğrenci sınıfı + hedef sınav için tek doğruluk kaynağı (template, sınav kapsamı, doğrulama).
 * Frontend'deki goal-dashboard.ts ile aynı kurallar korunmalıdır.
 */
final class StudentLearningProfileService
{
    public const TARGET_GENEL = 'GENEL';

    public static function normalizedIntGrade(User|int|string|null $grade): ?int
    {
        if ($grade instanceof User) {
            $g = $grade->grade;
        } else {
            $g = $grade;
        }
        if ($g === null || $g === '') {
            return null;
        }

        return (int) $g;
    }

    public static function isGraduate(?int $grade): bool
    {
        return $grade === 0;
    }

    /**
     * @return 'school_primary'|'exam_lgs'|'exam_yks'
     */
    public static function resolveGoalTemplate(User $user): string
    {
        $grade = self::normalizedIntGrade($user);
        $exam = strtoupper(trim((string) ($user->target_exam ?? $user->exam_goal ?? '')));

        if (self::isGraduate($grade)) {
            return 'exam_yks';
        }

        if ($exam === self::TARGET_GENEL) {
            return 'school_primary';
        }

        // 5–6: ürün olarak okul şablonu; eski veride LGS kalsa bile sınav baskısı göstermeyelim
        if ($grade !== null && $grade >= 5 && $grade <= 6) {
            return 'school_primary';
        }

        if ($exam === 'LGS' && $grade !== null && $grade >= 7 && $grade <= 8) {
            return 'exam_lgs';
        }

        if ($grade !== null && $grade >= 7 && $grade <= 8) {
            return 'exam_lgs';
        }

        if (in_array($exam, ['TYT', 'AYT', 'TYT-AYT', 'KPSS'], true)) {
            return 'exam_yks';
        }

        if ($grade !== null && $grade >= 9) {
            return 'exam_yks';
        }

        return 'exam_yks';
    }

    /**
     * @return array<int, string>
     */
    public static function allowedExamTypes(?int $grade, ?string $targetExam): array
    {
        $exam = strtoupper(trim((string) ($targetExam ?? '')));
        $g = $grade;

        if (self::isGraduate($g)) {
            return match ($exam) {
                'TYT-AYT' => ['TYT', 'AYT', 'TYT-AYT', 'Genel', 'all'],
                default => [$exam !== '' ? $exam : 'TYT', 'Genel', 'all'],
            };
        }

        if ($exam === self::TARGET_GENEL || ($g !== null && $g >= 5 && $g <= 6)) {
            return ['Genel', 'all'];
        }

        if ($exam === 'TYT-AYT') {
            return ['TYT', 'AYT', 'TYT-AYT', 'Genel', 'all'];
        }

        if ($exam === 'LGS' && $g !== null && $g >= 7 && $g <= 8) {
            return ['LGS', 'Genel', 'all'];
        }

        if ($g !== null && $g >= 7 && $g <= 8) {
            return ['LGS', 'Genel', 'all'];
        }

        return match ($exam) {
            'TYT-AYT' => ['TYT', 'AYT', 'TYT-AYT', 'Genel', 'all'],
            'all', '' => ['all', 'Genel'],
            default => [$exam, 'Genel', 'all'],
        };
    }

    public static function allowedExamTypesForUser(User $user): array
    {
        return self::allowedExamTypes(self::normalizedIntGrade($user), $user->target_exam ?? $user->exam_goal);
    }

    /**
     * Öğrenci kayıt / profil güncelleme için sınıf–sınav çifti doğrulaması.
     */
    public static function validateStudentGradeAndTargetExam(?int $grade, ?string $targetExam): ?string
    {
        if ($grade === null || $targetExam === null || $targetExam === '') {
            return null;
        }

        $exam = strtoupper(trim($targetExam));

        if (self::isGraduate($grade)) {
            if (! in_array($exam, ['TYT', 'AYT', 'TYT-AYT', 'KPSS'], true)) {
                return 'Mezun öğrenciler için TYT, AYT, TYT-AYT veya KPSS hedefi seçilmelidir.';
            }

            return null;
        }

        if ($grade < 5 || $grade > 12) {
            return 'Sınıf 5–12 veya mezun (0) olmalıdır.';
        }

        if ($grade >= 5 && $grade <= 6) {
            if ($exam !== self::TARGET_GENEL) {
                return '5–6. sınıf için yalnızca okul odaklı (GENEL) hedef seçilebilir.';
            }

            return null;
        }

        if ($grade === 7 || $grade === 8) {
            if ($exam !== 'LGS') {
                return '7–8. sınıf için hedef sınav LGS olmalıdır.';
            }

            return null;
        }

        if ($grade >= 9 && $grade <= 12) {
            if (! in_array($exam, ['TYT', 'AYT', 'TYT-AYT', 'KPSS'], true)) {
                return '9–12. sınıf için TYT, AYT, TYT-AYT veya KPSS seçilmelidir.';
            }

            return null;
        }

        return null;
    }

    /**
     * UI ve içerik tonlaması için kademe anahtarı.
     *
     * @return 'graduate'|'ms_lower'|'ms_upper'|'hs_early'|'hs_senior'|'unknown'
     */
    public static function resolveEducationPhase(User $user): string
    {
        $g = self::normalizedIntGrade($user);
        if (self::isGraduate($g)) {
            return 'graduate';
        }
        if ($g === null) {
            return 'unknown';
        }
        if ($g <= 6) {
            return 'ms_lower';
        }
        if ($g <= 8) {
            return 'ms_upper';
        }
        if ($g <= 10) {
            return 'hs_early';
        }

        return 'hs_senior';
    }
}
