<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Abonelik paketleri tanımları (Bronze / Plus / Pro)
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name')->comment('Bronze, Plus, Pro');
            $table->string('slug', 20)->unique()->comment('bronze, plus, pro');
            $table->decimal('monthly_price', 10, 2);
            $table->decimal('yearly_price', 10, 2)->nullable();
            $table->json('features')->nullable()->comment('Özellikler listesi');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Kullanıcı abonelikleri
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('plan_id')->constrained('subscription_plans')->onDelete('cascade');
            $table->string('paytr_merchant_oid')->nullable()->unique()->comment('PayTR sipariş numarası');
            $table->enum('status', ['pending','active','cancelled','expired','refunded'])->default('pending');
            $table->enum('billing_cycle', ['monthly','yearly'])->default('monthly');
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancel_reason')->nullable();
            $table->json('paytr_response')->nullable();
            $table->timestamps();
            $table->index(['user_id','status']);
            $table->index('paytr_merchant_oid');
        });

        // PayTR ödeme geçmişi
        Schema::create('payment_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_id')->nullable()->constrained()->nullOnDelete();
            $table->string('paytr_merchant_oid')->nullable();
            $table->string('paytr_payment_type')->nullable();
            $table->string('paytr_payment_amount')->nullable();
            $table->string('status')->default('pending');
            $table->json('raw_response')->nullable();
            $table->timestamps();
        });

        // Plan tanımlarını seed et
        \DB::table('subscription_plans')->insert([
            [
                'name' => 'Bronze',
                'slug' => 'bronze',
                'monthly_price' => 149.00,
                'yearly_price' => 1490.00,
                'features' => json_encode(['Temel ders videoları', 'Günlük 20 soru', 'Konu testleri', 'İlerleme takibi']),
                'is_active' => true,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Plus',
                'slug' => 'plus',
                'monthly_price' => 249.00,
                'yearly_price' => 2490.00,
                'features' => json_encode(['Bronze + Sınırsız soru', 'Deneme sınavları', 'Yapay zeka analiz', 'Veli takip paneli', 'Öncelikli destek']),
                'is_active' => true,
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'monthly_price' => 399.00,
                'yearly_price' => 3990.00,
                'features' => json_encode(['Plus + Canlı dersler', 'Öğretmen takibi', 'Kişisel koç sistemi', 'PDF kaynak kitaplar', 'Sınırsız deneme sınavı']),
                'is_active' => true,
                'sort_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_logs');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('subscription_plans');
    }
};
