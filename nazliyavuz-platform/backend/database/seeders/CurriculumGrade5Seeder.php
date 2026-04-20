<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * 5. Sınıf — MEB Türkiye Yüzyılı Maarif Modeli (TYMM) ortaokul / temel eğitim öğretim programları
 * ve TEGM 2025-2026 Eğitim Öğretim Dönemi Çerçeve Yıllık Planları ile uyumlu müfredat ağacı.
 *
 * Kaynak özeti (2025-2026):
 * - TEGM çerçeve planları: https://tegm.meb.gov.tr/www/2025-2026-egitim-ogretim-donemi-cerceve-yillik-planlari/
 * - TYMM öğretim programları: https://tymm.meb.gov.tr/ogretim-programlari/
 * - Türkçe: 6 tema (Dinleme/İzleme, Okuma, Konuşma, Yazma öğrenme alanları üzerinden)
 * - Matematik: 6 öğrenme alanı (Sayılar ve Nicelikler 1-2, Cebirsel düşünme, Geometrik şekiller/nicelikler, İstatistik)
 * - Fen Bilimleri: 7 ünite
 * - Sosyal Bilgiler: 6 öğrenme alanı
 * - İngilizce: 8 tema (TYMM temel eğitim İngilizce)
 * - DKAB: 5 ünite
 * - Görsel Sanatlar: 7 tema
 * - Müzik, BTY, Beden: TYMM program yapısına göre ünite/tema düzeyi
 *
 * Bu seeder yalnızca grade=5 derslerini günceller; diğer sınıflara dokunmaz.
 */
class CurriculumGrade5Seeder extends Seeder
{
    public function run(): void
    {
        $this->purgeGrade5Curriculum();

        $curriculum = $this->getGrade5Curriculum();

        foreach ($curriculum as $subjectData) {
            $subjectId = DB::table('curriculum_subjects')->insertGetId([
                'name'       => $subjectData['name'],
                'slug'       => $subjectData['slug'],
                'icon'       => $subjectData['icon'],
                'color'      => $subjectData['color'],
                'grade'      => '5',
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
                        $q2->select('id')->from('curriculum_subjects')->where('grade', '5');
                    });
            })->count();

        $this->command->info("CurriculumGrade5Seeder: ".count($curriculum)." ders, {$topicCount} konu (5. sınıf) yazıldı.");
    }

    private function purgeGrade5Curriculum(): void
    {
        $subjectIds = DB::table('curriculum_subjects')->where('grade', '5')->pluck('id');
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

    private function getGrade5Curriculum(): array
    {
        return [
            // ─── 1. Türkçe — 6 tema (TYMM 5. sınıf) ───────────────────────────
            [
                'name' => 'Türkçe', 'slug' => 'turkce-5',
                'icon' => '📖', 'color' => '#c62828', 'sort_order' => 1,
                'units' => [
                    ['title' => 'Oyun Dünyası', 'meb_code' => 'TRK.5.T1', 'topics' => [
                        'Dinleme/izleme: Oyun ve dijital metinlerde ana fikri belirleme',
                        'Okuma: Hikâye ve betimleyici metinlerde sözcükte anlam',
                        'Konuşma: Rol ve kurallar üzerine tartışma ve görgü kuralları',
                        'Yazım ve noktalama: Yönerge ve kısa açıklama yazıları',
                        'Değerler ve metin: Sorumluluk, dürüstlük, öz güven',
                    ]],
                    ['title' => 'Atatürk\'ü Tanımak', 'meb_code' => 'TRK.5.T2', 'topics' => [
                        'Okuma: Atatürk\'ün hayatı ve çevresiyle ilgili bilgilendirici metinler',
                        'Ana düşünce ve yardımcı düşünceleri belirleme',
                        'Konuşma: Sunum ve kısa sözlü anlatım (vatandaşlık değerleri)',
                        'Yazma: Bilgilendirici metin (öz, başlık, paragraf düzeni)',
                        'Sözcükte anlam: Eş anlamlı, zıt anlamlı, çok anlamlılık',
                    ]],
                    ['title' => 'Duygularımı Tanıyorum', 'meb_code' => 'TRK.5.T3', 'topics' => [
                        'Dinleme/izleme: Duygu ve düşünceyi ifade eden metinleri yorumlama',
                        'Okuma: Şiir ve öyküde duygu aktarımı, imgeler',
                        'Konuşma: Empati ve duygu ifadesi; nazik geri bildirim',
                        'Yazma: Günlük, duygu içeren kısa yazılar',
                        'Ses bilgisi: Vurgu, tonlama, duraklama',
                    ]],
                    ['title' => 'Geleneklerimiz', 'meb_code' => 'TRK.5.T4', 'topics' => [
                        'Okuma: Gelenek, töre ve kültürel miras metinleri',
                        'Sözlü kültür ürünleri (atasözü, deyim, tekerleme)',
                        'Konuşma: Tartışma ve görüş geliştirme',
                        'Yazma: Kısa hikâye veya anı yazısı',
                        'Yazım ve noktalama kuralları',
                    ]],
                    ['title' => 'İletişim ve Sosyal İlişkiler', 'meb_code' => 'TRK.5.T5', 'topics' => [
                        'Okuma: Haber, duyuru, reklam metinleri; grafik ve görselle destekli metin',
                        'Dijital okuryazarlık ve güvenli iletişim',
                        'Konuşma: Grup içi görev paylaşımı ve iş birlikli konuşma',
                        'Yazma: E-posta, mesaj ve kısa bilgilendirici yazı',
                        'Cümlede anlam: Neden-sonuç, amaç-araç, koşul',
                    ]],
                    ['title' => 'Sağlıklı Yaşıyorum', 'meb_code' => 'TRK.5.T6', 'topics' => [
                        'Okuma: Sağlık ve bilim içerikli metinler; paragraf tamamlama',
                        'Grafik ve tablo yorumlama',
                        'Yazma: Poster metni, yönerge, kısa rapor',
                        'Anlatım bozukluklarını tanıma',
                        'Sözcük türleri ve cümle ögelerine ilişkin temel uygulamalar',
                    ]],
                ],
            ],

            // ─── 2. Matematik — 6 öğrenme alanı (TYMM) ─────────────────────────
            [
                'name' => 'Matematik', 'slug' => 'matematik-5',
                'icon' => '📐', 'color' => '#1565c0', 'sort_order' => 2,
                'units' => [
                    ['title' => 'Sayılar ve Nicelikler (1)', 'meb_code' => 'MAT.5.1', 'topics' => [
                        'Çok basamaklı doğal sayılar ve basamak kavramı',
                        'Doğal sayılarda toplama ve çıkarma',
                        'Doğal sayılarda çarpma ve bölme',
                        'Problem kurma ve çözme (dört işlem)',
                        'Yuvarlama ve kestirme',
                    ]],
                    ['title' => 'Sayılar ve Nicelikler (2)', 'meb_code' => 'MAT.5.2', 'topics' => [
                        'Kesir kavramı ve kesir modelleri',
                        'Birim kesir, bileşik kesir ve tam sayılı kesirler',
                        'Kesirlerde toplama ve çıkarma',
                        'Ondalık gösterim (virgüllü sayılar) ve kesir ilişkisi',
                        'Kesir ve ondalık içeren problemler',
                    ]],
                    ['title' => 'İşlemlerle Cebirsel Düşünme', 'meb_code' => 'MAT.5.3', 'topics' => [
                        'Eşitlik ve denklem fikri',
                        'İşlem önceliği ve parantez kullanımı',
                        'Sayı örüntüleri ve ilişkiler',
                        'Harfli ifadeye giriş (basit durumlar)',
                        'Tablo ve grafikle ilişkilendirme',
                    ]],
                    ['title' => 'Geometrik Şekiller', 'meb_code' => 'MAT.5.4', 'topics' => [
                        'Açı ve açı ölçme',
                        'Üçgen ve çokgenlerin özellikleri',
                        'Çember ve daire; merkez, yarıçap, çap',
                        'Geometrik çizim ve modelleme',
                        'Dönüşüm geometrisine giriş (öteleme, basit simetri)',
                    ]],
                    ['title' => 'Geometrik Nicelikler', 'meb_code' => 'MAT.5.5', 'topics' => [
                        'Dikdörtgenin çevre ve alanı',
                        'Karenin çevre ve alanı',
                        'Birleşik şekillerde alan yaklaşımı',
                        'Birim kare ile alan tahmini',
                        'Gerçek yaşam geometri problemleri',
                    ]],
                    ['title' => 'İstatistiksel Araştırma Süreci', 'meb_code' => 'MAT.5.6', 'topics' => [
                        'Veri toplama ve sınıflandırma',
                        'Sütun ve çizgi grafikleri oluşturma',
                        'Grafik ve tablo yorumlama',
                        'Aritmetik ortalama (ortalama)',
                        'Araştırma sorusu oluşturma ve sonuçları sunma',
                    ]],
                ],
            ],

            // ─── 3. Fen Bilimleri — 7 ünite ────────────────────────────────────
            [
                'name' => 'Fen Bilimleri', 'slug' => 'fen-bilimleri-5',
                'icon' => '🔬', 'color' => '#2e7d32', 'sort_order' => 3,
                'units' => [
                    ['title' => 'Gökyüzündeki Komşularımız ve Biz', 'meb_code' => 'FEN.5.1', 'topics' => [
                        'Güneş, Dünya ve Ay\'ın yapısı',
                        'Dünya\'nın Güneş etrafında dolanması ve mevsimler',
                        'Ay\'ın evreleri ve gözleme dayalı çıkarımlar',
                        'Model ve şema kullanarak açıklama',
                        'Güvenli güneş gözlemi ve bilimsel tutum',
                    ]],
                    ['title' => 'Kuvveti Tanıyalım', 'meb_code' => 'FEN.5.2', 'topics' => [
                        'Kuvvetin tanımı ve ölçümü (dinamometre)',
                        'Kütle ve ağırlık ilişkisi',
                        'Sürtünme kuvveti ve günlük yaşam örnekleri',
                        'Kuvvetin cisimler üzerindeki etkileri',
                        'Deney ve değişkenleri kontrol etme',
                    ]],
                    ['title' => 'Canlıların Yapısına Yolculuk', 'meb_code' => 'FEN.5.3', 'topics' => [
                        'Hücre kavramı ve gözlem (mikroskop)',
                        'Bitki ve hayvan hücresi benzerlik ve farklılıkları',
                        'Doku, organ, sistem ilişkisi',
                        'Destek ve hareket sistemine genel bakış',
                        'Canlıları koruma ve sürdürülebilirlik',
                    ]],
                    ['title' => 'Işığın Dünyası', 'meb_code' => 'FEN.5.4', 'topics' => [
                        'Işığın doğrusal yayılması',
                        'Gölge oluşumu ve gölge boyunu etkileyen faktörler',
                        'Şeffaf/opak cisimler',
                        'Basit optik deneyler',
                        'Göz sağlığı ve ışık güvenliği',
                    ]],
                    ['title' => 'Maddenin Doğası', 'meb_code' => 'FEN.5.5', 'topics' => [
                        'Maddenin tanecikli yapısı',
                        'Isı ve sıcaklık farkı',
                        'Isı iletimi (iletken ve yalıtkan)',
                        'Isı yalıtımı ve enerji tasarrufu',
                        'Maddenin hâl değişimi (temel gözlemler)',
                    ]],
                    ['title' => 'Yaşamımızdaki Elektrik', 'meb_code' => 'FEN.5.6', 'topics' => [
                        'Basit elektrik devresi elemanları',
                        'Devre şeması okuma ve çizme',
                        'Pil ve ampul bağlantıları',
                        'Elektrik güvenliği',
                        'Yenilenebilir enerji farkındalığı',
                    ]],
                    ['title' => 'Sürdürülebilir Yaşam ve Geri Dönüşüm', 'meb_code' => 'FEN.5.7', 'topics' => [
                        'Atık türleri ve geri dönüşüm',
                        'Kaynakların etkin kullanımı',
                        'Çevre kirliliği ve bireysel sorumluluk',
                        'Sürdürülebilir tüketim alışkanlıkları',
                        'Proje ve sunum ile paylaşım',
                    ]],
                ],
            ],

            // ─── 4. Sosyal Bilgiler — 6 öğrenme alanı ──────────────────────────
            [
                'name' => 'Sosyal Bilgiler', 'slug' => 'sosyal-bilgiler-5',
                'icon' => '🏛️', 'color' => '#4e342e', 'sort_order' => 4,
                'units' => [
                    ['title' => 'Birlikte Yaşamak', 'meb_code' => 'SOS.5.1', 'topics' => [
                        'Gruplar, roller ve sorumluluklar',
                        'Hak ve sorumluluk dengesi',
                        'Kültürel çeşitliliğe saygı',
                        'Yardımlaşma ve dayanışma örnekleri',
                        'Okul ve mahallede iş birliği',
                    ]],
                    ['title' => 'Evimiz Dünya', 'meb_code' => 'SOS.5.2', 'topics' => [
                        'Yaşadığımız yerin coğrafi özellikleri',
                        'Doğal ve beşerî çevre unsurları',
                        'Afetlere hazırlık ve güvenlik',
                        'Komşu ülkeler ve ilişkiler (temel)',
                        'Harita ve ölçek kullanımı',
                    ]],
                    ['title' => 'Ortak Mirasımız', 'meb_code' => 'SOS.5.3', 'topics' => [
                        'Somut ve somut olmayan kültürel miras',
                        'Anadolu\'da ilk yerleşimler',
                        'Mezopotamya ve Anadolu uygarlıklarına giriş',
                        'Müze ve koruma bilinci',
                        'Tarihî mekânları tanıma',
                    ]],
                    ['title' => 'Yaşayan Demokrasimiz', 'meb_code' => 'SOS.5.4', 'topics' => [
                        'Demokrasi ve katılım',
                        'Cumhuriyet ve vatandaşlık',
                        'Temel hak ve özgürlükler',
                        'Seçim ve temsil kavramları',
                        'Okul meclisi ve demokratik karar alma',
                    ]],
                    ['title' => 'Hayatımızdaki Ekonomi', 'meb_code' => 'SOS.5.5', 'topics' => [
                        'İhtiyaç ve istek ayrımı',
                        'Kaynakların verimli kullanımı',
                        'Bütçe ve tasarruf alışkanlığı',
                        'Yerel ekonomik faaliyetler',
                        'Tüketici haklarına giriş',
                    ]],
                    ['title' => 'Teknoloji ve Sosyal Bilimler', 'meb_code' => 'SOS.5.6', 'topics' => [
                        'Teknolojik ürünlerin günlük yaşamdaki yeri',
                        'Buluşların toplumsal etkileri',
                        'Bilimsel düşünme ve kaynak güvenilirliği',
                        'Dijital vatandaşlık ve etik kullanım',
                        'Kısa araştırma ve sunum',
                    ]],
                ],
            ],

            // ─── 5. İngilizce — 8 tema ─────────────────────────────────────────
            [
                'name' => 'İngilizce', 'slug' => 'ingilizce-5',
                'icon' => '🇬🇧', 'color' => '#0277bd', 'sort_order' => 5,
                'units' => [
                    ['title' => 'Classroom Life (Sınıf Yaşamı)', 'meb_code' => 'ING.5.T1', 'topics' => [
                        'Classroom objects, rules and instructions',
                        'School subjects and timetables',
                        'Days and time expressions',
                        'Listening for gist and specific information',
                        'Short guided dialogues and pronunciation',
                    ]],
                    ['title' => 'Family Life (Aile Yaşamı)', 'meb_code' => 'ING.5.T2', 'topics' => [
                        'Family members and descriptions',
                        'Possessive structures (basic)',
                        'Simple present routines',
                        'Reading short family texts',
                        'Writing a short paragraph about my family',
                    ]],
                    ['title' => 'Life in Nature (Doğada Yaşam)', 'meb_code' => 'ING.5.T3', 'topics' => [
                        'Animals and habitats',
                        'Adjectives for description',
                        'Listening to descriptions of wildlife',
                        'Environmental awareness phrases',
                        'Speaking: describing a favourite animal',
                    ]],
                    ['title' => 'Life in the Neighbourhood & City', 'meb_code' => 'ING.5.T4', 'topics' => [
                        'Places in a town (park, hospital, market)',
                        'Asking and giving directions (basic)',
                        'Reading signs and short notices',
                        'There is / There are (introduction)',
                        'Writing a short neighbourhood text',
                    ]],
                    ['title' => 'Life in the Universe & Future', 'meb_code' => 'ING.5.T5', 'topics' => [
                        'Space and planets (basic vocabulary)',
                        'Future with going to (exposure level)',
                        'Listening to short science clips',
                        'Speaking: simple predictions',
                        'Creative writing: a short imaginative text',
                    ]],
                    ['title' => 'Life in the World', 'meb_code' => 'ING.5.T6', 'topics' => [
                        'Countries and nationalities',
                        'Cultural similarities and differences',
                        'Festivals and celebrations',
                        'Reading simple cultural texts',
                        'Intercultural respect and politeness',
                    ]],
                    ['title' => 'Personal Life', 'meb_code' => 'ING.5.T7', 'topics' => [
                        'Daily routines and hobbies',
                        'Feelings and simple adjectives',
                        'Talking about likes and dislikes',
                        'Reading diary-style short texts',
                        'Writing about a typical day',
                    ]],
                    ['title' => 'School Life', 'meb_code' => 'ING.5.T8', 'topics' => [
                        'School events and clubs',
                        'Making suggestions (Let\'s …)',
                        'Listening to announcements',
                        'Pair work and collaborative tasks',
                        'Mini project presentation in English',
                    ]],
                ],
            ],

            // ─── 6. Din Kültürü ve Ahlak Bilgisi — 5 ünite ─────────────────────
            [
                'name' => 'Din Kültürü ve Ahlak Bilgisi', 'slug' => 'din-kulturu-ahlak-5',
                'icon' => '🕌', 'color' => '#00695c', 'sort_order' => 6,
                'units' => [
                    ['title' => 'Allah İnancı', 'meb_code' => 'DKAB.5.1', 'topics' => [
                        'Evrendeki düzen ve akıl yürütme',
                        'Gözlemle Allah\'ın varlığı ve birliği hakkında düşünme',
                        'Allah\'ın güzel isimleri',
                        'İhlas suresi ve anlamına yönelik çalışmalar',
                    ]],
                    ['title' => 'Namaz', 'meb_code' => 'DKAB.5.2', 'topics' => [
                        'Namaz ibadetinin özeti ve anlamı',
                        'Namazın kılınışına ilişkin gözlem ve özetleme',
                        'Namazın hayat üzerindeki etkileri üzerine düşünme',
                        'Tahiyyat duası ve anlamı',
                    ]],
                    ['title' => 'Kur\'an-ı Kerim', 'meb_code' => 'DKAB.5.3', 'topics' => [
                        'Kur\'an-ı Kerim\'in yapısına genel bakış',
                        'Sure ve ayet okuma adabı',
                        'Anlamlandırma ve günlük hayatla ilişkilendirme',
                    ]],
                    ['title' => 'Peygamber Kıssaları', 'meb_code' => 'DKAB.5.4', 'topics' => [
                        'Peygamber örnekliği ve ahlaki mesajlar',
                        'Kıssa metinlerini okuma ve yorumlama',
                        'Öz denetim ve sorumluluk değerleri',
                    ]],
                    ['title' => 'Mimarimizde Dinî Motifler', 'meb_code' => 'DKAB.5.5', 'topics' => [
                        'Cami ve kültürel yapılarda sanat unsurları',
                        'Estetik ve manevi değerler',
                        'Kültürel mirasa saygı',
                    ]],
                ],
            ],

            // ─── 7. Görsel Sanatlar — 7 tema ───────────────────────────────────
            [
                'name' => 'Görsel Sanatlar', 'slug' => 'gorsel-sanatlar-5',
                'icon' => '🎨', 'color' => '#c2185b', 'sort_order' => 7,
                'units' => [
                    ['title' => 'Hayat ve Sanat', 'meb_code' => 'GOR.5.1', 'topics' => [
                        'Sanat ve iletişim ilişkisi',
                        'Yazı ve görsel birlikte kullanımı',
                        'İnceleme ve yorumlama',
                    ]],
                    ['title' => 'Sanatın Görsel Dili', 'meb_code' => 'GOR.5.2', 'topics' => [
                        'Nokta, çizgi, şekil ve doku',
                        'Sanat elemanları ve tasarım ilkeleri',
                        'Dijital ve geleneksel araçlar',
                    ]],
                    ['title' => 'Sanatçılar ve Eserleri', 'meb_code' => 'GOR.5.3', 'topics' => [
                        'Yerel ve ulusal sanatçı örnekleri',
                        'Eser inceleme ve duygu düşünceyi ifade etme',
                    ]],
                    ['title' => 'Çizim ve Görsel İfade', 'meb_code' => 'GOR.5.4', 'topics' => [
                        'Ölçü ve oran',
                        'Figür ve perspektife giriş',
                        'Üretim süreci planlama',
                    ]],
                    ['title' => 'Renk ve Estetik', 'meb_code' => 'GOR.5.5', 'topics' => [
                        'Renk teorisi ve uyum',
                        'Natürmort ve doku çalışmaları',
                    ]],
                    ['title' => 'Millî Değerler ve Sanat', 'meb_code' => 'GOR.5.6', 'topics' => [
                        'Millî kültür ve sanatta yansımaları',
                        'Saygı ve sorumlulukla üretim',
                    ]],
                    ['title' => 'Müze ve Kültür', 'meb_code' => 'GOR.5.7', 'topics' => [
                        'Müze ve sergi kültürü',
                        'Kültürel mirası tanıma ve koruma',
                    ]],
                ],
            ],

            // ─── 8. Müzik ─────────────────────────────────────────────────────
            [
                'name' => 'Müzik', 'slug' => 'muzik-5',
                'icon' => '🎵', 'color' => '#6a1b9a', 'sort_order' => 8,
                'units' => [
                    ['title' => 'Dinleme — Söyleme', 'meb_code' => 'MUZ.5.1', 'topics' => [
                        'İstiklal Marşı\'nı anlamına uygun seslendirme',
                        'Farklı ritmik yapılardaki ezgilere giriş',
                        'Gürlük ve tempo değişimlerini uygulama',
                    ]],
                    ['title' => 'Müziksel Algı ve Bilgilenme', 'meb_code' => 'MUZ.5.2', 'topics' => [
                        'Basit ölçüler (3/4, 4/4)',
                        'Ses uzunlukları ve incelik-kalınlık',
                        'Dizek üzerinde re-la aralığı',
                    ]],
                    ['title' => 'Türk Müziği ve Kültürümüz', 'meb_code' => 'MUZ.5.3', 'topics' => [
                        'Makamsal yapıya temel farkındalık (rast, hüseyni)',
                        'Yerel ezgilere saygı ve dinleme',
                    ]],
                    ['title' => 'Müzikte İş Birliği', 'meb_code' => 'MUZ.5.4', 'topics' => [
                        'Ritim çalgılarıyla bölüm ayırt etme',
                        'Grup çalışması ve sahne adabı',
                    ]],
                ],
            ],

            // ─── 9. Bilişim Teknolojileri ve Yazılım — 6 tema ──────────────────
            [
                'name' => 'Bilişim Teknolojileri ve Yazılım', 'slug' => 'bilisim-teknolojileri-5',
                'icon' => '💻', 'color' => '#37474f', 'sort_order' => 9,
                'units' => [
                    ['title' => 'Bilişim Teknolojilerinin Hayatımızdaki Yeri', 'meb_code' => 'BTY.5.1', 'topics' => [
                        'Donanım ve yazılım temel kavramları',
                        'Günlük yaşamda BT ürünleri',
                        'Güvenli ve ergonomik kullanım',
                    ]],
                    ['title' => 'Dijital Ürün Tasarımı ve Geliştirme', 'meb_code' => 'BTY.5.2', 'topics' => [
                        'Kelime işlemci ile metin düzenleme',
                        'Sunum hazırlama ve görsel düzen',
                        'Basit dijital ürün paylaşımı',
                    ]],
                    ['title' => 'Bilgisayar Ağları ve İletişim', 'meb_code' => 'BTY.5.3', 'topics' => [
                        'İnternet ve ağ kavramları',
                        'Güvenli iletişim ve gizlilik',
                    ]],
                    ['title' => 'Bilişim Etiği ve Siber Güvenlik', 'meb_code' => 'BTY.5.4', 'topics' => [
                        'Dijital ayak izi ve kişisel veri',
                        'Siber zorbalık ve yardım isteme',
                        'Etik kullanım ve telif farkındalığı',
                    ]],
                    ['title' => 'Yapay Zeka', 'meb_code' => 'BTY.5.5', 'topics' => [
                        'YZ\'nin günlük yaşamdaki örnekleri',
                        'Eleştirel bakış ve doğruluk kontrolü',
                    ]],
                    ['title' => 'Yazılım Tasarımı ve Programlama', 'meb_code' => 'BTY.5.6', 'topics' => [
                        'Algoritmik düşünme ve akış şeması',
                        'Blok tabanlı programlamaya giriş',
                        'Hata ayıklama ve test etme',
                    ]],
                ],
            ],

            // ─── 10. Beden Eğitimi ve Spor — 5 tema ───────────────────────────
            [
                'name' => 'Beden Eğitimi ve Spor', 'slug' => 'beden-egitimi-5',
                'icon' => '⚽', 'color' => '#ef6c00', 'sort_order' => 10,
                'units' => [
                    ['title' => 'Hareket ve Zindelik', 'meb_code' => 'BES.5.1', 'topics' => [
                        'Isınma ve soğuma alışkanlığı',
                        'Temel motor becerileri ve koordinasyon',
                        'Fiziksel aktivite yoğunluğu ve nabız farkındalığı',
                    ]],
                    ['title' => 'İşbirlikli Oyunlar', 'meb_code' => 'BES.5.2', 'topics' => [
                        'Takım içi roller ve iletişim',
                        'Kurallı oyun ve adil oyun',
                    ]],
                    ['title' => 'Hayalimdeki Oyun', 'meb_code' => 'BES.5.3', 'topics' => [
                        'Yaratıcı hareket ve dramatizasyon',
                        'Güvenli alan kullanımı',
                    ]],
                    ['title' => 'Hareketin Estetiği ve Ritmi', 'meb_code' => 'BES.5.4', 'topics' => [
                        'Ritim ve müzikle hareket',
                        'Dans ve ifade becerilerine giriş',
                    ]],
                    ['title' => 'Daha Hızlı, Daha Yükseğe, Daha Güçlü ve Birlikte', 'meb_code' => 'BES.5.5', 'topics' => [
                        'Atletizm temelleri (koşu, sıçrama, atma giriş)',
                        'Rekabet değil gelişim odaklı müsabaka hazırlığı',
                        'Aktif ve sağlıklı yaşam hedefleri',
                    ]],
                ],
            ],
        ];
    }
}
