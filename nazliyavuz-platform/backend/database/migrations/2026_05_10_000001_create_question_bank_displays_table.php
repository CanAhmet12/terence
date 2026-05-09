<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('question_bank_displays')) {
            return;
        }

        Schema::create('question_bank_displays', function (Blueprint $table) {
            $table->id();
            $table->string('subject', 120);
            /** 0 = tüm sınıflar; aksi halde questions.grade ile eşleşir */
            $table->unsignedTinyInteger('grade')->default(0);
            $table->string('badge_label', 64)->nullable();
            $table->string('year_label', 16)->nullable();
            $table->string('brand_label', 128)->nullable();
            $table->string('title_override', 255)->nullable();
            $table->string('footer_label', 128)->nullable();
            $table->string('cta_label', 64)->nullable();
            /** #RRGGBB — kapak düz rengi; boşsa ders adına göre tema */
            $table->string('cover_hex', 7)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['subject', 'grade']);
            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_bank_displays');
    }
};
