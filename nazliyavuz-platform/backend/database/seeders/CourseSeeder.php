<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // ────────────────────────────────────────────────────────────────
        // KURSLAR
        // ────────────────────────────────────────────────────────────────
        $courses = [
            [
                'title' => 'TYT Matematik',
                'slug'  => 'tyt-matematik',
                'description' => 'TYT sınavı için temel ve ileri matematik konuları: sayılar, cebir, geometri ve olasılık.',
                'subject'   => 'Matematik',
                'exam_type' => 'TYT',
                'grade'     => 12,
                'level'     => 'intermediate',
                'is_active' => true,
                'is_free'   => true,
                'sort_order'=> 1,
                'thumbnail_url' => 'https://img.youtube.com/vi/KufsL2VgELo/hqdefault.jpg',
                'units' => [
                    [
                        'title' => 'Temel Sayı Sistemleri',
                        'description' => 'Doğal sayılar, tam sayılar, rasyonel ve irrasyonel sayılar.',
                        'sort_order' => 1,
                        'topics' => [
                            [
                                'title' => 'Doğal Sayılar ve Bölünebilme',
                                'sort_order' => 1,
                                'items' => [
                                    ['type'=>'video','title'=>'Doğal Sayılar Giriş','url'=>'https://www.youtube.com/embed/KufsL2VgELo','duration_seconds'=>1320,'is_free'=>true],
                                    ['type'=>'video','title'=>'Bölünebilme Kuralları','url'=>'https://www.youtube.com/embed/IaSGqoNHbgI','duration_seconds'=>1080,'is_free'=>true],
                                    ['type'=>'pdf','title'=>'Doğal Sayılar Ders Notu','url'=>'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1.pdf','duration_seconds'=>null,'is_free'=>true],
                                ],
                            ],
                            [
                                'title' => 'Tam Sayılar ve İşlemler',
                                'sort_order' => 2,
                                'items' => [
                                    ['type'=>'video','title'=>'Tam Sayılarda Toplama ve Çıkarma','url'=>'https://www.youtube.com/embed/0GRsHFqXcaA','duration_seconds'=>960,'is_free'=>true],
                                    ['type'=>'video','title'=>'Tam Sayılarda Çarpma ve Bölme','url'=>'https://www.youtube.com/embed/2WRBiPNzYKc','duration_seconds'=>1140,'is_free'=>false],
                                ],
                            ],
                            [
                                'title' => 'Kesirler ve Ondalıklı Sayılar',
                                'sort_order' => 3,
                                'items' => [
                                    ['type'=>'video','title'=>'Kesir Çeşitleri','url'=>'https://www.youtube.com/embed/yTkXe60yMvI','duration_seconds'=>840,'is_free'=>true],
                                    ['type'=>'video','title'=>'Ondalıklı Sayılar','url'=>'https://www.youtube.com/embed/0s8Q4JHJG-M','duration_seconds'=>900,'is_free'=>false],
                                    ['type'=>'pdf','title'=>'Kesirler Soru Kitapçığı','url'=>'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2.pdf','duration_seconds'=>null,'is_free'=>false],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Cebir ve Denklemler',
                        'description' => 'Birinci ve ikinci dereceden denklemler, eşitsizlikler.',
                        'sort_order' => 2,
                        'topics' => [
                            [
                                'title' => 'Birinci Dereceden Denklemler',
                                'sort_order' => 1,
                                'items' => [
                                    ['type'=>'video','title'=>'Denklem Kavramı ve Çözümü','url'=>'https://www.youtube.com/embed/l3XzepN03KQ','duration_seconds'=>1200,'is_free'=>true],
                                    ['type'=>'video','title'=>'Uygulamalı Problemler','url'=>'https://www.youtube.com/embed/9yfKRo5EEfU','duration_seconds'=>1560,'is_free'=>false],
                                ],
                            ],
                            [
                                'title' => 'İkinci Dereceden Denklemler',
                                'sort_order' => 2,
                                'items' => [
                                    ['type'=>'video','title'=>'Kareköklü Denklemler','url'=>'https://www.youtube.com/embed/i7idZfS8t8w','duration_seconds'=>1440,'is_free'=>false],
                                    ['type'=>'pdf','title'=>'İkinci Derece Denklemler Notu','url'=>'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF3.pdf','duration_seconds'=>null,'is_free'=>false],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Geometri Temelleri',
                        'description' => 'Açılar, üçgenler, dörtgenler ve çemberler.',
                        'sort_order' => 3,
                        'topics' => [
                            [
                                'title' => 'Açılar ve Üçgenler',
                                'sort_order' => 1,
                                'items' => [
                                    ['type'=>'video','title'=>'Açı Türleri ve Özellikleri','url'=>'https://www.youtube.com/embed/GQSAKaXPFyQ','duration_seconds'=>1080,'is_free'=>true],
                                    ['type'=>'video','title'=>'Üçgenin Özellikleri','url'=>'https://www.youtube.com/embed/nVbjFBQHfOg','duration_seconds'=>1320,'is_free'=>false],
                                ],
                            ],
                            [
                                'title' => 'Çevre ve Alan Hesapları',
                                'sort_order' => 2,
                                'items' => [
                                    ['type'=>'video','title'=>'Üçgenin Alanı','url'=>'https://www.youtube.com/embed/0KjG8Pg6LGk','duration_seconds'=>900,'is_free'=>false],
                                    ['type'=>'video','title'=>'Dörtgenlerin Alanları','url'=>'https://www.youtube.com/embed/VlMiW2TnZBM','duration_seconds'=>1200,'is_free'=>false],
                                    ['type'=>'pdf','title'=>'Geometri Formüller Tablosu','url'=>'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1.pdf','duration_seconds'=>null,'is_free'=>true],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            [
                'title' => 'TYT Türkçe',
                'slug'  => 'tyt-turkce',
                'description' => 'Paragraf analizi, dil bilgisi, sözcük türleri ve yazım kuralları.',
                'subject'   => 'Türkçe',
                'exam_type' => 'TYT',
                'grade'     => 12,
                'level'     => 'beginner',
                'is_active' => true,
                'is_free'   => true,
                'sort_order'=> 2,
                'thumbnail_url' => 'https://img.youtube.com/vi/5wEmMhHRMYM/hqdefault.jpg',
                'units' => [
                    [
                        'title' => 'Paragraf ve Ana Fikir',
                        'description' => 'Paragrafın yapısı, ana fikir, konu ve başlık bulma.',
                        'sort_order' => 1,
                        'topics' => [
                            [
                                'title' => 'Ana Fikir Nasıl Bulunur?',
                                'sort_order' => 1,
                                'items' => [
                                    ['type'=>'video','title'=>'Paragrafta Ana Fikir','url'=>'https://www.youtube.com/embed/5wEmMhHRMYM','duration_seconds'=>1080,'is_free'=>true],
                                    ['type'=>'video','title'=>'Konu ve Ana Fikir Farkı','url'=>'https://www.youtube.com/embed/mQEzZWfGJak','duration_seconds'=>960,'is_free'=>true],
                                ],
                            ],
                            [
                                'title' => 'Paragraf Türleri',
                                'sort_order' => 2,
                                'items' => [
                                    ['type'=>'video','title'=>'Giriş-Gelişme-Sonuç Paragrafları','url'=>'https://www.youtube.com/embed/t9hMxG9qfNA','duration_seconds'=>1140,'is_free'=>true],
                                    ['type'=>'pdf','title'=>'Paragraf Soru Bankası PDF','url'=>'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2.pdf','duration_seconds'=>null,'is_free'=>false],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Dil Bilgisi',
                        'description' => 'Sözcük türleri, isim, fiil, sıfat ve zarflar.',
                        'sort_order' => 2,
                        'topics' => [
                            [
                                'title' => 'İsim ve İsim Tamlamaları',
                                'sort_order' => 1,
                                'items' => [
                                    ['type'=>'video','title'=>'Türkçede İsim Türleri','url'=>'https://www.youtube.com/embed/L_s5gIXHFW0','duration_seconds'=>900,'is_free'=>true],
                                    ['type'=>'video','title'=>'İsim Tamlamaları Soru Çözümü','url'=>'https://www.youtube.com/embed/U2KqRMQq5E0','duration_seconds'=>1200,'is_free'=>false],
                                ],
                            ],
                            [
                                'title' => 'Fiil ve Fiil Çekimi',
                                'sort_order' => 2,
                                'items' => [
                                    ['type'=>'video','title'=>'Fiil Çekim Ekleri','url'=>'https://www.youtube.com/embed/qjEqp8S2C84','duration_seconds'=>1080,'is_free'=>false],
                                    ['type'=>'pdf','title'=>'Dil Bilgisi Özet Tablosu','url'=>'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF3.pdf','duration_seconds'=>null,'is_free'=>true],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Sözcükte Anlam',
                        'description' => 'Gerçek anlam, mecaz anlam, deyim ve atasözleri.',
                        'sort_order' => 3,
                        'topics' => [
                            [
                                'title' => 'Gerçek ve Mecaz Anlam',
                                'sort_order' => 1,
                                'items' => [
                                    ['type'=>'video','title'=>'Anlam Kaymaları','url'=>'https://www.youtube.com/embed/5wEmMhHRMYM','duration_seconds'=>840,'is_free'=>true],
                                    ['type'=>'video','title'=>'Deyimler ve Atasözleri','url'=>'https://www.youtube.com/embed/mQEzZWfGJak','duration_seconds'=>960,'is_free'=>false],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            [
                'title' => 'TYT Fizik',
                'slug'  => 'tyt-fizik',
                'description' => 'Kuvvet, hareket, enerji, elektrik ve manyetizma temel konuları.',
                'subject'   => 'Fizik',
                'exam_type' => 'TYT',
                'grade'     => 12,
                'level'     => 'intermediate',
                'is_active' => true,
                'is_free'   => false,
                'sort_order'=> 3,
                'thumbnail_url' => 'https://img.youtube.com/vi/ZM8ECpBuQYE/hqdefault.jpg',
                'units' => [
                    [
                        'title' => 'Kuvvet ve Hareket',
                        'description' => 'Newton\'un hareket yasaları ve uygulamaları.',
                        'sort_order' => 1,
                        'topics' => [
                            [
                                'title' => 'Newton\'un 1. ve 2. Yasası',
                                'sort_order' => 1,
                                'items' => [
                                    ['type'=>'video','title'=>'Kuvvet Kavramı','url'=>'https://www.youtube.com/embed/ZM8ECpBuQYE','duration_seconds'=>1320,'is_free'=>false],
                                    ['type'=>'video','title'=>'Atalet Prensibi','url'=>'https://www.youtube.com/embed/jVz3bCg7TI0','duration_seconds'=>1080,'is_free'=>false],
                                    ['type'=>'pdf','title'=>'Newton Yasaları Özeti','url'=>'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1.pdf','duration_seconds'=>null,'is_free'=>false],
                                ],
                            ],
                            [
                                'title' => 'Sürtünme Kuvveti',
                                'sort_order' => 2,
                                'items' => [
                                    ['type'=>'video','title'=>'Statik ve Kinetik Sürtünme','url'=>'https://www.youtube.com/embed/YJTcb4HOBQc','duration_seconds'=>1200,'is_free'=>false],
                                    ['type'=>'video','title'=>'Eğik Düzlem Problemleri','url'=>'https://www.youtube.com/embed/b0JCm8uqFZg','duration_seconds'=>1440,'is_free'=>false],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Enerji ve İş',
                        'description' => 'Kinetik enerji, potansiyel enerji, iş-enerji teoremi.',
                        'sort_order' => 2,
                        'topics' => [
                            [
                                'title' => 'İş ve Kinetik Enerji',
                                'sort_order' => 1,
                                'items' => [
                                    ['type'=>'video','title'=>'Fiziksel İş Kavramı','url'=>'https://www.youtube.com/embed/pB3_8SZMTUE','duration_seconds'=>1080,'is_free'=>false],
                                    ['type'=>'video','title'=>'Kinetik Enerji Hesapları','url'=>'https://www.youtube.com/embed/Bz-4nGUMY4M','duration_seconds'=>960,'is_free'=>false],
                                ],
                            ],
                            [
                                'title' => 'Potansiyel Enerji',
                                'sort_order' => 2,
                                'items' => [
                                    ['type'=>'video','title'=>'Gravitasyonel Potansiyel Enerji','url'=>'https://www.youtube.com/embed/EJHnzsimply','duration_seconds'=>1140,'is_free'=>false],
                                    ['type'=>'pdf','title'=>'Enerji Formülleri','url'=>'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2.pdf','duration_seconds'=>null,'is_free'=>false],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            [
                'title' => 'TYT Kimya',
                'slug'  => 'tyt-kimya',
                'description' => 'Atom yapısı, periyodik tablo, kimyasal bağlar ve tepkimeler.',
                'subject'   => 'Kimya',
                'exam_type' => 'TYT',
                'grade'     => 12,
                'level'     => 'intermediate',
                'is_active' => true,
                'is_free'   => false,
                'sort_order'=> 4,
                'thumbnail_url' => 'https://img.youtube.com/vi/FSyAehMdpyI/hqdefault.jpg',
                'units' => [
                    [
                        'title' => 'Atom ve Periyodik Sistem',
                        'description' => 'Atom modelleri, elektron dizilimi, periyodik özellikler.',
                        'sort_order' => 1,
                        'topics' => [
                            [
                                'title' => 'Atom Modelleri',
                                'sort_order' => 1,
                                'items' => [
                                    ['type'=>'video','title'=>'Dalton\'dan Kuantum Modeline','url'=>'https://www.youtube.com/embed/FSyAehMdpyI','duration_seconds'=>1560,'is_free'=>false],
                                    ['type'=>'video','title'=>'Elektron Dizilimi','url'=>'https://www.youtube.com/embed/RJlEH5Jz80w','duration_seconds'=>1320,'is_free'=>false],
                                ],
                            ],
                            [
                                'title' => 'Periyodik Tablo',
                                'sort_order' => 2,
                                'items' => [
                                    ['type'=>'video','title'=>'Periyodik Özelliklerin Değişimi','url'=>'https://www.youtube.com/embed/AmphzBwM2nA','duration_seconds'=>1080,'is_free'=>false],
                                    ['type'=>'pdf','title'=>'Periyodik Tablo PDF','url'=>'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF3.pdf','duration_seconds'=>null,'is_free'=>false],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Kimyasal Bağlar',
                        'description' => 'İyonik, kovalent ve metalik bağlar.',
                        'sort_order' => 2,
                        'topics' => [
                            [
                                'title' => 'İyonik Bağ',
                                'sort_order' => 1,
                                'items' => [
                                    ['type'=>'video','title'=>'İyonik Bağ Oluşumu','url'=>'https://www.youtube.com/embed/B1sEeBXQdRs','duration_seconds'=>960,'is_free'=>false],
                                ],
                            ],
                            [
                                'title' => 'Kovalent Bağ',
                                'sort_order' => 2,
                                'items' => [
                                    ['type'=>'video','title'=>'Kovalent Bağ ve Apolar Bağ','url'=>'https://www.youtube.com/embed/B1sEeBXQdRs','duration_seconds'=>1080,'is_free'=>false],
                                    ['type'=>'pdf','title'=>'Kimyasal Bağlar Özet','url'=>'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1.pdf','duration_seconds'=>null,'is_free'=>false],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            [
                'title' => 'LGS Matematik',
                'slug'  => 'lgs-matematik',
                'description' => 'LGS sınavı 8. sınıf matematik konuları: sayı örüntüleri, cebirsel ifadeler, geometri.',
                'subject'   => 'Matematik',
                'exam_type' => 'LGS',
                'grade'     => 8,
                'level'     => 'beginner',
                'is_active' => true,
                'is_free'   => true,
                'sort_order'=> 5,
                'thumbnail_url' => 'https://img.youtube.com/vi/NybHckSEQBI/hqdefault.jpg',
                'units' => [
                    [
                        'title' => 'Cebirsel İfadeler',
                        'description' => 'Cebirsel ifadelerin sadeleştirilmesi ve çarpanlarına ayrılması.',
                        'sort_order' => 1,
                        'topics' => [
                            [
                                'title' => 'Cebirsel İfade Kavramı',
                                'sort_order' => 1,
                                'items' => [
                                    ['type'=>'video','title'=>'Cebirsel İfadeler Giriş','url'=>'https://www.youtube.com/embed/NybHckSEQBI','duration_seconds'=>1080,'is_free'=>true],
                                    ['type'=>'video','title'=>'Çarpanlarına Ayırma','url'=>'https://www.youtube.com/embed/iMz5Q5g6hRk','duration_seconds'=>1200,'is_free'=>true],
                                    ['type'=>'pdf','title'=>'Cebirsel İfadeler Notu','url'=>'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2.pdf','duration_seconds'=>null,'is_free'=>true],
                                ],
                            ],
                            [
                                'title' => 'Özdeşlikler',
                                'sort_order' => 2,
                                'items' => [
                                    ['type'=>'video','title'=>'Temel Özdeşlikler','url'=>'https://www.youtube.com/embed/8R2lOfTbPLQ','duration_seconds'=>1320,'is_free'=>true],
                                    ['type'=>'video','title'=>'Özdeşlikleri Kullanarak Hesaplama','url'=>'https://www.youtube.com/embed/kHBJvE8hkEA','duration_seconds'=>1140,'is_free'=>false],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Doğrusal Denklemler ve Eşitsizlikler',
                        'description' => 'Birinci dereceden bir bilinmeyenli denklem ve eşitsizlikler.',
                        'sort_order' => 2,
                        'topics' => [
                            [
                                'title' => 'Denklem Çözme',
                                'sort_order' => 1,
                                'items' => [
                                    ['type'=>'video','title'=>'Denklem Çözme Yöntemleri','url'=>'https://www.youtube.com/embed/l3XzepN03KQ','duration_seconds'=>960,'is_free'=>true],
                                    ['type'=>'video','title'=>'Problem Kurma ve Çözme','url'=>'https://www.youtube.com/embed/9yfKRo5EEfU','duration_seconds'=>1080,'is_free'=>true],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Geometri ve Ölçme',
                        'description' => 'Dörtgen prizma, silindir, küre yüzey alanı ve hacim.',
                        'sort_order' => 3,
                        'topics' => [
                            [
                                'title' => 'Üçgenler ve Özel Üçgenler',
                                'sort_order' => 1,
                                'items' => [
                                    ['type'=>'video','title'=>'Pisagor Teoremi','url'=>'https://www.youtube.com/embed/nVbjFBQHfOg','duration_seconds'=>1200,'is_free'=>true],
                                    ['type'=>'video','title'=>'Özel Üçgenler','url'=>'https://www.youtube.com/embed/GQSAKaXPFyQ','duration_seconds'=>1080,'is_free'=>false],
                                    ['type'=>'pdf','title'=>'Geometri Formüller','url'=>'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF3.pdf','duration_seconds'=>null,'is_free'=>true],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            [
                'title' => 'AYT Matematik',
                'slug'  => 'ayt-matematik',
                'description' => 'AYT ileri matematik: türev, integral, limit, diziler ve seriler.',
                'subject'   => 'Matematik',
                'exam_type' => 'AYT',
                'grade'     => 12,
                'level'     => 'advanced',
                'is_active' => true,
                'is_free'   => false,
                'sort_order'=> 6,
                'thumbnail_url' => 'https://img.youtube.com/vi/WUvTyaaNkzM/hqdefault.jpg',
                'units' => [
                    [
                        'title' => 'Limit ve Süreklilik',
                        'description' => 'Limitlerin hesaplanması ve sürekliliğin incelenmesi.',
                        'sort_order' => 1,
                        'topics' => [
                            [
                                'title' => 'Limit Kavramı',
                                'sort_order' => 1,
                                'items' => [
                                    ['type'=>'video','title'=>'Limite Giriş','url'=>'https://www.youtube.com/embed/WUvTyaaNkzM','duration_seconds'=>1680,'is_free'=>false],
                                    ['type'=>'video','title'=>'Sağ ve Sol Limit','url'=>'https://www.youtube.com/embed/riXcZT2ICjA','duration_seconds'=>1440,'is_free'=>false],
                                    ['type'=>'pdf','title'=>'Limit Kuralları','url'=>'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1.pdf','duration_seconds'=>null,'is_free'=>false],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Türev',
                        'description' => 'Türevin tanımı, türev kuralları ve uygulamaları.',
                        'sort_order' => 2,
                        'topics' => [
                            [
                                'title' => 'Türevin Tanımı',
                                'sort_order' => 1,
                                'items' => [
                                    ['type'=>'video','title'=>'Türev Nedir?','url'=>'https://www.youtube.com/embed/ay8838UZ4nM','duration_seconds'=>1560,'is_free'=>false],
                                    ['type'=>'video','title'=>'Türev Alma Kuralları','url'=>'https://www.youtube.com/embed/5yfh5cf4-0o','duration_seconds'=>1320,'is_free'=>false],
                                ],
                            ],
                            [
                                'title' => 'Türevin Uygulamaları',
                                'sort_order' => 2,
                                'items' => [
                                    ['type'=>'video','title'=>'Ekstremum Noktaları','url'=>'https://www.youtube.com/embed/3VMRiT6KHaA','duration_seconds'=>1200,'is_free'=>false],
                                    ['type'=>'video','title'=>'Monotonik Fonksiyonlar','url'=>'https://www.youtube.com/embed/3jFfW9UXrEw','duration_seconds'=>1080,'is_free'=>false],
                                    ['type'=>'pdf','title'=>'Türev Soru Kitapçığı','url'=>'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2.pdf','duration_seconds'=>null,'is_free'=>false],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'İntegral',
                        'description' => 'Belirli ve belirsiz integral, alan hesapları.',
                        'sort_order' => 3,
                        'topics' => [
                            [
                                'title' => 'Belirsiz İntegral',
                                'sort_order' => 1,
                                'items' => [
                                    ['type'=>'video','title'=>'İntegrale Giriş','url'=>'https://www.youtube.com/embed/rfG8ce4nNh0','duration_seconds'=>1440,'is_free'=>false],
                                    ['type'=>'video','title'=>'İntegral Alma Yöntemleri','url'=>'https://www.youtube.com/embed/BUhWBQJCIwI','duration_seconds'=>1560,'is_free'=>false],
                                ],
                            ],
                            [
                                'title' => 'Belirli İntegral ve Alan',
                                'sort_order' => 2,
                                'items' => [
                                    ['type'=>'video','title'=>'Alan Hesabı','url'=>'https://www.youtube.com/embed/BRRolKTlF6Q','duration_seconds'=>1320,'is_free'=>false],
                                    ['type'=>'pdf','title'=>'İntegral Özet Notu','url'=>'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF3.pdf','duration_seconds'=>null,'is_free'=>false],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        // ────────────────────────────────────────────────────────────────
        // VERİ EKLEME
        // ────────────────────────────────────────────────────────────────
        foreach ($courses as $courseData) {
            $units = $courseData['units'];
            unset($courseData['units']);

            $courseId = DB::table('courses')->insertGetId(array_merge($courseData, [
                'created_at' => $now,
                'updated_at' => $now,
            ]));

            foreach ($units as $unitData) {
                $topics = $unitData['topics'];
                unset($unitData['topics']);

                $unitId = DB::table('units')->insertGetId(array_merge($unitData, [
                    'course_id'  => $courseId,
                    'is_active'  => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]));

                foreach ($topics as $topicData) {
                    $items = $topicData['items'];
                    unset($topicData['items']);

                    $topicId = DB::table('topics')->insertGetId(array_merge($topicData, [
                        'unit_id'    => $unitId,
                        'is_active'  => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]));

                    foreach ($items as $order => $item) {
                        DB::table('content_items')->insert(array_merge($item, [
                            'topic_id'   => $topicId,
                            'is_active'  => true,
                            'sort_order' => $order + 1,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]));
                    }
                }
            }
        }

        $this->command->info('CourseSeeder: ' . count($courses) . ' kurs eklendi.');
    }
}
