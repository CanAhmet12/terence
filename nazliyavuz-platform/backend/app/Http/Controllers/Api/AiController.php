<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\QuestionAnswer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AiController extends Controller
{
    private function openAiRequest(array $messages, int $maxTokens = 800): ?string
    {
        $apiKey = config('services.openai.key', env('OPENAI_API_KEY'));
        if (!$apiKey) {
            return null;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type'  => 'application/json',
            ])->timeout(30)->post('https://api.openai.com/v1/chat/completions', [
                'model'       => 'gpt-4o-mini',
                'messages'    => $messages,
                'max_tokens'  => $maxTokens,
                'temperature' => 0.7,
            ]);

            if ($response->successful()) {
                return $response->json('choices.0.message.content');
            }
            Log::error('OpenAI API error', ['status' => $response->status(), 'body' => $response->body()]);
            return null;
        } catch (\Exception $e) {
            Log::error('OpenAI request failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    // POST /api/ai/generate-question
    public function generateQuestion(Request $request): JsonResponse
    {
        $request->validate([
            'subject'    => 'required|string|max:100',
            'topic'      => 'required|string|max:200',
            'difficulty' => 'required|in:easy,medium,hard',
            'kazanim'    => 'nullable|string|max:100',
        ]);

        $prompt = "Sen bir Türk eğitim platformu için soru üretiyorsun. Aşağıdaki kriterlere göre çoktan seçmeli bir soru üret:\n\n"
            . "Ders: {$request->subject}\n"
            . "Konu: {$request->topic}\n"
            . "Zorluk: {$request->difficulty}\n"
            . ($request->kazanim ? "Kazanım: {$request->kazanim}\n" : "")
            . "\nLütfen aşağıdaki JSON formatında yanıt ver (başka hiçbir şey yazma):\n"
            . '{"stem":"Soru metni buraya","options":["A) Seçenek","B) Seçenek","C) Seçenek","D) Seçenek"],"correct_option":0,"explanation":"Açıklama buraya"}';

        $aiResponse = $this->openAiRequest([
            ['role' => 'system', 'content' => 'Sen Türk öğrenciler için soru üreten bir eğitim asistanısın. Sadece JSON formatında yanıt ver.'],
            ['role' => 'user', 'content' => $prompt],
        ], 600);

        if (!$aiResponse) {
            // Fallback: demo soru döndür
            return response()->json([
                'success' => true,
                'question' => [
                    'stem'           => "{$request->topic} konusuyla ilgili örnek bir soru: Aşağıdakilerden hangisi {$request->topic} için doğrudur?",
                    'options'        => ['A) Birinci seçenek', 'B) İkinci seçenek', 'C) Üçüncü seçenek (Doğru)', 'D) Dördüncü seçenek'],
                    'correct_option' => 2,
                    'explanation'    => "Bu sorunun doğru cevabı C şıkkıdır. {$request->topic} konusunda bu bilgi temel düzeyde önemlidir.",
                    'subject'        => $request->subject,
                    'topic'          => $request->topic,
                    'difficulty'     => $request->difficulty,
                    'source'         => 'demo',
                ],
            ]);
        }

        $aiResponse = trim($aiResponse);
        // Remove possible markdown code fences
        $aiResponse = preg_replace('/^```json\s*/i', '', $aiResponse);
        $aiResponse = preg_replace('/```$/i', '', $aiResponse);

        $data = json_decode(trim($aiResponse), true);

        if (!$data || !isset($data['stem'])) {
            return response()->json(['error' => true, 'message' => 'AI yanıtı işlenemedi'], 500);
        }

        $data['subject']    = $request->subject;
        $data['topic']      = $request->topic;
        $data['difficulty'] = $request->difficulty;
        $data['source']     = 'ai';

        return response()->json(['success' => true, 'question' => $data]);
    }

    // POST /api/ai/summarize
    public function summarize(Request $request): JsonResponse
    {
        $request->validate([
            'content' => 'required|string|max:5000',
            'subject' => 'nullable|string|max:100',
            'topic'   => 'nullable|string|max:200',
        ]);

        $prompt = "Aşağıdaki eğitim içeriğini Türk öğrenciler için özetle:\n\n"
            . ($request->subject ? "Ders: {$request->subject}\n" : "")
            . ($request->topic ? "Konu: {$request->topic}\n\n" : "")
            . $request->content
            . "\n\nLütfen şu formatta yanıt ver:\n"
            . "ÖZET: (2-3 cümlelik özet)\n\n"
            . "ANAHTAR NOKTALAR:\n• Nokta 1\n• Nokta 2\n• Nokta 3 (en fazla 5 nokta)";

        $aiResponse = $this->openAiRequest([
            ['role' => 'system', 'content' => 'Sen Türk öğrenciler için eğitim içeriği özetleyen bir asistansın.'],
            ['role' => 'user', 'content' => $prompt],
        ], 500);

        if (!$aiResponse) {
            $lines = array_filter(array_map('trim', explode("\n", $request->content)));
            $summary = implode(' ', array_slice($lines, 0, 3));
            return response()->json([
                'success' => true,
                'summary' => substr($summary, 0, 300) . '...',
                'key_points' => ['İçerik özetlendi', 'Konunun temel kavramları önemlidir', 'Tekrar edilmesi önerilir'],
                'source' => 'demo',
            ]);
        }

        $parts = explode('ANAHTAR NOKTALAR:', $aiResponse, 2);
        $summaryText = trim(str_replace('ÖZET:', '', $parts[0] ?? ''));
        $keyPointsRaw = $parts[1] ?? '';
        $keyPoints = array_values(array_filter(
            array_map(fn($l) => ltrim(trim($l), '•- '), explode("\n", $keyPointsRaw)),
            fn($l) => strlen($l) > 3
        ));

        return response()->json([
            'success'    => true,
            'summary'    => $summaryText,
            'key_points' => array_slice($keyPoints, 0, 5),
            'source'     => 'ai',
        ]);
    }

    // POST /api/ai/personal-test
    public function personalTest(Request $request): JsonResponse
    {
        $request->validate([
            'subject'   => 'nullable|string|max:100',
            'count'     => 'nullable|integer|min:1|max:20',
            'difficulty'=> 'nullable|in:easy,medium,hard,mixed',
        ]);

        $user       = Auth::user();
        $subject    = $request->subject;
        $count      = $request->count ?? 10;
        $difficulty = $request->difficulty ?? 'mixed';

        // Get weak achievement codes from this user's wrong answers
        $weakKazanimIds = QuestionAnswer::where('user_id', $user->id)
            ->where('is_correct', false)
            ->select('question_id', DB::raw('COUNT(*) as wrong_count'))
            ->groupBy('question_id')
            ->orderByDesc('wrong_count')
            ->limit(50)
            ->pluck('question_id');

        $q = Question::where('is_active', true);

        if ($subject) {
            $q->where('subject', $subject);
        }
        if ($difficulty !== 'mixed') {
            $q->where('difficulty', $difficulty);
        }

        // Prioritize questions from weak areas
        if ($weakKazanimIds->isNotEmpty()) {
            $weakQ = (clone $q)->whereIn('id', $weakKazanimIds)->limit($count)->get();
            if ($weakQ->count() < $count) {
                $remaining = $count - $weakQ->count();
                $otherQ = (clone $q)->whereNotIn('id', $weakKazanimIds)->inRandomOrder()->limit($remaining)->get();
                $questions = $weakQ->concat($otherQ);
            } else {
                $questions = $weakQ;
            }
        } else {
            $questions = $q->inRandomOrder()->limit($count)->get();
        }

        $data = $questions->map(fn($q) => [
            'id'             => $q->id,
            'stem'           => $q->stem,
            'options'        => $q->options,
            'subject'        => $q->subject,
            'topic'          => $q->topic,
            'difficulty'     => $q->difficulty,
            'kazanim_kodu'   => $q->kazanim_kodu,
        ])->values();

        return response()->json(['success' => true, 'data' => $data, 'total' => $data->count()]);
    }

    // GET /api/ai/hard-achievements
    public function hardAchievements(): JsonResponse
    {
        $results = QuestionAnswer::where('is_correct', false)
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->whereNotNull('questions.kazanim_kodu')
            ->select(
                'questions.kazanim_kodu',
                'questions.subject',
                DB::raw('COUNT(*) as wrong_count'),
                DB::raw('COUNT(DISTINCT question_answers.question_id) as question_count'),
                DB::raw('COUNT(DISTINCT question_answers.user_id) as user_count')
            )
            ->groupBy('questions.kazanim_kodu', 'questions.subject')
            ->orderByDesc('wrong_count')
            ->limit(20)
            ->get();

        $totalAnswers = QuestionAnswer::count();

        $data = $results->map(function ($r) use ($totalAnswers) {
            $totalForKazanim = QuestionAnswer::whereHas('question', function ($q) use ($r) {
                $q->where('kazanim_kodu', $r->kazanim_kodu);
            })->count();

            $errorRate = $totalForKazanim > 0
                ? round(($r->wrong_count / $totalForKazanim) * 100, 1)
                : 0;

            return [
                'kazanim_kodu'   => $r->kazanim_kodu,
                'subject'        => $r->subject,
                'wrong_count'    => $r->wrong_count,
                'total_attempts' => $totalForKazanim,
                'error_rate'     => $errorRate,
                'affected_users' => $r->user_count,
            ];
        })->sortByDesc('error_rate')->values();

        return response()->json(['success' => true, 'data' => $data]);
    }

    // POST /api/ai/ask-coach
    public function askCoach(Request $request): JsonResponse
    {
        $request->validate([
            'message'     => 'required|string|max:2000',
            'session_id'  => 'nullable|string|max:100',
        ]);

        $user    = Auth::user();
        $message = $request->message;

        // Load recent chat history for context
        $history = DB::table('ai_coach_messages')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->reverse()
            ->values();

        $messages = [
            [
                'role'    => 'system',
                'content' => "Sen Terence Eğitim Platformu'nun dijital koç asistanısın. Türkçe konuşan öğrencilere yardım ediyorsun. "
                    . "Öğrencinin adı: " . ($user->name ?? 'Öğrenci') . ". "
                    . "Sınav hedefi: " . ($user->exam_goal ?? 'TYT/AYT') . ". "
                    . "Abonelik planı: " . ($user->subscription_plan ?? 'free') . ". "
                    . "Samimi, motive edici ve eğitici bir ton kullan. Kısa ve net yanıtlar ver.",
            ],
        ];

        foreach ($history as $h) {
            $messages[] = ['role' => $h->role, 'content' => $h->content];
        }
        $messages[] = ['role' => 'user', 'content' => $message];

        $aiResponse = $this->openAiRequest($messages, 600);

        if (!$aiResponse) {
            $aiResponse = $this->getFallbackCoachResponse($message);
        }

        // Save to history
        DB::table('ai_coach_messages')->insert([
            ['user_id' => $user->id, 'role' => 'user',      'content' => $message,    'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $user->id, 'role' => 'assistant', 'content' => $aiResponse, 'created_at' => now(), 'updated_at' => now()],
        ]);

        return response()->json([
            'success'  => true,
            'response' => $aiResponse,
            'message'  => $aiResponse,
        ]);
    }

    // GET /api/ai/coach/history
    public function coachHistory(Request $request): JsonResponse
    {
        $user  = Auth::user();
        $limit = (int) $request->query('limit', 50);

        $rows = DB::table('ai_coach_messages')
            ->where('user_id', $user->id)
            ->orderBy('created_at')
            ->limit($limit)
            ->get(['id', 'role', 'content', 'created_at']);

        return response()->json(['success' => true, 'data' => $rows]);
    }

    // DELETE /api/ai/coach/history
    public function clearCoachHistory(): JsonResponse
    {
        $user = Auth::user();
        DB::table('ai_coach_messages')->where('user_id', $user->id)->delete();
        return response()->json(['success' => true, 'message' => 'Sohbet geçmişi temizlendi']);
    }

    private function getFallbackCoachResponse(string $message): string
    {
        $lower = mb_strtolower($message);

        if (str_contains($lower, 'motivasyon') || str_contains($lower, 'morale') || str_contains($lower, 'pes')) {
            return "Motivasyonunu yeniden kazanmak için küçük adımlarla başla! Bugün sadece 25 dakika çalış, sonra kendinle gurur duy. Her büyük başarı küçük adımlardan oluşur. Sen yapabilirsin! 💪";
        }
        if (str_contains($lower, 'plan') || str_contains($lower, 'program')) {
            return "Günlük çalışma planı için şunu öneririm: Sabah matematik/fen (2 saat), öğleden sonra sosyal/dil (1.5 saat), akşam tekrar ve soru çözümü (1 saat). 'Günlük Plan' bölümünden kişisel planını oluşturabilirsin!";
        }
        if (str_contains($lower, 'matematik') || str_contains($lower, 'fizik') || str_contains($lower, 'kimya')) {
            return "Bu konuda düzenli soru çözümü çok önemli! Önce temel kavramları pekiştir, sonra soru bankasından pratik yap. Zayıf kazanımlarını 'Zayıf Kazanım' bölümünden takip edebilirsin.";
        }
        if (str_contains($lower, 'sınav') || str_contains($lower, 'tyt') || str_contains($lower, 'ayt')) {
            return "Sınav sürecinde en önemli şey düzenli çalışma ve stratejik tekrar! Her gün en az 1 saat çalış, deneme sınavlarını düzenli çöz ve sonuçlarını analiz et. Başarılar! 🎯";
        }

        return "Sana yardımcı olmaktan mutluluk duyuyorum! Daha iyi destek verebilmem için sorunuzu biraz daha detaylandırabilir misin? Ders konuları, çalışma planı veya motivasyon hakkında her konuda yardımcı olabilirim. 😊";
    }
}
