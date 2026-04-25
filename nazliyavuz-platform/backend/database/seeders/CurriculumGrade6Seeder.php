<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 6. Sınıf — MEB Türkiye Yüzyılı Maarif Modeli (TYMM) ortaokul öğretim programları
 * ve TEGM 2025-2026 çerçeve yıllık planları ile uyumlu müfredat ağacı.
 *
 * Kaynak özeti: TYMM (tymm.meb.gov.tr) — Türkçe tema başlıkları ve Matematik öğrenme alanları programdaki adlarla eşleştirilmiştir; TEGM 2025-2026 çerçeve planları.
 * Bu seeder yalnızca grade=6 kayıtlarını günceller.
 */
class CurriculumGrade6Seeder extends Seeder
{
    public function run(): void
    {
        $this->purgeGrade6Curriculum();

        $curriculum = $this->getGrade6Curriculum();

        foreach ($curriculum as $subjectData) {
            $subjectId = DB::table('curriculum_subjects')->insertGetId([
                'name'       => $subjectData['name'],
                'slug'       => $subjectData['slug'],
                'icon'       => $subjectData['icon'],
                'color'      => $subjectData['color'],
                'grade'      => '6',
                'exam_type'  => $subjectData['exam_type'] ?? 'all',
                'sort_order' => $subjectData['sort_order'],
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($subjectData['units'] as $uOrder => $unitData) {
                $unitId = DB::table('curriculum_units')->insertGetId([
                    'subject_id'  => $subjectId,
                    'title'       => $unitData['title'],
                    'description' => $unitData['description'] ?? null,
                    'meb_code'    => $unitData['meb_code'] ?? null,
                    'sort_order'  => $uOrder + 1,
                    'is_active'   => true,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);

                foreach ($unitData['topics'] as $tOrder => $topicTitle) {
                    $title = is_array($topicTitle) ? $topicTitle['title'] : $topicTitle;
                    $code  = is_array($topicTitle) ? ($topicTitle['code'] ?? null) : null;
                    DB::table('curriculum_topics')->insert([
                        'unit_id'    => $unitId,
                        'title'      => $title,
                        'meb_code'   => $code,
                        'sort_order' => $tOrder + 1,
                        'is_active'  => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        $topicCount = DB::table('curriculum_topics')
            ->whereIn('unit_id', function ($q) {
                $q->select('id')->from('curriculum_units')
                    ->whereIn('subject_id', function ($q2) {
                        $q2->select('id')->from('curriculum_subjects')->where('grade', '6');
                    });
            })->count();

        $this->command->info('CurriculumGrade6Seeder: '.count($curriculum)." ders, {$topicCount} konu (6. sınıf) yazıldı.");
    }

    private function purgeGrade6Curriculum(): void
    {
        $subjectIds = DB::table('curriculum_subjects')->where('grade', '6')->pluck('id');
        if ($subjectIds->isEmpty()) {
            return;
        }

        $unitIds = DB::table('curriculum_units')->whereIn('subject_id', $subjectIds)->pluck('id');
        if ($unitIds->isNotEmpty()) {
            DB::table('curriculum_topic_progress')
                ->whereIn('topic_id', function ($q) use ($unitIds) {
                    $q->select('id')->from('curriculum_topics')->whereIn('unit_id', $unitIds);
                })->delete();
            DB::table('curriculum_topics')->whereIn('unit_id', $unitIds)->delete();
            DB::table('curriculum_units')->whereIn('id', $unitIds)->delete();
        }
        DB::table('curriculum_subjects')->whereIn('id', $subjectIds)->delete();
    }

    private function getGrade6Curriculum(): array
    {
        return [
            // ─── 1. Türkçe — 6 tema (TYMM 6. sınıf) ───────────────────────────
            [
                'name' => 'Türkçe', 'slug' => 'turkce-6',
                'icon' => '📖', 'color' => '#c62828', 'sort_order' => 1,
                'units' => [
                    ['title' => 'Dilimizin Zenginliği', 'meb_code' => 'TRK.6.T1', 'topics' => [
                        'Sözcükte anlam: eş anlamlı, zıt anlamlı, çok anlamlılık',
                        'Deyim ve atasözleri; dilin incelikleri',
                        'Anahtar kelime ve özet çıkarma',
                        'Dinleme/izleme: tonlama ve vurgu ile anlam',
                        'Değerler: saygı, vatanseverlik, estetik duyarlılık',
                    ]],
                    ['title' => 'Bağımsızlık Yolu', 'meb_code' => 'TRK.6.T2', 'topics' => [
                        'Görsel ve yazılı materyallerden anlam çıkarma',
                        'Metinler arası karşılaştırma',
                        'Kurtuluş ve bağımsızlık temalı metinlerde okuma stratejileri',
                        'Yazma: bilgilendirici ve betimleyici paragraflar',
                        'Özgürlük, azim ve kararlılık değerleri',
                    ]],
                    ['title' => 'Farklı Dünyalar', 'meb_code' => 'TRK.6.T3', 'topics' => [
                        'Düşünceyi geliştirme ve tahmin etme',
                        'Şiirde biçim özellikleri ve imgeler',
                        'Sınıflandırma ve kıyaslama',
                        'Konuşma: empati ve açık fikirlilikle tartışma',
                        'Okuma: farklı kültür ve yaşam dünyalarını yansıtan metinler',
                    ]],
                    ['title' => 'İletişim ve Sosyal İlişkiler', 'meb_code' => 'TRK.6.T4', 'topics' => [
                        'Metin yapısından bilgi çıkarma (giriş-gelişme-sonuç)',
                        'Çoklu ortam ögelerini çözümleme',
                        'Dijital iletişim ve mahremiyet',
                        'Yazma: duyuru, kısa haber, e-posta',
                        'Dostluk ve saygı değerleri',
                    ]],
                    ['title' => 'Bilim ve Teknoloji', 'meb_code' => 'TRK.6.T5', 'topics' => [
                        'Bilimsel metinlerde ana düşünce ve veri',
                        'Hikâye unsurları ve olay örgüsü',
                        'Söz sanatlarına giriş',
                        'Yazma süreci: planlama, taslak, düzeltme',
                        'Sorumluluk ve çalışkanlık',
                    ]],
                    ['title' => 'Lider Ruhlar', 'meb_code' => 'TRK.6.T6', 'topics' => [
                        'Metni eleştirel okuma ve güvenilirlik',
                        'Probleme çözüm önerisi üretme',
                        'Sözlü sunum ve geri bildirim',
                        'Yazılı değerlendirme ve öz değerlendirme',
                        'Dürüstlük, bağımsızlık ve özgürlük değerleri',
                    ]],
                ],
            ],

            // ─── 2. Matematik — TYMM 6. sınıf öğrenme alanları (7 tema) ─────────
            [
                'name' => 'Matematik', 'slug' => 'matematik-6',
                'icon' => '📐', 'color' => '#1565c0', 'sort_order' => 2,
                'units' => [
                    ['title' => 'Sayılar ve Nicelikler (1)', 'meb_code' => 'MAT.6.1', 'topics' => [
                        'Çarpan-kat, EBOB-EKOK ve asal çarpanlara ayırma',
                        'Kümeler ve Venn şemaları',
                        'Doğal sayılarda işlemler ve problem çözme',
                    ]],
                    ['title' => 'Sayılar ve Nicelikler (2)', 'meb_code' => 'MAT.6.2', 'topics' => [
                        'Tam sayılar ve sayı doğrusu',
                        'Tam sayılarda dört işlem',
                        'Kesirlerle çarpma ve bölme; kesir problemleri',
                        'Ondalık gösterim ve kesir ilişkisi',
                    ]],
                    ['title' => 'İşlemlerle Cebirsel Düşünme ve Değişimler', 'meb_code' => 'MAT.6.3', 'topics' => [
                        'Oran, orantı ve yüzde',
                        'Cebirsel ifadeler ve özdeşlikler',
                        'Birinci dereceden bir bilinmeyenli denklemler',
                        'Örüntü ve değişim ilişkileri',
                    ]],
                    ['title' => 'Geometrik Şekiller', 'meb_code' => 'MAT.6.4', 'topics' => [
                        'Açılar ve paralel doğrular',
                        'Üçgenler ve çokgenler',
                        'Çember ve daire; temel çizimler',
                        'Dönüşüm geometrisine giriş (öteleme, basit simetri)',
                    ]],
                    ['title' => 'Geometrik Nicelikler', 'meb_code' => 'MAT.6.5', 'topics' => [
                        'Paralelkenar ve üçgende alan',
                        'Birleşik şekillerde alan',
                        'Prizma ve silindire giriş; yüzey ve hacim farkındalığı',
                        'Sıvı ölçme ve birim dönüşümü',
                    ]],
                    ['title' => 'İstatistiksel Araştırma Süreci', 'meb_code' => 'MAT.6.6', 'topics' => [
                        'Veri toplama ve düzenleme',
                        'Grafik ve tablo oluşturma ve yorumlama',
                        'Merkezi eğilim ve yayılım ölçülerine giriş',
                        'Araştırma sorusu ve sonuçları sunma',
                    ]],
                    ['title' => 'Veriden Olasılığa', 'meb_code' => 'MAT.6.7', 'topics' => [
                        'Öznel olasılık',
                        'Eş olası sonuçlar ve basit olaylar',
                        'Veri ile olasılık ilişkisi',
                    ]],
                ],
            ],

            // ─── 3. Fen Bilimleri — 7 ünite ───────────────────────────────────
            [
                'name' => 'Fen Bilimleri', 'slug' => 'fen-bilimleri-6',
                'icon' => '🔬', 'color' => '#2e7d32', 'sort_order' => 3,
                'units' => [
                    ['title' => 'Güneş Sistemi ve Tutulmalar', 'meb_code' => 'FEN.6.1', 'topics' => [
                        'Güneş sistemindeki cisimler',
                        'Gezegen özellikleri ve modeller',
                        'Ay ve Güneş tutulmaları',
                        'Gözlem ve güvenli astronomi bilinci',
                    ]],
                    ['title' => 'Kuvvetin Etkisinde Hareket', 'meb_code' => 'FEN.6.2', 'topics' => [
                        'Kuvvetin yönü ve büyüklüğü',
                        'Bileşke kuvvet; dengelenmiş kuvvetler',
                        'Sürat ve hız kavramları',
                        'Grafik ve tablo ile hareket yorumlama',
                    ]],
                    ['title' => 'Canlılarda Sistemler', 'meb_code' => 'FEN.6.3', 'topics' => [
                        'Üreme ve gelişim (bitki ve hayvan)',
                        'İnsan üreme sistemine genel bakış',
                        'Sinir sistemi ve duyu organları',
                        'Ergenlik ve sağlıklı yaşam',
                    ]],
                    ['title' => 'Işığın Yansıması ve Renkler', 'meb_code' => 'FEN.6.4', 'topics' => [
                        'Yansıma yasası ve düzgün yansıma',
                        'Düzlem ve küresel aynalar',
                        'Beyaz ışığın renklere ayrılması',
                        'Güneş enerjisi ve sürdürülebilirlik',
                    ]],
                    ['title' => 'Maddenin Ayırt Edici Özellikleri', 'meb_code' => 'FEN.6.5', 'topics' => [
                        'Genleşme ve büzülme',
                        'Erime, donma ve kaynama',
                        'Yoğunluk ve ölçüm',
                        'Maddenin hâl değişimi grafikleri',
                    ]],
                    ['title' => 'Elektriğin İletimi ve Direnç', 'meb_code' => 'FEN.6.6', 'topics' => [
                        'İletken ve yalıtkan',
                        'Seri ve paralel devreler',
                        'Direnç kavramına giriş',
                        'Elektrik güvenliği ve tasarruf',
                    ]],
                    ['title' => 'Sürdürülebilir Yaşam ve Etkileşim', 'meb_code' => 'FEN.6.7', 'topics' => [
                        'Biyoçeşitlilik ve ekosistemler',
                        'İnsan faaliyetlerinin çevreye etkisi',
                        'İklim değişikliği farkındalığı',
                        'Proje ve sunum ile paylaşım',
                    ]],
                ],
            ],

            // ─── 4. Sosyal Bilgiler — 6 öğrenme alanı ─────────────────────────
            [
                'name' => 'Sosyal Bilgiler', 'slug' => 'sosyal-bilgiler-6',
                'icon' => '🏛️', 'color' => '#4e342e', 'sort_order' => 4,
                'units' => [
                    ['title' => 'Birlikte Yaşamak', 'meb_code' => 'SOS.6.1', 'topics' => [
                        'Toplumsal roller ve kurallar',
                        'Millî değerler ve ortak kültür',
                        'Toplumsal sorunlara çözüm önerileri',
                        'İş birliği ve müzakere',
                    ]],
                    ['title' => 'Evimiz Dünya', 'meb_code' => 'SOS.6.2', 'topics' => [
                        'Türkiye\'nin coğrafi konumu ve bölgeler',
                        'İklim, yer şekilleri ve yerleşme',
                        'Afet riski ve hazırlık',
                        'Harita becerileri ve ölçek',
                    ]],
                    ['title' => 'Ortak Mirasımız', 'meb_code' => 'SOS.6.3', 'topics' => [
                        'Anadolu uygarlıklarında derinleşme',
                        'Kültürel miras ve koruma',
                        'Tarihî süreçleri kronolojik okuma',
                        'Müze ve arşiv bilinci',
                    ]],
                    ['title' => 'Yaşayan Demokrasimiz', 'meb_code' => 'SOS.6.4', 'topics' => [
                        'Yönetim ve karar alma süreçleri',
                        'Temel hak ve sorumluluklar',
                        'Dijitalleşme ve vatandaşlık',
                        'Hak arama yollarına giriş',
                    ]],
                    ['title' => 'Hayatımızdaki Ekonomi', 'meb_code' => 'SOS.6.5', 'topics' => [
                        'Üretim, dağıtım ve tüketim',
                        'Tasarruf ve yatırım kavramları',
                        'Yerel ve ulusal ekonomiye örnekler',
                        'Sürdürülebilir tüketim',
                    ]],
                    ['title' => 'Teknoloji ve Sosyal Bilimler', 'meb_code' => 'SOS.6.6', 'topics' => [
                        'Ulaşım ve iletişim teknolojileri',
                        'Telif, patent ve fikri mülkiyet bilinci',
                        'Kaynak güvenilirliği ve bilgi okuryazarlığı',
                    ]],
                ],
            ],

            // ─── 5. İngilizce — 10 tema ───────────────────────────────────────
            [
                'name' => 'İngilizce', 'slug' => 'ingilizce-6',
                'icon' => '🇬🇧', 'color' => '#0277bd', 'sort_order' => 5,
                'units' => [
                    ['title' => 'Life (Yaşam)', 'meb_code' => 'ING.6.T1', 'topics' => [
                        'Daily routines and frequency adverbs',
                        'Personal information and hobbies',
                        'Listening for specific information',
                        'Short monologues about myself',
                    ]],
                    ['title' => 'Yummy Breakfast', 'meb_code' => 'ING.6.T2', 'topics' => [
                        'Food and drink vocabulary',
                        'Countable/uncountable (exposure)',
                        'Healthy breakfast habits',
                        'Role-play: ordering and offering',
                    ]],
                    ['title' => 'Downtown', 'meb_code' => 'ING.6.T3', 'topics' => [
                        'Places in a city',
                        'Asking and giving directions',
                        'Prepositions of place',
                        'Reading a simple city map text',
                    ]],
                    ['title' => 'Weather and Emotions', 'meb_code' => 'ING.6.T4', 'topics' => [
                        'Weather and seasons',
                        'Describing feelings',
                        'Comparatives for weather (basic)',
                        'Writing a short weather report',
                    ]],
                    ['title' => 'At the Fair', 'meb_code' => 'ING.6.T5', 'topics' => [
                        'Activities and rides',
                        'Past simple (introduction)',
                        'Listening to short stories about a fair',
                        'Speaking: describing a fun day',
                    ]],
                    ['title' => 'Occupations', 'meb_code' => 'ING.6.T6', 'topics' => [
                        'Jobs and workplaces',
                        'What does he/she do?',
                        'Reading job ads (simplified)',
                        'Writing about a dream job',
                    ]],
                    ['title' => 'Holidays', 'meb_code' => 'ING.6.T7', 'topics' => [
                        'Holiday activities and travel',
                        'Past experiences (simple forms)',
                        'Cultural notes on Turkish holidays (English context)',
                        'Pair interview about a holiday',
                    ]],
                    ['title' => 'Bookworms', 'meb_code' => 'ING.6.T8', 'topics' => [
                        'Book genres and characters',
                        'Reading short excerpts',
                        'Giving opinions about a book',
                        'Writing a mini book review',
                    ]],
                    ['title' => 'Saving the Planet', 'meb_code' => 'ING.6.T9', 'topics' => [
                        'Environmental problems',
                        'Reduce, reuse, recycle',
                        'Should/shouldn\'t for advice (exposure)',
                        'Poster slogan writing in English',
                    ]],
                    ['title' => 'Democracy', 'meb_code' => 'ING.6.T10', 'topics' => [
                        'Rights and responsibilities (basic)',
                        'Classroom democracy and rules',
                        'Listening to short civic texts',
                        'Discussion: fair play and respect',
                    ]],
                ],
            ],

            // ─── 6. Din Kültürü ve Ahlak Bilgisi — 5 ünite ─────────────────────
            [
                'name' => 'Din Kültürü ve Ahlak Bilgisi', 'slug' => 'din-kulturu-ahlak-6',
                'icon' => '🕌', 'color' => '#00695c', 'sort_order' => 6,
                'units' => [
                    ['title' => 'Peygamber ve İlahi Kitap İnancı', 'meb_code' => 'DKAB.6.1', 'topics' => [
                        'Peygamberlik ve rehberlik',
                        'Vahiy ve ilahi kitaplar',
                        'Felak Suresi ve anlamı',
                    ]],
                    ['title' => 'Ramazan ve Oruç', 'meb_code' => 'DKAB.6.2', 'topics' => [
                        'Ramazan ayının anlamı',
                        'Oruç ibadeti ve adabı',
                        'Orucun birey ve topluma katkıları',
                        'İftar duası ve anlamı',
                    ]],
                    ['title' => 'Ahlaki Davranışlar', 'meb_code' => 'DKAB.6.3', 'topics' => [
                        'Doğru sözlülük ve güven',
                        'Merhamet ve yardımseverlik',
                        'Adap ve nezaket kuralları',
                        'Vatan sevgisi',
                        'Kunut dualarına giriş',
                    ]],
                    ['title' => 'Peygamberliğinden Önce Hz. Muhammed', 'meb_code' => 'DKAB.6.4', 'topics' => [
                        'Hz. Muhammed\'in doğduğu çevre',
                        'Aile ve çocukluk',
                        'Gençlik dönemi ve ahlaki örnekler',
                        'Fil Suresi ve anlamı',
                    ]],
                    ['title' => 'Kültürümüzdeki Dinî Motifler', 'meb_code' => 'DKAB.6.5', 'topics' => [
                        'Gelenekte dinin izleri',
                        'Edebiyatımızda dinî motifler',
                        'Musikimizde dinî motifler',
                    ]],
                ],
            ],

            // ─── 7. Görsel Sanatlar — 7 tema (TYMM spiral, 6. sınıf) ───────────
            [
                'name' => 'Görsel Sanatlar', 'slug' => 'gorsel-sanatlar-6',
                'icon' => '🎨', 'color' => '#c2185b', 'sort_order' => 7,
                'units' => [
                    ['title' => 'Sanat ve Toplum', 'meb_code' => 'GOR.6.1', 'topics' => [
                        'Sanatın toplumsal işlevleri',
                        'Görsel okuryazarlık ve yorum',
                    ]],
                    ['title' => 'Görsel İletişim ve Tasarım', 'meb_code' => 'GOR.6.2', 'topics' => [
                        'Grafik ve poster tasarımı',
                        'Tipografi ve düzen ilkeleri',
                    ]],
                    ['title' => 'Geleneksel ve Çağdaş Sanatlar', 'meb_code' => 'GOR.6.3', 'topics' => [
                        'Yerel sanat biçimleri',
                        'Çağdaş sanat akımlarına giriş',
                    ]],
                    ['title' => 'Üç Boyutlu İfade', 'meb_code' => 'GOR.6.4', 'topics' => [
                        'Heykel ve obje tasarımı',
                        'Malzeme ve güvenli kullanım',
                    ]],
                    ['title' => 'Renk, Kompozisyon ve Estetik', 'meb_code' => 'GOR.6.5', 'topics' => [
                        'Renk uyumu ve kontrast',
                        'Kompozisyon dengeleme',
                    ]],
                    ['title' => 'Millî Kültür ve Sanat', 'meb_code' => 'GOR.6.6', 'topics' => [
                        'Millî motifler ve sanatta kullanımı',
                        'Kültürel mirasa saygı',
                    ]],
                    ['title' => 'Sanat Eleştirisi ve Müze Kültürü', 'meb_code' => 'GOR.6.7', 'topics' => [
                        'Eser hakkında görüş bildirme',
                        'Müze ve sergi ziyareti sonrası yansıtma',
                    ]],
                ],
            ],

            // ─── 8. Müzik ─────────────────────────────────────────────────────
            [
                'name' => 'Müzik', 'slug' => 'muzik-6',
                'icon' => '🎵', 'color' => '#6a1b9a', 'sort_order' => 8,
                'units' => [
                    ['title' => 'Dinleme — Söyleme', 'meb_code' => 'MUZ.6.1', 'topics' => [
                        'Genişletilmiş ezgi ve ritim çalışmaları',
                        'Koro ve eşlik etme',
                    ]],
                    ['title' => 'Müziksel Algı ve Bilgilenme', 'meb_code' => 'MUZ.6.2', 'topics' => [
                        'Nota değerleri ve dinamikler',
                        'Dizek üzerinde genişletilmiş aralık',
                    ]],
                    ['title' => 'Türk Müziği ve Kültürümüz', 'meb_code' => 'MUZ.6.3', 'topics' => [
                        'Yerel türkü ve oyun havaları',
                        'Makam farkındalığını derinleştirme',
                    ]],
                    ['title' => 'Müzikte Yaratıcılık ve İş Birliği', 'meb_code' => 'MUZ.6.4', 'topics' => [
                        'Basit düzenleme ve doğaçlama',
                        'Grup performansı ve sahne adabı',
                    ]],
                ],
            ],

            // ─── 9. Bilişim Teknolojileri ve Yazılım — 6 tema ──────────────────
            [
                'name' => 'Bilişim Teknolojileri ve Yazılım', 'slug' => 'bilisim-teknolojileri-6',
                'icon' => '💻', 'color' => '#37474f', 'sort_order' => 9,
                'units' => [
                    ['title' => 'Bilişim Teknolojilerinin Hayatımızdaki Yeri', 'meb_code' => 'BTY.6.1', 'topics' => [
                        'İşletim sistemi ve dosya yönetimi',
                        'BT ile değişen meslekler',
                    ]],
                    ['title' => 'Dijital Ürün Tasarımı ve Geliştirme', 'meb_code' => 'BTY.6.2', 'topics' => [
                        'İleri düzey metin ve sunum',
                        'Görsel düzen ve telif hakları',
                    ]],
                    ['title' => 'Bilgisayar Ağları ve İletişim', 'meb_code' => 'BTY.6.3', 'topics' => [
                        'Ağ türleri ve internet mimarisine giriş',
                        'Güvenli paylaşım',
                    ]],
                    ['title' => 'Bilişim Etiği ve Siber Güvenlik', 'meb_code' => 'BTY.6.4', 'topics' => [
                        'Dijital ayak izi ve gizlilik ayarları',
                        'Siber zorbalıkla mücadele',
                    ]],
                    ['title' => 'Yapay Zekâ', 'meb_code' => 'BTY.6.5', 'topics' => [
                        'YZ çıktılarını doğrulama',
                        'Etik kullanım ve önyargı farkındalığı',
                    ]],
                    ['title' => 'Yazılım Tasarımı ve Programlama', 'meb_code' => 'BTY.6.6', 'topics' => [
                        'Algoritma ve akış şeması',
                        'Blok tabanlı ileri etkinlikler ve hata ayıklama',
                    ]],
                ],
            ],

            // ─── 10. Beden Eğitimi ve Spor — 5 tema ───────────────────────────
            [
                'name' => 'Beden Eğitimi ve Spor', 'slug' => 'beden-egitimi-6',
                'icon' => '⚽', 'color' => '#ef6c00', 'sort_order' => 10,
                'units' => [
                    ['title' => 'Hareket ve Zindelik', 'meb_code' => 'BES.6.1', 'topics' => [
                        'Kardiyovasküler dayanıklılığa giriş',
                        'Esneklik ve kuvvet dengesi',
                    ]],
                    ['title' => 'İşbirlikli Oyunlar', 'meb_code' => 'BES.6.2', 'topics' => [
                        'Takım taktiklerine giriş',
                        'Hakem ve kural bilinci',
                    ]],
                    ['title' => 'Hayalimdeki Oyun', 'meb_code' => 'BES.6.3', 'topics' => [
                        'Yaratıcı hareket ve drama-spor bağlantısı',
                    ]],
                    ['title' => 'Hareketin Estetiği ve Ritmi', 'meb_code' => 'BES.6.4', 'topics' => [
                        'Ritim ve müzikle senkron hareket',
                        'Folklor ve temel adımlar',
                    ]],
                    ['title' => 'Daha Hızlı, Daha Yükseğe, Daha Güçlü ve Birlikte', 'meb_code' => 'BES.6.5', 'topics' => [
                        'Atletizm branşlarında teknik gelişim',
                        'İş birliği ile müsabaka hazırlığı',
                        'Fiziksel aktivite günlüğü',
                    ]],
                ],
            ],
        ];
    }
}
