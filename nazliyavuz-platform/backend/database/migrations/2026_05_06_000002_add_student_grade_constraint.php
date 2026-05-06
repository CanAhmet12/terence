<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration adds a CHECK constraint to ensure students have grade and target_exam set.
     * Requires MySQL 8.0.16+ for CHECK constraint support.
     */
    public function up(): void
    {
        // Check MySQL version first
        $version = DB::select('SELECT VERSION() as version')[0]->version;
        
        // Extract major.minor.patch version
        preg_match('/^(\d+)\.(\d+)\.(\d+)/', $version, $matches);
        $major = (int)($matches[1] ?? 0);
        $minor = (int)($matches[2] ?? 0);
        $patch = (int)($matches[3] ?? 0);
        
        // MySQL 8.0.16+ supports CHECK constraints
        if ($major > 8 || ($major === 8 && $minor > 0) || ($major === 8 && $minor === 0 && $patch >= 16)) {
            // Add CHECK constraint: students must have grade and target_exam
            // Other roles (teacher, parent, admin) can have NULL values
            DB::statement("
                ALTER TABLE users 
                ADD CONSTRAINT chk_student_grade_required 
                CHECK (
                    role != 'student' 
                    OR (grade IS NOT NULL AND target_exam IS NOT NULL)
                )
            ");
        } else {
            // For older MySQL versions, log a warning
            // Application-level validation via middleware will still enforce this
            \Log::warning('MySQL version ' . $version . ' does not support CHECK constraints. Student grade validation relies on middleware.');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Try to drop the constraint (will fail silently if it doesn't exist)
        try {
            DB::statement("ALTER TABLE users DROP CHECK chk_student_grade_required");
        } catch (\Exception $e) {
            // Constraint doesn't exist or MySQL version doesn't support CHECK
            \Log::info('Could not drop chk_student_grade_required constraint: ' . $e->getMessage());
        }
    }
};
