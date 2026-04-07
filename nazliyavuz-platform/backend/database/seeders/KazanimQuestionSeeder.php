<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class KazanimQuestionSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // ────────────────────────────────────────────────────────────────
        // KAZANIMLAR
        // ────────────────────────────────────────────────────────────────
        $kazanimlar = [
            // TYT Matematik
            ['kod'=>'MAT.TYT.1.1','tanim'=>'Sayı basamakları ve rakamlar arasındaki ilişkiyi kavrar.','subject'=>'Matematik','grade'=>12,'unite'=>'Sayılar','konu'=>'Doğal Sayılar','exam_type'=>'TYT'],
            ['kod'=>'MAT.TYT.1.2','tanim'=>'Doğal sayılarda bölünebilme kurallarını uygular.','subject'=>'Matematik','grade'=>12,'unite'=>'Sayılar','konu'=>'Bölünebilme','exam_type'=>'TYT'],
            ['kod'=>'MAT.TYT.1.3','tanim'=>'Tam sayılarla dört işlem yapar.','subject'=>'Matematik','grade'=>12,'unite'=>'Sayılar','konu'=>'Tam Sayılar','exam_type'=>'TYT'],
            ['kod'=>'MAT.TYT.2.1','tanim'=>'Birinci dereceden bir bilinmeyenli denklem çözer.','subject'=>'Matematik','grade'=>12,'unite'=>'Cebir','konu'=>'Denklemler','exam_type'=>'TYT'],
            ['kod'=>'MAT.TYT.2.2','tanim'=>'İkinci dereceden denklemleri çarpanlarına ayırarak çözer.','subject'=>'Matematik','grade'=>12,'unite'=>'Cebir','konu'=>'İkinci Derece Denklemler','exam_type'=>'TYT'],
            ['kod'=>'MAT.TYT.3.1','tanim'=>'Üçgenlerin alan ve çevre hesaplarını yapar.','subject'=>'Matematik','grade'=>12,'unite'=>'Geometri','konu'=>'Üçgenler','exam_type'=>'TYT'],
            ['kod'=>'MAT.TYT.3.2','tanim'=>'Dörtgenlerin özelliklerini bilir ve hesaplar.','subject'=>'Matematik','grade'=>12,'unite'=>'Geometri','konu'=>'Dörtgenler','exam_type'=>'TYT'],
            // TYT Fizik
            ['kod'=>'FIZ.TYT.1.1','tanim'=>'Newton\'un hareket yasalarını açıklar ve uygular.','subject'=>'Fizik','grade'=>12,'unite'=>'Kuvvet ve Hareket','konu'=>'Newton Yasaları','exam_type'=>'TYT'],
            ['kod'=>'FIZ.TYT.1.2','tanim'=>'Sürtünme kuvvetini tanımlar ve hesaplar.','subject'=>'Fizik','grade'=>12,'unite'=>'Kuvvet ve Hareket','konu'=>'Sürtünme','exam_type'=>'TYT'],
            ['kod'=>'FIZ.TYT.2.1','tanim'=>'İş ve enerji kavramlarını ilişkilendirir.','subject'=>'Fizik','grade'=>12,'unite'=>'Enerji','konu'=>'İş-Enerji','exam_type'=>'TYT'],
            ['kod'=>'FIZ.TYT.2.2','tanim'=>'Kinetik ve potansiyel enerjiyi hesaplar.','subject'=>'Fizik','grade'=>12,'unite'=>'Enerji','konu'=>'Enerji Çeşitleri','exam_type'=>'TYT'],
            // TYT Kimya
            ['kod'=>'KIM.TYT.1.1','tanim'=>'Atom modellerinin tarihsel gelişimini açıklar.','subject'=>'Kimya','grade'=>12,'unite'=>'Atom','konu'=>'Atom Modelleri','exam_type'=>'TYT'],
            ['kod'=>'KIM.TYT.1.2','tanim'=>'Elektron dizilimi yaparak iyonları tanımlar.','subject'=>'Kimya','grade'=>12,'unite'=>'Atom','konu'=>'Elektron Dizilimi','exam_type'=>'TYT'],
            ['kod'=>'KIM.TYT.2.1','tanim'=>'İyonik ve kovalent bağ oluşumunu karşılaştırır.','subject'=>'Kimya','grade'=>12,'unite'=>'Kimyasal Bağlar','konu'=>'Bağ Türleri','exam_type'=>'TYT'],
            // TYT Türkçe
            ['kod'=>'TRK.TYT.1.1','tanim'=>'Paragrafın ana fikrini ve konusunu belirler.','subject'=>'Türkçe','grade'=>12,'unite'=>'Paragraf','konu'=>'Ana Fikir','exam_type'=>'TYT'],
            ['kod'=>'TRK.TYT.1.2','tanim'=>'Paragraf türlerini tanır ve özelliklerini açıklar.','subject'=>'Türkçe','grade'=>12,'unite'=>'Paragraf','konu'=>'Paragraf Türleri','exam_type'=>'TYT'],
            ['kod'=>'TRK.TYT.2.1','tanim'=>'Sözcüklerdeki gerçek ve mecaz anlam farklılığını kavrar.','subject'=>'Türkçe','grade'=>12,'unite'=>'Sözcükte Anlam','konu'=>'Anlam Çeşitleri','exam_type'=>'TYT'],
            ['kod'=>'TRK.TYT.2.2','tanim'=>'İsim ve fiil tamlamalarını doğru kurar.','subject'=>'Türkçe','grade'=>12,'unite'=>'Dil Bilgisi','konu'=>'Tamlamalar','exam_type'=>'TYT'],
            // LGS Matematik
            ['kod'=>'MAT.LGS.1.1','tanim'=>'Cebirsel ifadeleri sadeleştirir.','subject'=>'Matematik','grade'=>8,'unite'=>'Cebir','konu'=>'Cebirsel İfadeler','exam_type'=>'LGS'],
            ['kod'=>'MAT.LGS.1.2','tanim'=>'Özdeşlikleri kullanarak hesaplama yapar.','subject'=>'Matematik','grade'=>8,'unite'=>'Cebir','konu'=>'Özdeşlikler','exam_type'=>'LGS'],
            ['kod'=>'MAT.LGS.2.1','tanim'=>'Birinci dereceden denklem kurar ve çözer.','subject'=>'Matematik','grade'=>8,'unite'=>'Denklemler','konu'=>'Denklem Kurma','exam_type'=>'LGS'],
            ['kod'=>'MAT.LGS.3.1','tanim'=>'Pisagor teoremini bilir ve uygular.','subject'=>'Matematik','grade'=>8,'unite'=>'Geometri','konu'=>'Pisagor','exam_type'=>'LGS'],
            // AYT Matematik
            ['kod'=>'MAT.AYT.1.1','tanim'=>'Bir fonksiyonun limitini hesaplar.','subject'=>'Matematik','grade'=>12,'unite'=>'Limit','konu'=>'Limit Hesaplama','exam_type'=>'AYT'],
            ['kod'=>'MAT.AYT.2.1','tanim'=>'Türev tanımını ve kurallarını kullanır.','subject'=>'Matematik','grade'=>12,'unite'=>'Türev','konu'=>'Türev Kuralları','exam_type'=>'AYT'],
            ['kod'=>'MAT.AYT.2.2','tanim'=>'Türevi kullanarak ekstremum noktalarını bulur.','subject'=>'Matematik','grade'=>12,'unite'=>'Türev','konu'=>'Türev Uygulamaları','exam_type'=>'AYT'],
            ['kod'=>'MAT.AYT.3.1','tanim'=>'Belirsiz integral hesaplar.','subject'=>'Matematik','grade'=>12,'unite'=>'İntegral','konu'=>'Belirsiz İntegral','exam_type'=>'AYT'],
            ['kod'=>'MAT.AYT.3.2','tanim'=>'Belirli integral ile alan hesaplar.','subject'=>'Matematik','grade'=>12,'unite'=>'İntegral','konu'=>'Belirli İntegral','exam_type'=>'AYT'],
        ];

        $kazanimIdMap = [];
        foreach ($kazanimlar as $k) {
            $id = DB::table('kazanimlar')->insertGetId(array_merge($k, [
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]));
            $kazanimIdMap[$k['kod']] = $id;
        }
        $this->command->info('KazanimSeeder: ' . count($kazanimlar) . ' kazanım eklendi.');

        // ────────────────────────────────────────────────────────────────
        // SORULAR
        // ────────────────────────────────────────────────────────────────
        $questions = [
            // MAT.TYT.1.1 - Sayı Basamakları
            [
                'kazanim_kod' => 'MAT.TYT.1.1',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'easy',
                'question_text' => '3 basamaklı en büyük doğal sayı ile 2 basamaklı en küçük doğal sayının farkı kaçtır?',
                'solution_text' => '3 basamaklı en büyük doğal sayı 999, 2 basamaklı en küçük doğal sayı 10\'dur. 999 - 10 = 989',
                'options' => [
                    ['letter'=>'A','text'=>'879','is_correct'=>false],
                    ['letter'=>'B','text'=>'889','is_correct'=>false],
                    ['letter'=>'C','text'=>'989','is_correct'=>true],
                    ['letter'=>'D','text'=>'999','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.TYT.1.1',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'easy',
                'question_text' => '4527 sayısında yüzler basamağının değeri nedir?',
                'solution_text' => '4527 sayısında yüzler basamağında 5 rakamı bulunur. 5 × 100 = 500',
                'options' => [
                    ['letter'=>'A','text'=>'5','is_correct'=>false],
                    ['letter'=>'B','text'=>'50','is_correct'=>false],
                    ['letter'=>'C','text'=>'500','is_correct'=>true],
                    ['letter'=>'D','text'=>'5000','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.TYT.1.1',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'medium',
                'question_text' => 'Basamakları farklı 3 basamaklı kaç tane doğal sayı vardır?',
                'solution_text' => 'Yüzler basamağı 1-9 arası (9 seçenek), onlar basamağı yüzler hariç 0-9 arası (9 seçenek), birler basamağı kalan (8 seçenek). 9×9×8 = 648',
                'options' => [
                    ['letter'=>'A','text'=>'504','is_correct'=>false],
                    ['letter'=>'B','text'=>'648','is_correct'=>true],
                    ['letter'=>'C','text'=>'720','is_correct'=>false],
                    ['letter'=>'D','text'=>'900','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.TYT.1.1',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'medium',
                'question_text' => 'A, B, C rakamlarından oluşan ̄ABC sayısında A + B + C = 15 ise bu sayı kaçın katıdır?',
                'solution_text' => 'Rakamlar toplamı 9\'un katı olduğunda sayı 9\'a bölünür. 15, 9\'un katı değildir ancak 3\'ün katıdır. Sayı 3\'e tam bölünür.',
                'options' => [
                    ['letter'=>'A','text'=>'2','is_correct'=>false],
                    ['letter'=>'B','text'=>'3','is_correct'=>true],
                    ['letter'=>'C','text'=>'5','is_correct'=>false],
                    ['letter'=>'D','text'=>'9','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.TYT.1.1',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'hard',
                'question_text' => '1\'den 100\'e kadar olan sayıların rakamları toplamı kaçtır?',
                'solution_text' => '1-9: 1+2+...+9=45. 10-99: Her onluk için onlar basamakları 1-9 kez (10 tekrar): 45×10=450, birler basamakları her onlukta 0-9 (10 tekrar): 45×10=450. Toplam: 45+450+450+1=946. 100: 1. Genel toplam: 946',
                'options' => [
                    ['letter'=>'A','text'=>'856','is_correct'=>false],
                    ['letter'=>'B','text'=>'901','is_correct'=>false],
                    ['letter'=>'C','text'=>'946','is_correct'=>true],
                    ['letter'=>'D','text'=>'1000','is_correct'=>false],
                ],
            ],
            // MAT.TYT.1.2 - Bölünebilme
            [
                'kazanim_kod' => 'MAT.TYT.1.2',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'easy',
                'question_text' => '2A4 sayısı 3\'e bölünebiliyorsa A rakamı kaç olabilir?',
                'solution_text' => '2 + A + 4 = 6 + A, bu 3\'e bölünmeli. A = 0, 3, 6 veya 9 olabilir.',
                'options' => [
                    ['letter'=>'A','text'=>'1','is_correct'=>false],
                    ['letter'=>'B','text'=>'3','is_correct'=>true],
                    ['letter'=>'C','text'=>'5','is_correct'=>false],
                    ['letter'=>'D','text'=>'7','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.TYT.1.2',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'easy',
                'question_text' => 'Hangi sayı hem 2\'ye hem de 3\'e bölünür?',
                'solution_text' => '2\'ye bölünen son rakamı çift, 3\'e bölünen rakamlar toplamı 3\'ün katı olanıdır. 48: 4+8=12, 3\'ün katı ve son rakam çift.',
                'options' => [
                    ['letter'=>'A','text'=>'14','is_correct'=>false],
                    ['letter'=>'B','text'=>'21','is_correct'=>false],
                    ['letter'=>'C','text'=>'35','is_correct'=>false],
                    ['letter'=>'D','text'=>'48','is_correct'=>true],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.TYT.1.2',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'medium',
                'question_text' => '5A6B sayısı 4\'e bölünebilmesi için B ne olabilir?',
                'solution_text' => '4\'e bölünebilme: Son iki rakam 4\'e tam bölünmeli. 6B sayısı 4\'e bölünmeli. 60÷4=15(r0), 64÷4=16, 68÷4=17. B=0,4,8 olabilir.',
                'options' => [
                    ['letter'=>'A','text'=>'0','is_correct'=>true],
                    ['letter'=>'B','text'=>'2','is_correct'=>false],
                    ['letter'=>'C','text'=>'5','is_correct'=>false],
                    ['letter'=>'D','text'=>'7','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.TYT.1.2',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'medium',
                'question_text' => '1\'den 50\'ye kadar olan 4\'e bölünen sayıların toplamı kaçtır?',
                'solution_text' => '4, 8, 12, ..., 48 → a=4, d=4, l=48 → n=12. S = 12(4+48)/2 = 12×26 = 312',
                'options' => [
                    ['letter'=>'A','text'=>'288','is_correct'=>false],
                    ['letter'=>'B','text'=>'300','is_correct'=>false],
                    ['letter'=>'C','text'=>'312','is_correct'=>true],
                    ['letter'=>'D','text'=>'324','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.TYT.1.2',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'hard',
                'question_text' => 'ABAB biçimindeki 4 basamaklı sayı 101\'e bölünür. Bu sayının 7 ile bölümünden kalan kaçtır?',
                'solution_text' => 'ABAB = AB×100 + AB = AB×101. Bu zaten 101\'e tam bölünür. AB yerine 14 alalım: 1414÷7 = 202, kalan 0.',
                'options' => [
                    ['letter'=>'A','text'=>'0','is_correct'=>true],
                    ['letter'=>'B','text'=>'1','is_correct'=>false],
                    ['letter'=>'C','text'=>'3','is_correct'=>false],
                    ['letter'=>'D','text'=>'5','is_correct'=>false],
                ],
            ],
            // MAT.TYT.2.1 - Denklemler
            [
                'kazanim_kod' => 'MAT.TYT.2.1',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'easy',
                'question_text' => '2x + 6 = 14 denkleminin çözümü kaçtır?',
                'solution_text' => '2x = 14 - 6 = 8, x = 4',
                'options' => [
                    ['letter'=>'A','text'=>'2','is_correct'=>false],
                    ['letter'=>'B','text'=>'3','is_correct'=>false],
                    ['letter'=>'C','text'=>'4','is_correct'=>true],
                    ['letter'=>'D','text'=>'5','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.TYT.2.1',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'easy',
                'question_text' => 'Bir sayının 3 katından 5 çıkarıldığında 16 elde ediliyor. Bu sayı kaçtır?',
                'solution_text' => '3x - 5 = 16 → 3x = 21 → x = 7',
                'options' => [
                    ['letter'=>'A','text'=>'5','is_correct'=>false],
                    ['letter'=>'B','text'=>'6','is_correct'=>false],
                    ['letter'=>'C','text'=>'7','is_correct'=>true],
                    ['letter'=>'D','text'=>'8','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.TYT.2.1',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'medium',
                'question_text' => '3x - 2 = 5x + 6 denkleminin çözüm kümesi nedir?',
                'solution_text' => '3x - 5x = 6 + 2 → -2x = 8 → x = -4',
                'options' => [
                    ['letter'=>'A','text'=>'-4','is_correct'=>true],
                    ['letter'=>'B','text'=>'-2','is_correct'=>false],
                    ['letter'=>'C','text'=>'2','is_correct'=>false],
                    ['letter'=>'D','text'=>'4','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.TYT.2.1',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'medium',
                'question_text' => 'Yaşı 5 yıl önce şimdiki yaşının yarısı olan kişinin bugünkü yaşı kaçtır?',
                'solution_text' => 'x - 5 = x/2 → 2x - 10 = x → x = 10',
                'options' => [
                    ['letter'=>'A','text'=>'8','is_correct'=>false],
                    ['letter'=>'B','text'=>'10','is_correct'=>true],
                    ['letter'=>'C','text'=>'12','is_correct'=>false],
                    ['letter'=>'D','text'=>'15','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.TYT.2.1',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'hard',
                'question_text' => 'x/(x-2) + 4/(x+2) = 2 denkleminin çözümü kaçtır? (x≠2, x≠-2)',
                'solution_text' => 'x(x+2) + 4(x-2) = 2(x-2)(x+2) → x²+6x-8 = 2x²-8 → x²-6x = 0 → x(x-6)=0 → x=6 (x=0 kontrol edilmeli)',
                'options' => [
                    ['letter'=>'A','text'=>'0','is_correct'=>false],
                    ['letter'=>'B','text'=>'2','is_correct'=>false],
                    ['letter'=>'C','text'=>'4','is_correct'=>false],
                    ['letter'=>'D','text'=>'6','is_correct'=>true],
                ],
            ],
            // FIZ.TYT.1.1 - Newton Yasaları
            [
                'kazanim_kod' => 'FIZ.TYT.1.1',
                'subject' => 'Fizik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'easy',
                'question_text' => '10 kg\'lık bir cisme 50 N kuvvet uygulandığında ivmesi kaç m/s² olur?',
                'solution_text' => 'F = ma → a = F/m = 50/10 = 5 m/s²',
                'options' => [
                    ['letter'=>'A','text'=>'2','is_correct'=>false],
                    ['letter'=>'B','text'=>'5','is_correct'=>true],
                    ['letter'=>'C','text'=>'10','is_correct'=>false],
                    ['letter'=>'D','text'=>'50','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'FIZ.TYT.1.1',
                'subject' => 'Fizik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'easy',
                'question_text' => 'Bir cisim üzerindeki net kuvvet sıfır ise cisim ne yapar?',
                'solution_text' => 'Newton\'un 1. yasası: Net kuvvet sıfır ise cisim duruyorsa durmaya, hareket ediyorsa sabit hızla gitmeye devam eder.',
                'options' => [
                    ['letter'=>'A','text'=>'Durur','is_correct'=>false],
                    ['letter'=>'B','text'=>'Hızlanır','is_correct'=>false],
                    ['letter'=>'C','text'=>'Sabit hızla hareket eder','is_correct'=>true],
                    ['letter'=>'D','text'=>'Yavaşlar','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'FIZ.TYT.1.1',
                'subject' => 'Fizik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'medium',
                'question_text' => '5 kg\'lık bir cisim 3 m/s² ivmeyle hareket ediyorsa, uygulanan net kuvvet kaç N\'dır?',
                'solution_text' => 'F = ma = 5 × 3 = 15 N',
                'options' => [
                    ['letter'=>'A','text'=>'8 N','is_correct'=>false],
                    ['letter'=>'B','text'=>'10 N','is_correct'=>false],
                    ['letter'=>'C','text'=>'15 N','is_correct'=>true],
                    ['letter'=>'D','text'=>'20 N','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'FIZ.TYT.1.1',
                'subject' => 'Fizik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'medium',
                'question_text' => 'Bir araca uygulanan kuvvet 2 katına çıkarılırsa ve kütle aynı kalırsa ivme ne olur?',
                'solution_text' => 'F=ma → F\'=2F=2ma\'=ma\' → a\'=2a. İvme 2 kat artar.',
                'options' => [
                    ['letter'=>'A','text'=>'Yarıya iner','is_correct'=>false],
                    ['letter'=>'B','text'=>'Aynı kalır','is_correct'=>false],
                    ['letter'=>'C','text'=>'2 kat artar','is_correct'=>true],
                    ['letter'=>'D','text'=>'4 kat artar','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'FIZ.TYT.1.1',
                'subject' => 'Fizik', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'hard',
                'question_text' => 'İp aracılığıyla birbirine bağlı 4 kg ve 6 kg\'lık cisimler 20 N kuvvetle çekilmektedir. İpteki gerilme kuvveti kaç N\'dır?',
                'solution_text' => 'Toplam kütle = 10 kg. a = 20/10 = 2 m/s². İp gerilmesi: T = 4×2 = 8 N veya T = 20 - 6×2 = 8 N',
                'options' => [
                    ['letter'=>'A','text'=>'4 N','is_correct'=>false],
                    ['letter'=>'B','text'=>'8 N','is_correct'=>true],
                    ['letter'=>'C','text'=>'10 N','is_correct'=>false],
                    ['letter'=>'D','text'=>'12 N','is_correct'=>false],
                ],
            ],
            // KIM.TYT.1.1 - Atom Modelleri
            [
                'kazanim_kod' => 'KIM.TYT.1.1',
                'subject' => 'Kimya', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'easy',
                'question_text' => 'Hangi atom modeli, elektronların belli yörüngelerde hareket ettiğini öne sürmüştür?',
                'solution_text' => 'Bohr modeli elektronların dairesel yörüngelerde hareket ettiğini öngörür.',
                'options' => [
                    ['letter'=>'A','text'=>'Dalton','is_correct'=>false],
                    ['letter'=>'B','text'=>'Thomson','is_correct'=>false],
                    ['letter'=>'C','text'=>'Rutherford','is_correct'=>false],
                    ['letter'=>'D','text'=>'Bohr','is_correct'=>true],
                ],
            ],
            [
                'kazanim_kod' => 'KIM.TYT.1.1',
                'subject' => 'Kimya', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'easy',
                'question_text' => 'Rutherford\'un altın folyo deneyi hangi sonucu ortaya koymuştur?',
                'solution_text' => 'Alfaların büyük çoğunluğu geçti, az bir kısmı geri döndü. Pozitif yük ve kütle çekirdekte toplanmış.',
                'options' => [
                    ['letter'=>'A','text'=>'Elektronların varlığı','is_correct'=>false],
                    ['letter'=>'B','text'=>'Çekirdeğin varlığı','is_correct'=>true],
                    ['letter'=>'C','text'=>'Nötronun keşfi','is_correct'=>false],
                    ['letter'=>'D','text'=>'Proton sayısı','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'KIM.TYT.1.1',
                'subject' => 'Kimya', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'medium',
                'question_text' => '¹²₆C atomunda kaç nötron vardır?',
                'solution_text' => 'Nötron sayısı = Kütle sayısı - Proton sayısı = 12 - 6 = 6',
                'options' => [
                    ['letter'=>'A','text'=>'3','is_correct'=>false],
                    ['letter'=>'B','text'=>'6','is_correct'=>true],
                    ['letter'=>'C','text'=>'12','is_correct'=>false],
                    ['letter'=>'D','text'=>'18','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'KIM.TYT.1.1',
                'subject' => 'Kimya', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'medium',
                'question_text' => 'Atomun hangi özelliği element kimliğini belirler?',
                'solution_text' => 'Proton sayısı (atom numarası) her element için sabittir ve elementi tanımlar.',
                'options' => [
                    ['letter'=>'A','text'=>'Nötron sayısı','is_correct'=>false],
                    ['letter'=>'B','text'=>'Proton sayısı','is_correct'=>true],
                    ['letter'=>'C','text'=>'Elektron sayısı','is_correct'=>false],
                    ['letter'=>'D','text'=>'Kütle sayısı','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'KIM.TYT.1.1',
                'subject' => 'Kimya', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'hard',
                'question_text' => '¹⁴N ve ¹⁵N aynı elementin izotoplarıdır. Farkları nedir?',
                'solution_text' => 'İzotoplar aynı proton sayısına (7) sahip fakat farklı nötron sayısına sahiptir. ¹⁴N: 7 nötron, ¹⁵N: 8 nötron.',
                'options' => [
                    ['letter'=>'A','text'=>'Proton sayıları','is_correct'=>false],
                    ['letter'=>'B','text'=>'Nötron sayıları','is_correct'=>true],
                    ['letter'=>'C','text'=>'Elektron sayıları','is_correct'=>false],
                    ['letter'=>'D','text'=>'Atom numaraları','is_correct'=>false],
                ],
            ],
            // TRK.TYT.1.1 - Paragraf Ana Fikir
            [
                'kazanim_kod' => 'TRK.TYT.1.1',
                'subject' => 'Türkçe', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'easy',
                'question_text' => '"Teknoloji hayatımızı kolaylaştırır; ancak aşırı kullanımı bizi tembelleştirebilir." Bu cümlenin ana fikri nedir?',
                'solution_text' => 'Cümle hem teknolojinin faydalarını hem de zararlarını anlatmaktadır. Ana fikir: Teknolojinin ölçülü kullanılması gerekir.',
                'options' => [
                    ['letter'=>'A','text'=>'Teknoloji zararlıdır','is_correct'=>false],
                    ['letter'=>'B','text'=>'Teknolojiyi kullanmamalıyız','is_correct'=>false],
                    ['letter'=>'C','text'=>'Teknoloji ölçülü kullanılmalıdır','is_correct'=>true],
                    ['letter'=>'D','text'=>'Teknoloji hayatı zorlaştırır','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'TRK.TYT.1.1',
                'subject' => 'Türkçe', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'easy',
                'question_text' => 'Bir paragrafın ana fikri nerede bulunur?',
                'solution_text' => 'Ana fikir genellikle paragrafın giriş ya da sonuç kısmında yer alır.',
                'options' => [
                    ['letter'=>'A','text'=>'Her zaman ilk cümlede','is_correct'=>false],
                    ['letter'=>'B','text'=>'Her zaman son cümlede','is_correct'=>false],
                    ['letter'=>'C','text'=>'Genellikle başta ya da sonda','is_correct'=>true],
                    ['letter'=>'D','text'=>'Hiçbir zaman belirtilmez','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'TRK.TYT.1.1',
                'subject' => 'Türkçe', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'medium',
                'question_text' => '"Sevgi" konulu bir paragrafın başlığı hangisi olabilir?',
                'solution_text' => 'Başlık konuyu kapsayıcı ve öz olmalıdır.',
                'options' => [
                    ['letter'=>'A','text'=>'Mutluluk Nedir?','is_correct'=>false],
                    ['letter'=>'B','text'=>'Sevginin Gücü','is_correct'=>true],
                    ['letter'=>'C','text'=>'İnsanın Özellikleri','is_correct'=>false],
                    ['letter'=>'D','text'=>'Duygu Dünyası','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'TRK.TYT.1.1',
                'subject' => 'Türkçe', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'medium',
                'question_text' => 'Konu ile ana fikrin farkı nedir?',
                'solution_text' => 'Konu "ne anlatıldığı"nı, ana fikir ise "ne demek istediğini" ifade eder.',
                'options' => [
                    ['letter'=>'A','text'=>'Aralarında hiç fark yoktur','is_correct'=>false],
                    ['letter'=>'B','text'=>'Konu tek kelime, ana fikir cümledir','is_correct'=>false],
                    ['letter'=>'C','text'=>'Konu ne anlatıldığı, ana fikir mesajdır','is_correct'=>true],
                    ['letter'=>'D','text'=>'Ana fikir konudan daha kısadır','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'TRK.TYT.1.1',
                'subject' => 'Türkçe', 'grade' => 12, 'exam_type' => 'TYT', 'difficulty' => 'hard',
                'question_text' => '"Güzellik, dış görünüşle değil, iç dünyayla ölçülür." Bu cümle hangi anlatım türüne aittir?',
                'solution_text' => 'Soyut bir değer yargısı içerdiğinden düşünce yazısı (deneme/makale) türüne uygundur.',
                'options' => [
                    ['letter'=>'A','text'=>'Açıklayıcı','is_correct'=>false],
                    ['letter'=>'B','text'=>'Betimleyici','is_correct'=>false],
                    ['letter'=>'C','text'=>'Kanıtlayıcı','is_correct'=>false],
                    ['letter'=>'D','text'=>'Tartışmacı','is_correct'=>true],
                ],
            ],
            // MAT.LGS.1.1 - Cebirsel İfadeler
            [
                'kazanim_kod' => 'MAT.LGS.1.1',
                'subject' => 'Matematik', 'grade' => 8, 'exam_type' => 'LGS', 'difficulty' => 'easy',
                'question_text' => '3a + 2b − a + 4b ifadesinin en sade hali nedir?',
                'solution_text' => '3a − a = 2a ve 2b + 4b = 6b. Sonuç: 2a + 6b',
                'options' => [
                    ['letter'=>'A','text'=>'4a + 6b','is_correct'=>false],
                    ['letter'=>'B','text'=>'2a + 6b','is_correct'=>true],
                    ['letter'=>'C','text'=>'2a + 2b','is_correct'=>false],
                    ['letter'=>'D','text'=>'6a + 6b','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.LGS.1.1',
                'subject' => 'Matematik', 'grade' => 8, 'exam_type' => 'LGS', 'difficulty' => 'easy',
                'question_text' => 'x = 3 iken 2x² − 5x + 1 ifadesinin değeri nedir?',
                'solution_text' => '2(9) − 5(3) + 1 = 18 − 15 + 1 = 4',
                'options' => [
                    ['letter'=>'A','text'=>'2','is_correct'=>false],
                    ['letter'=>'B','text'=>'4','is_correct'=>true],
                    ['letter'=>'C','text'=>'6','is_correct'=>false],
                    ['letter'=>'D','text'=>'8','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.LGS.1.1',
                'subject' => 'Matematik', 'grade' => 8, 'exam_type' => 'LGS', 'difficulty' => 'medium',
                'question_text' => '12x²y − 8xy² ifadesinin en büyük ortak çarpanı nedir?',
                'solution_text' => 'EOÇ: 4xy. 12x²y = 4xy·3x ve 8xy² = 4xy·2y',
                'options' => [
                    ['letter'=>'A','text'=>'4x','is_correct'=>false],
                    ['letter'=>'B','text'=>'4y','is_correct'=>false],
                    ['letter'=>'C','text'=>'4xy','is_correct'=>true],
                    ['letter'=>'D','text'=>'8xy','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.LGS.1.1',
                'subject' => 'Matematik', 'grade' => 8, 'exam_type' => 'LGS', 'difficulty' => 'medium',
                'question_text' => '(a + b)² − (a − b)² ifadesini sadeleştirin.',
                'solution_text' => '(a+b)² = a²+2ab+b², (a-b)² = a²-2ab+b². Fark: 4ab',
                'options' => [
                    ['letter'=>'A','text'=>'2ab','is_correct'=>false],
                    ['letter'=>'B','text'=>'4ab','is_correct'=>true],
                    ['letter'=>'C','text'=>'4a²','is_correct'=>false],
                    ['letter'=>'D','text'=>'2a² + 2b²','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.LGS.1.1',
                'subject' => 'Matematik', 'grade' => 8, 'exam_type' => 'LGS', 'difficulty' => 'hard',
                'question_text' => 'x + y = 7 ve xy = 12 ise x² + y² kaçtır?',
                'solution_text' => 'x² + y² = (x+y)² − 2xy = 49 − 24 = 25',
                'options' => [
                    ['letter'=>'A','text'=>'15','is_correct'=>false],
                    ['letter'=>'B','text'=>'25','is_correct'=>true],
                    ['letter'=>'C','text'=>'35','is_correct'=>false],
                    ['letter'=>'D','text'=>'49','is_correct'=>false],
                ],
            ],
            // MAT.LGS.3.1 - Pisagor
            [
                'kazanim_kod' => 'MAT.LGS.3.1',
                'subject' => 'Matematik', 'grade' => 8, 'exam_type' => 'LGS', 'difficulty' => 'easy',
                'question_text' => 'Dik üçgenin iki dik kenarı 3 ve 4 ise hipotenüs kaçtır?',
                'solution_text' => 'c² = 3² + 4² = 9 + 16 = 25 → c = 5',
                'options' => [
                    ['letter'=>'A','text'=>'5','is_correct'=>true],
                    ['letter'=>'B','text'=>'6','is_correct'=>false],
                    ['letter'=>'C','text'=>'7','is_correct'=>false],
                    ['letter'=>'D','text'=>'8','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.LGS.3.1',
                'subject' => 'Matematik', 'grade' => 8, 'exam_type' => 'LGS', 'difficulty' => 'easy',
                'question_text' => 'Hipotenüsü 13, bir dik kenarı 5 olan dik üçgenin diğer dik kenarı kaçtır?',
                'solution_text' => 'b² = 13² − 5² = 169 − 25 = 144 → b = 12',
                'options' => [
                    ['letter'=>'A','text'=>'8','is_correct'=>false],
                    ['letter'=>'B','text'=>'10','is_correct'=>false],
                    ['letter'=>'C','text'=>'12','is_correct'=>true],
                    ['letter'=>'D','text'=>'14','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.LGS.3.1',
                'subject' => 'Matematik', 'grade' => 8, 'exam_type' => 'LGS', 'difficulty' => 'medium',
                'question_text' => 'Kenar uzunlukları 6, 8, 10 olan üçgen dik açılı mıdır?',
                'solution_text' => '6² + 8² = 36 + 64 = 100 = 10². Evet, dik üçgendir.',
                'options' => [
                    ['letter'=>'A','text'=>'Evet, dik üçgendir','is_correct'=>true],
                    ['letter'=>'B','text'=>'Hayır, dar açılıdır','is_correct'=>false],
                    ['letter'=>'C','text'=>'Hayır, geniş açılıdır','is_correct'=>false],
                    ['letter'=>'D','text'=>'Üçgen oluşturulamaz','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.LGS.3.1',
                'subject' => 'Matematik', 'grade' => 8, 'exam_type' => 'LGS', 'difficulty' => 'medium',
                'question_text' => 'Köşegen uzunluğu 10 cm olan bir karenin kenar uzunluğu kaçtır?',
                'solution_text' => 'a² + a² = 10² → 2a² = 100 → a² = 50 → a = 5√2',
                'options' => [
                    ['letter'=>'A','text'=>'5','is_correct'=>false],
                    ['letter'=>'B','text'=>'5√2','is_correct'=>true],
                    ['letter'=>'C','text'=>'10','is_correct'=>false],
                    ['letter'=>'D','text'=>'10√2','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.LGS.3.1',
                'subject' => 'Matematik', 'grade' => 8, 'exam_type' => 'LGS', 'difficulty' => 'hard',
                'question_text' => 'Dik üçgende hipotenüs üzerine inen yükseklik h, dik kenarlar a ve b ise 1/h² = ?',
                'solution_text' => 'Dik üçgendeki yükseklik bağıntısı: 1/h² = 1/a² + 1/b²',
                'options' => [
                    ['letter'=>'A','text'=>'1/a + 1/b','is_correct'=>false],
                    ['letter'=>'B','text'=>'1/a² + 1/b²','is_correct'=>true],
                    ['letter'=>'C','text'=>'a² + b²','is_correct'=>false],
                    ['letter'=>'D','text'=>'ab/(a+b)','is_correct'=>false],
                ],
            ],
            // MAT.AYT.2.1 - Türev
            [
                'kazanim_kod' => 'MAT.AYT.2.1',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'AYT', 'difficulty' => 'easy',
                'question_text' => 'f(x) = x³ − 2x + 5 fonksiyonunun türevi nedir?',
                'solution_text' => 'f\'(x) = 3x² − 2',
                'options' => [
                    ['letter'=>'A','text'=>'3x² + 2','is_correct'=>false],
                    ['letter'=>'B','text'=>'3x² − 2','is_correct'=>true],
                    ['letter'=>'C','text'=>'x² − 2','is_correct'=>false],
                    ['letter'=>'D','text'=>'3x − 2','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.AYT.2.1',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'AYT', 'difficulty' => 'easy',
                'question_text' => 'f(x) = 5x⁴ fonksiyonunun türevi nedir?',
                'solution_text' => 'f\'(x) = 5 · 4 · x³ = 20x³',
                'options' => [
                    ['letter'=>'A','text'=>'5x³','is_correct'=>false],
                    ['letter'=>'B','text'=>'20x³','is_correct'=>true],
                    ['letter'=>'C','text'=>'20x⁴','is_correct'=>false],
                    ['letter'=>'D','text'=>'4x³','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.AYT.2.1',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'AYT', 'difficulty' => 'medium',
                'question_text' => 'f(x) = (2x+1)(x²−3) fonksiyonunun x=1\'deki türevi nedir?',
                'solution_text' => 'f\'(x) = 2(x²-3) + (2x+1)(2x) = 2x²-6 + 4x²+2x = 6x²+2x-6. f\'(1) = 6+2-6 = 2',
                'options' => [
                    ['letter'=>'A','text'=>'-2','is_correct'=>false],
                    ['letter'=>'B','text'=>'0','is_correct'=>false],
                    ['letter'=>'C','text'=>'2','is_correct'=>true],
                    ['letter'=>'D','text'=>'4','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.AYT.2.1',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'AYT', 'difficulty' => 'medium',
                'question_text' => 'y = sin(x)·cos(x) ifadesinin türevi nedir?',
                'solution_text' => 'y\' = cos²(x) - sin²(x) = cos(2x)',
                'options' => [
                    ['letter'=>'A','text'=>'sin(2x)','is_correct'=>false],
                    ['letter'=>'B','text'=>'cos(2x)','is_correct'=>true],
                    ['letter'=>'C','text'=>'-sin(2x)','is_correct'=>false],
                    ['letter'=>'D','text'=>'1','is_correct'=>false],
                ],
            ],
            [
                'kazanim_kod' => 'MAT.AYT.2.1',
                'subject' => 'Matematik', 'grade' => 12, 'exam_type' => 'AYT', 'difficulty' => 'hard',
                'question_text' => 'f(x) = e^(x²) fonksiyonunun türevi nedir?',
                'solution_text' => 'Zincir kuralı: f\'(x) = e^(x²) · 2x = 2x·e^(x²)',
                'options' => [
                    ['letter'=>'A','text'=>'e^(x²)','is_correct'=>false],
                    ['letter'=>'B','text'=>'x·e^(x²)','is_correct'=>false],
                    ['letter'=>'C','text'=>'2x·e^(x²)','is_correct'=>true],
                    ['letter'=>'D','text'=>'2·e^(x²)','is_correct'=>false],
                ],
            ],
        ];

        // ────────────────────────────────────────────────────────────────
        // SORU VE SEÇENEK EKLEME
        // ────────────────────────────────────────────────────────────────
        $questionCount = 0;
        $optionCount   = 0;

        foreach ($questions as $qData) {
            $options        = $qData['options'];
            $kazanimKod     = $qData['kazanim_kod'];
            $kazanimId      = $kazanimIdMap[$kazanimKod] ?? null;

            unset($qData['options'], $qData['kazanim_kod']);

            $questionId = DB::table('questions')->insertGetId(array_merge($qData, [
                'kazanim_id'      => $kazanimId,
                'kazanim_code'    => $kazanimKod,
                'type'            => 'classic',
                'is_active'       => true,
                'total_attempts'  => rand(0, 200),
                'correct_attempts'=> rand(0, 100),
                'created_at'      => $now,
                'updated_at'      => $now,
            ]));
            $questionCount++;

            foreach ($options as $sort => $opt) {
                DB::table('question_options')->insert([
                    'question_id'   => $questionId,
                    'option_letter' => $opt['letter'],
                    'option_text'   => $opt['text'],
                    'is_correct'    => $opt['is_correct'],
                    'sort_order'    => $sort + 1,
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ]);
                $optionCount++;
            }
        }

        $this->command->info("KazanimQuestionSeeder: {$questionCount} soru, {$optionCount} seçenek eklendi.");
    }
}
