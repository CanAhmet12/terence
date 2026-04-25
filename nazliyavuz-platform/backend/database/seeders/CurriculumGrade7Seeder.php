<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Database\Seeders\Concerns\InsertsCurriculumSubjects;

/**
 * 7. Sınıf — MEB TYMM ortaokul öğretim programları ve TEGM çerçeve planları ile uyumlu müfredat ağacı.
 * Türkçe: tymm.meb.gov.tr Ortaokul Türkçe 7. sınıf tema başlıkları.
 * Matematik / Fen: TYMM öğrenme alanı ve ünite başlıkları (2025-2026 program yapısı).
 * Bu seeder yalnızca grade=7 ve exam_type=all kayıtlarını günceller.
 */
class CurriculumGrade7Seeder extends Seeder
{
    use InsertsCurriculumSubjects;

    public function run(): void
    {
        $this->purgeByGradeAndExamType('7', 'all');
        $data = $this->getGrade7Curriculum();
        $this->insertCurriculumSubjects($data);
        $this->command->info('CurriculumGrade7Seeder: '.count($data).' ders (7. sınıf) yazıldı.');
    }

    private function getGrade7Curriculum(): array
    {
        return [
            [
                'name' => 'Türkçe', 'slug' => 'turkce-7',
                'icon' => '📖', 'color' => '#c62828', 'grade' => '7', 'exam_type' => 'all', 'sort_order' => 1,
                'units' => [
                    ['title' => 'Hayat Boyu Gelişim', 'meb_code' => 'TRK.7.T1', 'topics' => [
                        'Dinleme/izleme: hedef ve planlama içerikleri',
                        'Okuma: bilgilendirici ve yönerge metinleri',
                        'Konuşma: sunum ve öz değerlendirme',
                        'Yazma: plan, özet ve yansıtma metni',
                        'Öz disiplin ve sürekli gelişim değerleri',
                    ]],
                    ['title' => 'Bir Hilal Uğruna', 'meb_code' => 'TRK.7.T2', 'topics' => [
                        'Okuma: vatan, bağımsızlık ve tarihî süreç metinleri',
                        'Sözlü anlatım ve duygusal tonlama',
                        'Yazma: duygu ve düşünceyi aktaran metinler',
                        'Değerler: vatanseverlik, fedakârlık, birlik',
                    ]],
                    ['title' => 'İletişim ve Sosyal İlişkiler', 'meb_code' => 'TRK.7.T3', 'topics' => [
                        'Dijital ve yüz yüze iletişim kuralları',
                        'Haber, duyuru ve reklam metinleri',
                        'Konuşma: tartışma ve empati',
                        'Yazma: e-posta, mesaj ve kısa duyuru',
                    ]],
                    ['title' => 'Türk Sanatı', 'meb_code' => 'TRK.7.T4', 'topics' => [
                        'Şiir, musiki ve görsel sanatlarla ilişkili metinler',
                        'Sanat eleştirisi ve estetik yorum',
                        'Sözlü kültür ve geleneksel sanat unsurları',
                        'Yazma: sanat etkinliği tanıtımı',
                    ]],
                    ['title' => 'Okuma Kültürü', 'meb_code' => 'TRK.7.T5', 'topics' => [
                        'Okuma alışkanlığı ve metin seçimi',
                        'Kütüphane ve dijital kaynak kullanımı',
                        'Kitap özeti ve karşılaştırmalı okuma',
                        'Yazma: okuma günlüğü ve inceleme yazısı',
                    ]],
                    ['title' => 'Hak ve Sorumluluklar', 'meb_code' => 'TRK.7.T6', 'topics' => [
                        'Hak, sorumluluk ve adalet metinleri',
                        'Vatandaşlık ve demokrasi ile ilgili metinler',
                        'Konuşma: gerekçeli görüş bildirme',
                        'Yazma: hak arama yollarına ilişkin bilgilendirici yazı',
                    ]],
                ],
            ],
            [
                'name' => 'Matematik', 'slug' => 'matematik-7',
                'icon' => '📐', 'color' => '#1565c0', 'grade' => '7', 'exam_type' => 'all', 'sort_order' => 2,
                'units' => [
                    ['title' => 'Sayılar ve Nicelikler (1)', 'meb_code' => 'MAT.7.1', 'topics' => [
                        'Tam sayılar ve rasyonel sayılar',
                        'Rasyonel sayılarda işlemler',
                        'Sayı doğrusu ve sıralama',
                    ]],
                    ['title' => 'Sayılar ve Nicelikler (2)', 'meb_code' => 'MAT.7.2', 'topics' => [
                        'Üslü ifadeler ve bilimsel gösterim',
                        'Köklü ifadeler ve gerçek sayılar',
                        'Üs çarpanları ve asal çarpanlara ayırma',
                    ]],
                    ['title' => 'İşlemlerle Cebirsel Düşünme ve Değişimler', 'meb_code' => 'MAT.7.3', 'topics' => [
                        'Cebirsel ifadeler ve özdeşlikler',
                        'Birinci dereceden bir bilinmeyenli denklem ve eşitsizlik',
                        'İki bilinmeyenli doğrusal denklem sistemleri',
                    ]],
                    ['title' => 'Dönüşüm', 'meb_code' => 'MAT.7.4', 'topics' => [
                        'Öteleme, yansıma ve dönme',
                        'Koordinat düzleminde dönüşümler',
                        'Eşlik ve benzerlik ilişkisi',
                    ]],
                    ['title' => 'Geometrik Nicelikler (1)', 'meb_code' => 'MAT.7.5', 'topics' => [
                        'Çember ve dairede çevre ve alan',
                        'Prizma ve silindirde yüzey alanı ve hacim',
                    ]],
                    ['title' => 'Geometrik Nicelikler (2)', 'meb_code' => 'MAT.7.6', 'topics' => [
                        'Üçgende alan ve Pisagor teoremi',
                        'Birleşik şekillerde alan ve hacim',
                    ]],
                    ['title' => 'Geometrik Şekiller', 'meb_code' => 'MAT.7.7', 'topics' => [
                        'Üçgende açı ve kenar ilişkileri',
                        'Çokgenler ve özel dörtgenler',
                        'Üçgenlerde eşlik ve benzerlik',
                    ]],
                    ['title' => 'İstatistiksel Araştırma Süreci', 'meb_code' => 'MAT.7.8', 'topics' => [
                        'Veri toplama ve grafikler',
                        'Merkezi eğilim ve yayılım ölçüleri',
                        'Araştırma sorusu ve yorum',
                    ]],
                    ['title' => 'Veriden Olasılığa', 'meb_code' => 'MAT.7.9', 'topics' => [
                        'Basit olayların olasılığı',
                        'Veri ile olasılık ilişkisi',
                        'Öznel olasılık ve tahmin',
                    ]],
                ],
            ],
            [
                'name' => 'Fen Bilimleri', 'slug' => 'fen-bilimleri-7',
                'icon' => '🔬', 'color' => '#2e7d32', 'grade' => '7', 'exam_type' => 'all', 'sort_order' => 3,
                'units' => [
                    ['title' => 'Uzay Çağı', 'meb_code' => 'FEN.7.1', 'topics' => [
                        'Güneş sistemi ve ötesi',
                        'Yıldız ve galaksi kavramları',
                        'Uzay teknolojileri ve sürdürülebilirlik',
                    ]],
                    ['title' => 'Kuvvet ve Enerjiyi Keşfedelim', 'meb_code' => 'FEN.7.2', 'topics' => [
                        'İş, güç, enerji ve verim',
                        'Kuvvet, kütle ve ivme ilişkisi',
                        'Enerji dönüşümleri ve günlük yaşam',
                    ]],
                    ['title' => 'Vücudumuzdaki Sistemler', 'meb_code' => 'FEN.7.3', 'topics' => [
                        'Destek ve hareket, sindirim, solunum, dolaşım',
                        'Sinir ve endokrin sistemlere genel bakış',
                        'Sağlıklı yaşam ve organ bağışı bilinci',
                    ]],
                    ['title' => 'Işığın Kırılması ve Mercekler', 'meb_code' => 'FEN.7.4', 'topics' => [
                        'Kırılma ve kırılma açısı',
                        'İnce ve kalın kenarlı mercekler',
                        'Görme ve gözlük kullanımı',
                    ]],
                    ['title' => 'Maddenin Doğasına Yolculuk', 'meb_code' => 'FEN.7.5', 'topics' => [
                        'Atom ve molekül modelleri',
                        'Fiziksel ve kimyasal değişim',
                        'Karışımlar ve ayırma yöntemleri',
                    ]],
                    ['title' => 'Elektriklenme', 'meb_code' => 'FEN.7.6', 'topics' => [
                        'Sürtünme ile elektriklenme',
                        'İletken ve yalıtkan; elektrostatik kuvvet',
                        'Günlük yaşamda elektriklenme ve güvenlik',
                    ]],
                    ['title' => 'Sürdürülebilir Yaşam ve Geri Dönüşüm', 'meb_code' => 'FEN.7.7', 'topics' => [
                        'Atık yönetimi ve geri dönüşüm',
                        'Kaynakların etkin kullanımı',
                        'Çevre ve iklim bilinci',
                    ]],
                ],
            ],
            [
                'name' => 'Sosyal Bilgiler', 'slug' => 'sosyal-bilgiler-7',
                'icon' => '🏛️', 'color' => '#4e342e', 'grade' => '7', 'exam_type' => 'all', 'sort_order' => 4,
                'units' => [
                    ['title' => 'Birlikte Yaşamak', 'meb_code' => 'SOS.7.1', 'topics' => [
                        'Toplumsal roller ve kurallar',
                        'Farklılıklarla yaşama ve hoşgörü',
                        'Çatışma çözümü ve iş birliği',
                    ]],
                    ['title' => 'Evimiz Dünya', 'meb_code' => 'SOS.7.2', 'topics' => [
                        'Türkiye\'nin coğrafi konumu ve bölgeler',
                        'İklim, yer şekilleri ve yerleşme',
                        'Afet riski ve harita becerileri',
                    ]],
                    ['title' => 'Ortak Mirasımız', 'meb_code' => 'SOS.7.3', 'topics' => [
                        'Anadolu uygarlıkları ve kültürel miras',
                        'Selçuklu ve beylikler dönemi',
                        'Osmanlı\'ya giriş',
                    ]],
                    ['title' => 'Yaşayan Demokrasimiz', 'meb_code' => 'SOS.7.4', 'topics' => [
                        'Demokrasi ve katılım',
                        'Temel hak ve sorumluluklar',
                        'Yerel yönetim ve hak arama',
                    ]],
                    ['title' => 'Hayatımızdaki Ekonomi', 'meb_code' => 'SOS.7.5', 'topics' => [
                        'Üretim, dağıtım ve tüketim',
                        'Tasarruf ve yatırım',
                        'Tüketici hakları',
                    ]],
                    ['title' => 'Teknoloji ve Sosyal Bilimler', 'meb_code' => 'SOS.7.6', 'topics' => [
                        'Bilgi ve iletişim teknolojileri',
                        'Dijital vatandaşlık ve kaynak güvenilirliği',
                        'Telif ve fikri mülkiyet bilinci',
                    ]],
                ],
            ],
            [
                'name' => 'İngilizce', 'slug' => 'ingilizce-7',
                'icon' => '🇬🇧', 'color' => '#0277bd', 'grade' => '7', 'exam_type' => 'all', 'sort_order' => 5,
                'units' => [
                    ['title' => 'Teen Life', 'meb_code' => 'ING.7.T1', 'topics' => [
                        'School subjects and preferences',
                        'Present simple / frequency adverbs',
                        'Talking about abilities and plans',
                    ]],
                    ['title' => 'Healthy Living', 'meb_code' => 'ING.7.T2', 'topics' => [
                        'Food groups and habits',
                        'Should / shouldn\'t for advice',
                        'Short texts on sports and health',
                    ]],
                    ['title' => 'City Tour', 'meb_code' => 'ING.7.T3', 'topics' => [
                        'Comparative adjectives',
                        'Describing places and transport',
                        'Giving simple recommendations',
                    ]],
                    ['title' => 'Inventions', 'meb_code' => 'ING.7.T4', 'topics' => [
                        'Past simple: regular and common irregular verbs',
                        'Biographies of inventors (simplified)',
                        'Writing a short invention paragraph',
                    ]],
                    ['title' => 'Natural Forces', 'meb_code' => 'ING.7.T5', 'topics' => [
                        'Weather events and safety',
                        'Linking words: because, so',
                        'Listening for main idea',
                    ]],
                    ['title' => 'Celebrations', 'meb_code' => 'ING.7.T6', 'topics' => [
                        'Festivals around the world',
                        'Invitations and responses',
                        'Role-play: planning an event',
                    ]],
                    ['title' => 'Dreams', 'meb_code' => 'ING.7.T7', 'topics' => [
                        'Future with will / going to (basic)',
                        'Jobs and ambitions',
                        'Mini presentation: my future plans',
                    ]],
                    ['title' => 'Public Buildings', 'meb_code' => 'ING.7.T8', 'topics' => [
                        'Places in town (library, museum, hospital)',
                        'Prepositions of movement',
                        'Reading simple brochures',
                    ]],
                    ['title' => 'Communication', 'meb_code' => 'ING.7.T9', 'topics' => [
                        'Digital communication rules',
                        'Polite requests and apologies',
                        'Writing short e-mails',
                    ]],
                    ['title' => 'Values', 'meb_code' => 'ING.7.T10', 'topics' => [
                        'Friendship and respect',
                        'Discussion: fair play',
                        'Project: classroom rules poster',
                    ]],
                ],
            ],
            [
                'name' => 'Din Kültürü ve Ahlak Bilgisi', 'slug' => 'din-kulturu-ahlak-7',
                'icon' => '🕌', 'color' => '#00695c', 'grade' => '7', 'exam_type' => 'all', 'sort_order' => 6,
                'units' => [
                    ['title' => 'İslam ve İbadetler', 'meb_code' => 'DKAB.7.1', 'topics' => [
                        'İbadetin amacı ve çeşitleri',
                        'Namazın önemi ve hazırlık',
                        'İhlas Suresi ve anlamı',
                    ]],
                    ['title' => 'Hz. Muhammed\'in Hayatı', 'meb_code' => 'DKAB.7.2', 'topics' => [
                        'Mekke dönemi olayları',
                        'Medine dönemi ve toplumsal düzen',
                        'Örnek ahlak ve sabır',
                    ]],
                    ['title' => 'Ahlaki Davranışlar', 'meb_code' => 'DKAB.7.3', 'topics' => [
                        'Adalet ve dürüstlük',
                        'İffet ve tevazu',
                        'Komşuluk hakları',
                    ]],
                    ['title' => 'İslam Düşüncesinde Bilim ve Sanat', 'meb_code' => 'DKAB.7.4', 'topics' => [
                        'İslam medeniyetinde ilim',
                        'Kültürel miras örnekleri',
                    ]],
                    ['title' => 'Kur\'an-ı Kerim\'den Sureler', 'meb_code' => 'DKAB.7.5', 'topics' => [
                        'Kısa sureler ve temel mesajlar',
                        'Ezber ve anlam çalışması',
                    ]],
                ],
            ],
            [
                'name' => 'Görsel Sanatlar', 'slug' => 'gorsel-sanatlar-7',
                'icon' => '🎨', 'color' => '#c2185b', 'grade' => '7', 'exam_type' => 'all', 'sort_order' => 7,
                'units' => [
                    ['title' => 'Sanat ve Kimlik', 'meb_code' => 'GOR.7.1', 'topics' => [
                        'Görsel kültür ve kimlik',
                        'Özgün ifade ve çeşitlilik',
                    ]],
                    ['title' => 'Tasarım Süreci', 'meb_code' => 'GOR.7.2', 'topics' => [
                        'Eskiz ve geliştirme',
                        'Dijital ve geleneksel araçlar',
                    ]],
                    ['title' => 'Sanatta Öykü Anlatımı', 'meb_code' => 'GOR.7.3', 'topics' => [
                        'Dizi ve seri çalışma',
                        'Kompozisyon ve anlatı',
                    ]],
                    ['title' => 'Çevre ve Sanat', 'meb_code' => 'GOR.7.4', 'topics' => [
                        'Geri dönüşüm malzemeleriyle üretim',
                        'Sürdürülebilir tasarım farkındalığı',
                    ]],
                    ['title' => 'Heykel ve Form', 'meb_code' => 'GOR.7.5', 'topics' => [
                        'Negatif-pozitif hacım',
                        'Malzeme güvenliği',
                    ]],
                    ['title' => 'Geleneksel Desen ve Motif', 'meb_code' => 'GOR.7.6', 'topics' => [
                        'Geometrik desenler',
                        'Yerel motifleri yorumlama',
                    ]],
                    ['title' => 'Sanat Eleştirisi', 'meb_code' => 'GOR.7.7', 'topics' => [
                        'Eser analizi ve gerekçeli görüş',
                        'Sergi ve dijital müze deneyimi',
                    ]],
                ],
            ],
            [
                'name' => 'Müzik', 'slug' => 'muzik-7',
                'icon' => '🎵', 'color' => '#6a1b9a', 'grade' => '7', 'exam_type' => 'all', 'sort_order' => 8,
                'units' => [
                    ['title' => 'Dinleme — Söyleme', 'meb_code' => 'MUZ.7.1', 'topics' => [
                        'Geniş aralıklı ezgi çalışmaları',
                        'Çok sesli eşlik',
                    ]],
                    ['title' => 'Müziksel Algı ve Bilgilenme', 'meb_code' => 'MUZ.7.2', 'topics' => [
                        'Ritim kalıpları ve senkop',
                        'Armür ve ölçü değişimleri',
                    ]],
                    ['title' => 'Türk Müziği', 'meb_code' => 'MUZ.7.3', 'topics' => [
                        'Bölgesel müzik örnekleri',
                        'Enstrüman tanıtımı',
                    ]],
                    ['title' => 'Müzikte Yaratıcılık', 'meb_code' => 'MUZ.7.4', 'topics' => [
                        'Basit form düzenleme',
                        'Grup performansı ve dinleyici adabı',
                    ]],
                ],
            ],
            [
                'name' => 'Bilişim Teknolojileri ve Yazılım', 'slug' => 'bilisim-teknolojileri-7',
                'icon' => '💻', 'color' => '#37474f', 'grade' => '7', 'exam_type' => 'all', 'sort_order' => 9,
                'units' => [
                    ['title' => 'BT ve Üretkenlik', 'meb_code' => 'BTY.7.1', 'topics' => [
                        'Veri tabloları ve grafikler',
                        'İş birlikli belge düzenleme',
                    ]],
                    ['title' => 'Dijital İçerik Üretimi', 'meb_code' => 'BTY.7.2', 'topics' => [
                        'Kısa video ve slayt hikâyesi',
                        'Telif ve atıf kuralları',
                    ]],
                    ['title' => 'Ağlar ve Güvenlik', 'meb_code' => 'BTY.7.3', 'topics' => [
                        'Ağ protokollerine giriş',
                        'Güçlü parola ve iki aşamalı doğrulama farkındalığı',
                    ]],
                    ['title' => 'Siber Güvenlik ve Etik', 'meb_code' => 'BTY.7.4', 'topics' => [
                        'Dolandırıcılık türleri',
                        'Dijital ayak izini yönetme',
                    ]],
                    ['title' => 'Yapay Zekâ ve Toplum', 'meb_code' => 'BTY.7.5', 'topics' => [
                        'YZ kullanım alanları',
                        'Önyargı ve doğruluk',
                    ]],
                    ['title' => 'Programlama', 'meb_code' => 'BTY.7.6', 'topics' => [
                        'Döngü ve koşullu yapılar',
                        'Küçük proje ve test senaryoları',
                    ]],
                ],
            ],
            [
                'name' => 'Beden Eğitimi ve Spor', 'slug' => 'beden-egitimi-7',
                'icon' => '⚽', 'color' => '#ef6c00', 'grade' => '7', 'exam_type' => 'all', 'sort_order' => 10,
                'units' => [
                    ['title' => 'Fiziksel Uygunluk', 'meb_code' => 'BES.7.1', 'topics' => [
                        'Isınma ve soğuma rutinleri',
                        'Kalp-damar dayanıklılığı',
                    ]],
                    ['title' => 'Takım Oyunları', 'meb_code' => 'BES.7.2', 'topics' => [
                        'Pozisyon ve pas oyunları',
                        'Fair-play ve kurallar',
                    ]],
                    ['title' => 'Cimnastik ve Koordinasyon', 'meb_code' => 'BES.7.3', 'topics' => [
                        'Denge ve esneklik istasyonları',
                        'Temel akrobatik öğeler',
                    ]],
                    ['title' => 'Dans ve Ritim', 'meb_code' => 'BES.7.4', 'topics' => [
                        'Grup koreografisi',
                        'Müzikle uyumlu hareket',
                    ]],
                    ['title' => 'Atletizm ve Ölçüm', 'meb_code' => 'BES.7.5', 'topics' => [
                        'Koşu ve atlama teknikleri',
                        'Kişisel gelişim kaydı',
                    ]],
                ],
            ],
        ];
    }
}
