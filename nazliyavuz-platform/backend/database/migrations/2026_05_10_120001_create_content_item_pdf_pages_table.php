<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_item_pdf_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('content_item_id')->constrained('content_items')->cascadeOnDelete();
            $table->unsignedInteger('page_number');
            $table->string('path', 512);
            $table->timestamps();
            $table->unique(['content_item_id', 'page_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_item_pdf_pages');
    }
};
