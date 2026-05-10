<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * target_exam alanını GENEL değerini kabul edecek şekilde genişletir ve
     * 5–6. sınıfta hatalı LGS kayıtlarını okul odaklı (GENEL) hedefe taşır.
     */
    public function up(): void
    {
        if (! Schema::hasTable('users') || ! Schema::hasColumn('users', 'target_exam')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            try {
                DB::statement('ALTER TABLE users MODIFY target_exam VARCHAR(32) NULL');
            } catch (\Throwable $e) {
                \Log::warning('student_target_exam migration alter failed: '.$e->getMessage());
            }
        } elseif ($driver === 'sqlite') {
            // SQLite test ortamı: enum yok; sütun zaten string olabilir
        }

        DB::table('users')
            ->where('role', 'student')
            ->whereIn('grade', [5, 6])
            ->where(function ($q) {
                $q->whereNull('target_exam')
                    ->orWhere('target_exam', '!=', 'GENEL');
            })
            ->update(['target_exam' => 'GENEL']);
    }

    public function down(): void
    {
        // Geri alma: GENEL -> null veya LGS dönüşümü veri kaybı riski; no-op
    }
};
