<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Eski kayıtlarda teacher_status NULL idi; yeni kayıtlar "pending" ile oluşur.
     * NULL kalan mevcut öğretmenleri onaylı kabul et (üretimde zaten kullanan hesaplar).
     */
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'teacher_status')) {
            return;
        }
        DB::table('users')
            ->where('role', 'teacher')
            ->whereNull('teacher_status')
            ->update(['teacher_status' => 'approved', 'updated_at' => now()]);
    }

    public function down(): void
    {
        // Geri alınmaz — NULL'a döndürmek veri kaybı yaratır
    }
};
