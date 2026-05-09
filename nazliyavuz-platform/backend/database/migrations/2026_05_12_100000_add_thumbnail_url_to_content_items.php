<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('content_items') && ! Schema::hasColumn('content_items', 'thumbnail_url')) {
            Schema::table('content_items', function (Blueprint $table) {
                $table->string('thumbnail_url', 2048)->nullable()->after('url')->comment('Video kapak; YouTube vb. otomatik veya yüklenen görsel');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('content_items') && Schema::hasColumn('content_items', 'thumbnail_url')) {
            Schema::table('content_items', function (Blueprint $table) {
                $table->dropColumn('thumbnail_url');
            });
        }
    }
};
