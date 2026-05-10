<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('content_items') && ! Schema::hasColumn('content_items', 'storage_path')) {
            Schema::table('content_items', function (Blueprint $table) {
                $table->string('storage_path', 512)->nullable()->after('url');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('content_items') && Schema::hasColumn('content_items', 'storage_path')) {
            Schema::table('content_items', function (Blueprint $table) {
                $table->dropColumn('storage_path');
            });
        }
    }
};
