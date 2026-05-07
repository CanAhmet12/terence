<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'exam_date')) {
            return;
        }
        // Prod şemada `streak_days` her zaman yok; `after()` MySQL hatasına yol açıyor.
        Schema::table('users', function (Blueprint $table) {
            $table->date('exam_date')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'exam_date')) {
                $table->dropColumn('exam_date');
            }
        });
    }
};
