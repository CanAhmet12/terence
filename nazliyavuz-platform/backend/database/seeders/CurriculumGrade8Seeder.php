<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Database\Seeders\Concerns\InsertsCurriculumSubjects;

/**
 * 8. Sınıf — MEB TYMM ortaokul öğretim programları ve TEGM çerçeve planları ile uyumlu müfredat ağacı.
 * LGS sınav içerikleri ayrı olarak CurriculumLgsSeeder içindedir; bu dosya yalnızca grade=8, exam_type=all derslerini yazar.
 * Türkçe/Matematik/Fen ünite başlıkları: tymm.meb.gov.tr Ortaokul 8. sınıf öğretim programı.
 */
class CurriculumGrade8Seeder extends Seeder
{
    use InsertsCurriculumSubjects;

    public function run(): void
    {
        $this->purgeByGradeAndExamType('8', 'all');
        $data = $this->getGrade8Curriculum();
        $this->insertCurriculumSubjects($data);
        $this->command->info('CurriculumGrade8Seeder: '.count($data).' ders (8. sınıf) yazıldı.');
    }

    private function getGrade8Curriculum(): array
    {
        return [
            [
                'name' => 'Türkçe', 'slug' => 'turkce-8',
                'icon' => '📖', 'color' => '#c62828', 'grade' => '8', 'exam_type' => 'all', 'sort_order' => 1,
                'units' => [
                    ['title' => 'İletişim ve Sosyal İlişkiler', 'meb_code' => 'TRK.8.T1', 'topics' => [
                        'Dijital ve geleneksel iletişim metinleri',
                        'Tartışma, müzakere ve görgü kuralları',
                        'Yazma: haber, duyuru ve resmî yazışma',
                        'Medya okuryazarlığı ve güvenilir kaynak',
                    ]],
                    ['title' => 'Vatan Sevgisi', 'meb_code' => 'TRK.8.T2', 'topics' => [
                        'Okuma: millî mücadele ve Cumhuriyet metinleri',
                        'Şiir ve destan parçalarında duygu ve tema',
                        'Konuşma: gerekçeli vatanseverlik',
                        'Yazma: duygusal ve bilgilendirici kompozisyon',
                    ]],
                    ['title' => 'Doğa ve İnsan', 'meb_code' => 'TRK.8.T3', 'topics' => [
                        'Bilim ve çevre içerikli metinler',
                        'Sürdürülebilirlik ve sorumluluk',
                        'Yazma: bilgilendirici metin ve poster metni',
                        'Grafik ve tablo yorumlama',
                    ]],
                    ['title' => 'Türk Hikâye Geleneği ve Destanları', 'meb_code' => 'TRK.8.T4', 'topics' => [
                        'Hikâye ve destan tür özellikleri',
                        'Sözlü kültür ürünleri',
                        'Okuma stratejileri ve metinlerarasılık',
                        'Yazma: öykü ve anlatı yazısı',
                    ]],
                    ['title' => 'Sanat ve Estetik', 'meb_code' => 'TRK.8.T5', 'topics' => [
                        'Sanat ve edebiyat ilişkisi',
                        'Estetik yargı ve eleştiri',
                        'Tiyatro ve anlatı metinleri',
                        'Yazma: sanat etkinliği tanıtımı',
                    ]],
                    ['title' => 'Akademik Düşünme Dünyası', 'meb_code' => 'TRK.8.T6', 'topics' => [
                        'Akademik metin özeti ve kaynakça',
                        'Eleştirel okuma ve çıkarım',
                        'Konuşma: akademik sunum',
                        'Yazma: kısa araştırma raporu',
                    ]],
                ],
            ],
            [
                'name' => 'Matematik', 'slug' => 'matematik-8',
                'icon' => '📐', 'color' => '#1565c0', 'grade' => '8', 'exam_type' => 'all', 'sort_order' => 2,
                'units' => [
                    ['title' => 'Sayılar ve Nicelikler', 'meb_code' => 'MAT.8.1', 'topics' => [
                        'Üslü ve köklü ifadeler',
                        'Çarpanlara ayırma ve özdeşlikler',
                        'Rasyonel ifadeler ve bilimsel gösterim',
                    ]],
                    ['title' => 'Cebirsel Düşünme ve Değişimler', 'meb_code' => 'MAT.8.2', 'topics' => [
                        'İkinci dereceden bir bilinmeyenli denklemler',
                        'Doğrusal denklem sistemleri',
                        'Fonksiyon ve grafik ilişkisi (temel)',
                    ]],
                    ['title' => 'Geometrik Şekiller', 'meb_code' => 'MAT.8.3', 'topics' => [
                        'Üçgende benzerlik ve Pisagor',
                        'Trigonometrik oranlar',
                        'Çember ve dairede açı ve uzunluk',
                    ]],
                    ['title' => 'Geometrik Nicelikler', 'meb_code' => 'MAT.8.4', 'topics' => [
                        'Prizma, silindir, koni ve kürede hacim ve yüzey alanı',
                        'Gerçek yaşam modelleri',
                    ]],
                    ['title' => 'Dönüşüm', 'meb_code' => 'MAT.8.5', 'topics' => [
                        'Öteleme, yansıma, dönme ve simetri',
                        'Koordinat düzleminde dönüşümler',
                    ]],
                    ['title' => 'İstatistiksel Araştırma Süreci', 'meb_code' => 'MAT.8.6', 'topics' => [
                        'Veri toplama ve grafik seçimi',
                        'İki değişkenli veri ve yorum',
                        'Merkezi eğilim ve yayılım',
                    ]],
                    ['title' => 'Veriden Olasılığa', 'meb_code' => 'MAT.8.7', 'topics' => [
                        'Basit olayların olasılığı',
                        'Öznel olasılık ve tahmin',
                    ]],
                ],
            ],
            [
                'name' => 'Fen Bilimleri', 'slug' => 'fen-bilimleri-8',
                'icon' => '🔬', 'color' => '#2e7d32', 'grade' => '8', 'exam_type' => 'all', 'sort_order' => 3,
                'units' => [
                    ['title' => 'Mevsimler ve İklim', 'meb_code' => 'FEN.8.1', 'topics' => [
                        'Dünya\'nın hareketleri ve mevsimler',
                        'İklim ve hava olayları',
                        'İklim değişikliği ve sürdürülebilirlik',
                    ]],
                    ['title' => 'Yaşamı Kolaylaştıran Kuvvet', 'meb_code' => 'FEN.8.2', 'topics' => [
                        'Basit makineler ve mekanik avantaj',
                        'Kuvvet, iş ve enerji ilişkisi',
                        'Günlük yaşamda verim',
                    ]],
                    ['title' => 'Yaşamın Gizemi', 'meb_code' => 'FEN.8.3', 'topics' => [
                        'DNA ve genetik kod',
                        'Kalıtım ve çevre etkileşimi',
                        'Biyoteknoloji ve etik',
                    ]],
                    ['title' => 'Sesin Dünyası', 'meb_code' => 'FEN.8.4', 'topics' => [
                        'Sesin oluşumu ve yayılması',
                        'Ses hızı ve ortam',
                        'İşitme ve gürültü kirliliği',
                    ]],
                    ['title' => 'Periyodik Tablo ve Maddenin Etkileşimi', 'meb_code' => 'FEN.8.5', 'topics' => [
                        'Atom yapısı ve periyodik sistem',
                        'Kimyasal bağlar ve tepkimeler',
                        'Asit, baz ve tuz',
                    ]],
                    ['title' => 'Elektriğin Yolculuğu', 'meb_code' => 'FEN.8.6', 'topics' => [
                        'Elektrik akımı ve direnç',
                        'Seri ve paralel devreler',
                        'Elektrik enerjisi ve güvenlik',
                    ]],
                    ['title' => 'Sürdürülebilir Yaşam ve Madde Döngüleri', 'meb_code' => 'FEN.8.7', 'topics' => [
                        'Su, karbon ve azot döngüleri',
                        'Atık ve geri dönüşüm',
                        'Kaynakların etkin kullanımı',
                    ]],
                ],
            ],
            [
                'name' => 'Sosyal Bilgiler', 'slug' => 'sosyal-bilgiler-8',
                'icon' => '🏛️', 'color' => '#4e342e', 'grade' => '8', 'exam_type' => 'all', 'sort_order' => 4,
                'units' => [
                    ['title' => 'Birlikte Yaşamak', 'meb_code' => 'SOS.8.1', 'topics' => [
                        'Küresel bağlantılar ve kültürler arası etkileşim',
                        'Göç, uyum ve hoşgörü',
                        'İnsan hakları ve sorumluluk',
                    ]],
                    ['title' => 'Evimiz Dünya', 'meb_code' => 'SOS.8.2', 'topics' => [
                        'Bölgeler ve ekonomik faaliyetler',
                        'Ulaşım ve haberleşme ağları',
                        'Afet risk yönetimi ve harita',
                    ]],
                    ['title' => 'Ortak Mirasımız', 'meb_code' => 'SOS.8.3', 'topics' => [
                        'Osmanlı yükselme ve duraklama',
                        'Islahatlar ve modernleşme',
                        'Millî mücadele ve Cumhuriyet\'e giden süreç',
                    ]],
                    ['title' => 'Yaşayan Demokrasimiz', 'meb_code' => 'SOS.8.4', 'topics' => [
                        'Güçler ayrılığı ve yasama',
                        'Anayasa ve temel haklar',
                        'Yargı ve adalet',
                    ]],
                    ['title' => 'Hayatımızdaki Ekonomi', 'meb_code' => 'SOS.8.5', 'topics' => [
                        'Üretim faktörleri ve sektörler',
                        'Dış ticaret ve döviz',
                        'Sürdürülebilir kalkınma',
                    ]],
                    ['title' => 'Teknoloji ve Sosyal Bilimler', 'meb_code' => 'SOS.8.6', 'topics' => [
                        'Siber güvenlik ve kişisel veri',
                        'Dezenformasyon ve medya okuryazarlığı',
                        'Bilimsel düşünme ve kaynak güvenilirliği',
                    ]],
                ],
            ],
            [
                'name' => 'İngilizce', 'slug' => 'ingilizce-8',
                'icon' => '🇬🇧', 'color' => '#0277bd', 'grade' => '8', 'exam_type' => 'all', 'sort_order' => 5,
                'units' => [
                    ['title' => 'Friendship', 'meb_code' => 'ING.8.T1', 'topics' => [
                        'Describing people and relationships',
                        'Present perfect (exposure)',
                        'Agreeing and disagreeing politely',
                    ]],
                    ['title' => 'Public Figures', 'meb_code' => 'ING.8.T2', 'topics' => [
                        'Biographies and achievements',
                        'Past simple vs present perfect contrast (basic)',
                        'Short presentations',
                    ]],
                    ['title' => 'Natural Events', 'meb_code' => 'ING.8.T3', 'topics' => [
                        'Disasters and precautions',
                        'Modals: must / have to / should',
                        'Emergency dialogues',
                    ]],
                    ['title' => 'Science and Technology', 'meb_code' => 'ING.8.T4', 'topics' => [
                        'Innovations and their effects',
                        'Passive voice (introduction)',
                        'Reading popular science texts',
                    ]],
                    ['title' => 'Shopping', 'meb_code' => 'ING.8.T5', 'topics' => [
                        'Comparatives and superlatives',
                        'Consumer rights (simple context)',
                        'Role-play: complaints and solutions',
                    ]],
                    ['title' => 'On the Phone', 'meb_code' => 'ING.8.T6', 'topics' => [
                        'Telephone etiquette',
                        'Leaving and taking messages',
                        'Functional language chunks',
                    ]],
                    ['title' => 'Tourism', 'meb_code' => 'ING.8.T7', 'topics' => [
                        'Travel and accommodation',
                        'Future plans with going to / will',
                        'Writing a travel blog entry',
                    ]],
                    ['title' => 'Young Voices', 'meb_code' => 'ING.8.T8', 'topics' => [
                        'Youth projects and volunteering',
                        'Discussion: community problems',
                        'Poster presentation',
                    ]],
                    ['title' => 'Film and Theatre', 'meb_code' => 'ING.8.T9', 'topics' => [
                        'Genres and simple reviews',
                        'Expressing opinions and preferences',
                        'Writing a short review',
                    ]],
                    ['title' => 'World Citizens', 'meb_code' => 'ING.8.T10', 'topics' => [
                        'Global issues and cooperation',
                        'Linking ideas in paragraphs',
                        'Debate preparation',
                    ]],
                ],
            ],
            [
                'name' => 'Din Kültürü ve Ahlak Bilgisi', 'slug' => 'din-kulturu-ahlak-8',
                'icon' => '🕌', 'color' => '#00695c', 'grade' => '8', 'exam_type' => 'all', 'sort_order' => 6,
                'units' => [
                    ['title' => 'Kur\'an\'ın Anlaşılması', 'meb_code' => 'DKAB.8.1', 'topics' => [
                        'Kur\'an\'ın indirilişi ve korunması',
                        'Sure ve ayet çalışması',
                    ]],
                    ['title' => 'İslam Düşüncesinde Yorum ve İlim', 'meb_code' => 'DKAB.8.2', 'topics' => [
                        'İtikad ve ahlak ilişkisi',
                        'İslam medeniyetinde bilim insanları',
                    ]],
                    ['title' => 'Hz. Muhammed ve Aile Hayatı', 'meb_code' => 'DKAB.8.3', 'topics' => [
                        'Aile içi iletişim ve sevgi',
                        'Kadın ve erkek haklarına saygı',
                    ]],
                    ['title' => 'İslam\'da Sanat ve Estetik', 'meb_code' => 'DKAB.8.4', 'topics' => [
                        'Mimari ve süsleme anlayışı',
                        'Ölçü ve denge',
                    ]],
                    ['title' => 'Ahlaki Davranışlar', 'meb_code' => 'DKAB.8.5', 'topics' => [
                        'Dürüstlük ve güven',
                        'İsrafın önlenmesi ve teşekkür bilinci',
                    ]],
                ],
            ],
            [
                'name' => 'Görsel Sanatlar', 'slug' => 'gorsel-sanatlar-8',
                'icon' => '🎨', 'color' => '#c2185b', 'grade' => '8', 'exam_type' => 'all', 'sort_order' => 7,
                'units' => [
                    ['title' => 'Sanat ve Eleştiri', 'meb_code' => 'GOR.8.1', 'topics' => [
                        'Estetik ölçütler ve tartışma',
                        'Görsel okuryazarlıkta derinleşme',
                    ]],
                    ['title' => 'Dijital Sanat', 'meb_code' => 'GOR.8.2', 'topics' => [
                        'Vektör ve raster temel bilgisi',
                        'Etik ve telif',
                    ]],
                    ['title' => 'Çağdaş Sanat Akımları', 'meb_code' => 'GOR.8.3', 'topics' => [
                        'Örnek sanatçı ve eser incelemesi',
                        'Kendi yorumunu üretme',
                    ]],
                    ['title' => 'Kentsel Mekân ve Sanat', 'meb_code' => 'GOR.8.4', 'topics' => [
                        'Heykel ve anıt tasarımı',
                        'Kamusal alan ve estetik',
                    ]],
                    ['title' => 'Geleneksel El Sanatları', 'meb_code' => 'GOR.8.5', 'topics' => [
                        'Hat, tezhip ve çini örnekleri',
                        'Koruma ve yaşatma',
                    ]],
                    ['title' => 'Kompozisyon Atölyesi', 'meb_code' => 'GOR.8.6', 'topics' => [
                        'Denge, ritim ve vurgu',
                        'Seri üretim ve sergileme',
                    ]],
                    ['title' => 'Portfolyo ve Yansıtma', 'meb_code' => 'GOR.8.7', 'topics' => [
                        'Öz değerlendirme',
                        'Süreç ve ürün ilişkisi',
                    ]],
                ],
            ],
            [
                'name' => 'Müzik', 'slug' => 'muzik-8',
                'icon' => '🎵', 'color' => '#6a1b9a', 'grade' => '8', 'exam_type' => 'all', 'sort_order' => 8,
                'units' => [
                    ['title' => 'Dinleme — Söyleme', 'meb_code' => 'MUZ.8.1', 'topics' => [
                        'Çok parçalı eşlik',
                        'Solfej ve işitme geliştirme',
                    ]],
                    ['title' => 'Müziksel Algı ve Bilgilenme', 'meb_code' => 'MUZ.8.2', 'topics' => [
                        'Armür değişimleri ve senkop',
                        'Form yapılarına giriş',
                    ]],
                    ['title' => 'Türk Müziği ve Dünya Müzikleri', 'meb_code' => 'MUZ.8.3', 'topics' => [
                        'Bölgesel örnekler ve karşılaştırma',
                        'Enstrüman grupları',
                    ]],
                    ['title' => 'Müzikte Yaratıcılık', 'meb_code' => 'MUZ.8.4', 'topics' => [
                        'Küçük form besteleme',
                        'Sahne performansı ve geri bildirim',
                    ]],
                ],
            ],
            [
                'name' => 'Bilişim Teknolojileri ve Yazılım', 'slug' => 'bilisim-teknolojileri-8',
                'icon' => '💻', 'color' => '#37474f', 'grade' => '8', 'exam_type' => 'all', 'sort_order' => 9,
                'units' => [
                    ['title' => 'Veri ve Karar Desteği', 'meb_code' => 'BTY.8.1', 'topics' => [
                        'Veri doğrulama ve filtreleme',
                        'Basit grafik analizi',
                    ]],
                    ['title' => 'İleri Dijital Üretim', 'meb_code' => 'BTY.8.2', 'topics' => [
                        'Çok ortamlı sunum',
                        'Erişilebilir tasarım ilkeleri',
                    ]],
                    ['title' => 'Ağ Güvenliği', 'meb_code' => 'BTY.8.3', 'topics' => [
                        'VPN ve güvenli bağlantı kavramı',
                        'Kimlik avı senaryoları',
                    ]],
                    ['title' => 'YZ ve Etik', 'meb_code' => 'BTY.8.4', 'topics' => [
                        'Derin sahte içerik farkındalığı',
                        'Kaynak doğrulama stratejileri',
                    ]],
                    ['title' => 'Programlama Projesi', 'meb_code' => 'BTY.8.5', 'topics' => [
                        'Fonksiyon ve modüler yapı',
                        'Küçük oyun veya simülasyon',
                    ]],
                    ['title' => 'BT Kariyerleri', 'meb_code' => 'BTY.8.6', 'topics' => [
                        'Meslek profilleri',
                        'Öğrenme kaynakları',
                    ]],
                ],
            ],
            [
                'name' => 'Beden Eğitimi ve Spor', 'slug' => 'beden-egitimi-8',
                'icon' => '⚽', 'color' => '#ef6c00', 'grade' => '8', 'exam_type' => 'all', 'sort_order' => 10,
                'units' => [
                    ['title' => 'Performans ve Dayanıklılık', 'meb_code' => 'BES.8.1', 'topics' => [
                        'Interval antrenman kavramı',
                        'Esneklik ve mobilite',
                    ]],
                    ['title' => 'Takım Stratejileri', 'meb_code' => 'BES.8.2', 'topics' => [
                        'Alan paylaşımı ve roller',
                        'Turnuva kuralları',
                    ]],
                    ['title' => 'Cimnastik ve Akrobatik', 'meb_code' => 'BES.8.3', 'topics' => [
                        'Takla ve destek hareketleri (güvenli)',
                        'İstasyon çalışması',
                    ]],
                    ['title' => 'Folklor ve Kültür', 'meb_code' => 'BES.8.4', 'topics' => [
                        'Bölge oyunları',
                        'Koreografi ve ritim',
                    ]],
                    ['title' => 'Atletizm ve Ölçüm', 'meb_code' => 'BES.8.5', 'topics' => [
                        'Branş seçimi ve gelişim hedefi',
                        'Kişisel rekor takibi',
                    ]],
                ],
            ],
        ];
    }
}
