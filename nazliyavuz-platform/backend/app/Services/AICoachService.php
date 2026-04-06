<?php

namespace App\Services;

use App\Models\User;
use App\Models\Question;
use App\Models\QuestionAnswer;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class AICoachService
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key');
        $this->model = config('services.openai.model', 'gpt-4-turbo-preview');
        $this->baseUrl = 'https://api.openai.com/v1';
    }

    /**
     * Get personalized study recommendations
     */
    public function getStudyRecommendations(User $user): array
    {
        $userPerformance = $this->analyzeUserPerformance($user);
        
        $prompt = $this->buildRecommendationPrompt($user, $userPerformance);
        
        $response = $this->callGPT($prompt, [
            'temperature' => 0.7,
            'max_tokens' => 1000,
        ]);

        if (!$response['success']) {
            return [
                'success' => false,
                'error' => $response['error'],
            ];
        }

        return [
            'success' => true,
            'recommendations' => $this->parseRecommendations($response['content']),
            'performance_analysis' => $userPerformance,
        ];
    }

    /**
     * Explain a question's solution
     */
    public function explainSolution(int $questionId, ?string $userAnswer = null): array
    {
        $question = Question::with('options')->find($questionId);
        
        if (!$question) {
            return ['success' => false, 'error' => 'Soru bulunamadı'];
        }

        $prompt = $this->buildExplanationPrompt($question, $userAnswer);
        
        $response = $this->callGPT($prompt, [
            'temperature' => 0.5,
            'max_tokens' => 800,
        ]);

        if (!$response['success']) {
            return [
                'success' => false,
                'error' => $response['error'],
            ];
        }

        Log::channel('ai')->info('Solution explained', [
            'question_id' => $questionId,
            'tokens_used' => $response['usage']['total_tokens'] ?? 0,
        ]);

        return [
            'success' => true,
            'explanation' => $response['content'],
            'question' => $question,
        ];
    }

    /**
     * Chat with AI coach
     */
    public function chat(User $user, string $message, array $conversationHistory = []): array
    {
        // Rate limiting check
        $rateLimitKey = "ai_chat_limit:user:{$user->id}";
        $requestCount = Cache::get($rateLimitKey, 0);
        
        $limit = $this->getUserChatLimit($user);
        
        if ($requestCount >= $limit) {
            return [
                'success' => false,
                'error' => 'Saatlik AI koç limit

iniz doldu. Lütfen daha sonra tekrar deneyin.',
                'limit' => $limit,
            ];
        }

        $systemPrompt = $this->buildCoachSystemPrompt($user);
        $messages = $this->prepareMessages($systemPrompt, $conversationHistory, $message);

        $response = $this->callGPTChat($messages, [
            'temperature' => 0.8,
            'max_tokens' => 500,
        ]);

        if (!$response['success']) {
            return [
                'success' => false,
                'error' => $response['error'],
            ];
        }

        // Increment rate limit counter
        Cache::put($rateLimitKey, $requestCount + 1, 3600); // 1 hour

        // Save conversation
        $this->saveConversation($user->id, $message, $response['content']);

        Log::channel('ai')->info('AI Coach chat', [
            'user_id' => $user->id,
            'tokens_used' => $response['usage']['total_tokens'] ?? 0,
        ]);

        return [
            'success' => true,
            'message' => $response['content'],
            'remaining_requests' => max(0, $limit - $requestCount - 1),
        ];
    }

    /**
     * Generate practice questions based on weak areas
     */
    public function generatePracticeQuestions(User $user, int $count = 5): array
    {
        $weakAreas = $this->identifyWeakAreas($user);
        
        if (empty($weakAreas)) {
            return [
                'success' => true,
                'message' => 'Zayıf alan bulunamadı, genel sorular önerilecek',
                'questions' => [],
            ];
        }

        // Get questions from weak topics
        $questions = Question::whereIn('topic_id', $weakAreas['topics'])
            ->whereNotIn('id', function ($query) use ($user) {
                $query->select('question_id')
                    ->from('question_answers')
                    ->where('user_id', $user->id)
                    ->where('is_correct', true);
            })
            ->inRandomOrder()
            ->limit($count)
            ->get();

        return [
            'success' => true,
            'questions' => $questions,
            'weak_areas' => $weakAreas,
        ];
    }

    /**
     * Analyze user performance
     */
    private function analyzeUserPerformance(User $user): array
    {
        $last30Days = now()->subDays(30);

        $totalAnswers = QuestionAnswer::where('user_id', $user->id)
            ->where('created_at', '>=', $last30Days)
            ->count();

        $correctAnswers = QuestionAnswer::where('user_id', $user->id)
            ->where('created_at', '>=', $last30Days)
            ->where('is_correct', true)
            ->count();

        $accuracyRate = $totalAnswers > 0 ? ($correctAnswers / $totalAnswers) * 100 : 0;

        // Performance by subject
        $subjectPerformance = QuestionAnswer::where('user_id', $user->id)
            ->where('created_at', '>=', $last30Days)
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->selectRaw('questions.subject, COUNT(*) as total, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct')
            ->groupBy('questions.subject')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->subject => [
                    'total' => $item->total,
                    'correct' => $item->correct,
                    'accuracy' => $item->total > 0 ? ($item->correct / $item->total) * 100 : 0,
                ]];
            });

        // Study streak
        $studyStreak = \DB::table('streaks')
            ->where('user_id', $user->id)
            ->where('type', 'daily_login')
            ->value('current_count') ?? 0;

        return [
            'total_answers' => $totalAnswers,
            'accuracy_rate' => round($accuracyRate, 2),
            'study_streak' => $studyStreak,
            'subject_performance' => $subjectPerformance,
            'level' => $user->level,
            'xp' => $user->xp,
        ];
    }

    /**
     * Identify weak areas
     */
    private function identifyWeakAreas(User $user): array
    {
        $last30Days = now()->subDays(30);

        $topicPerformance = QuestionAnswer::where('user_id', $user->id)
            ->where('created_at', '>=', $last30Days)
            ->join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->selectRaw('questions.topic_id, COUNT(*) as total, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct')
            ->groupBy('questions.topic_id')
            ->havingRaw('COUNT(*) >= 5') // At least 5 attempts
            ->get();

        $weakTopics = $topicPerformance
            ->filter(function ($item) {
                $accuracy = ($item->correct / $item->total) * 100;
                return $accuracy < 60; // Less than 60% accuracy
            })
            ->pluck('topic_id')
            ->toArray();

        return [
            'topics' => $weakTopics,
            'count' => count($weakTopics),
        ];
    }

    /**
     * Build recommendation prompt
     */
    private function buildRecommendationPrompt(User $user, array $performance): string
    {
        $subjectPerf = json_encode($performance['subject_performance']);

        return <<<PROMPT
Sen bir eğitim koçusun. Öğrencinin performansını analiz et ve kişiselleştirilmiş öneriler sun.

Öğrenci Bilgileri:
- Ad: {$user->name}
- Seviye: {$performance['level']}
- Toplam Soru: {$performance['total_answers']}
- Doğruluk Oranı: {$performance['accuracy_rate']}%
- Çalışma Serisi: {$performance['study_streak']} gün

Ders Başarı Oranları:
{$subjectPerf}

Lütfen:
1. Güçlü yönleri övgüyle belirt
2. Geliştirilmesi gereken 2-3 alan öner
3. Spesifik çalışma stratejileri ver
4. Motivasyonu artıracak pozitif mesajlar ekle

Türkçe, samimi ve motive edici bir dille yaz.
PROMPT;
    }

    /**
     * Build explanation prompt
     */
    private function buildExplanationPrompt(Question $question, ?string $userAnswer): string
    {
        $optionsText = $question->options->map(function ($opt) {
            return "{$opt->option_text}";
        })->join("\n");

        $userPart = $userAnswer ? "\n\nÖğrencinin Cevabı: {$userAnswer}" : '';

        return <<<PROMPT
Bir matematik/fen sorusunu lise öğrencisine açıkla.

Soru: {$question->question_text}

Seçenekler:
{$optionsText}

Doğru Cevap: [Sistem tarafından sağlanacak]{$userPart}

Lütfen:
1. Soruyu adım adım çöz
2. Kullanılan formülleri açıkla
3. Yaygın hataları belirt
4. İpuçları ver

Türkçe, anlaşılır ve net bir dille yaz.
PROMPT;
    }

    /**
     * Build coach system prompt
     */
    private function buildCoachSystemPrompt(User $user): string
    {
        return <<<PROMPT
Sen Terence AI Koç'sun. Türk öğrencilere üniversite sınavlarına (YKS, TYT, AYT, LGS) hazırlanmalarında yardımcı oluyorsun.

Özelliklerin:
- Samimi, destekleyici ve motive edici
- Türkçe konuşuyorsun
- Kısa ve öz cevaplar veriyorsun
- Matematik, fizik, kimya, biyoloji ve Türkçe konularında uzman
- Çalışma teknikleri ve zaman yönetimi konusunda tavsiyelerin var

Öğrenci: {$user->name} (Seviye: {$user->level})

Kurallar:
- Her zaman pozitif ve yapıcı ol
- Ödev yapma, sadece rehberlik et
- Kısa cevaplar (maksimum 3-4 cümle)
- Emoji kullanabilirsin 😊
PROMPT;
    }

    /**
     * Prepare messages for chat
     */
    private function prepareMessages(string $systemPrompt, array $history, string $newMessage): array
    {
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        foreach ($history as $msg) {
            $messages[] = [
                'role' => $msg['role'],
                'content' => $msg['content'],
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => $newMessage,
        ];

        return $messages;
    }

    /**
     * Call GPT API (completion)
     */
    private function callGPT(string $prompt, array $options = []): array
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->baseUrl}/chat/completions", [
                    'model' => $this->model,
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => $options['temperature'] ?? 0.7,
                    'max_tokens' => $options['max_tokens'] ?? 500,
                ]);

            if (!$response->successful()) {
                Log::channel('ai')->error('GPT API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'error' => 'AI servisi yanıt vermiyor',
                ];
            }

            $data = $response->json();

            return [
                'success' => true,
                'content' => $data['choices'][0]['message']['content'] ?? '',
                'usage' => $data['usage'] ?? [],
            ];
        } catch (\Exception $e) {
            Log::channel('ai')->error('GPT API exception', [
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'AI servisi ile bağlantı kurulamadı',
            ];
        }
    }

    /**
     * Call GPT API (chat)
     */
    private function callGPTChat(array $messages, array $options = []): array
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->baseUrl}/chat/completions", [
                    'model' => $this->model,
                    'messages' => $messages,
                    'temperature' => $options['temperature'] ?? 0.7,
                    'max_tokens' => $options['max_tokens'] ?? 500,
                ]);

            if (!$response->successful()) {
                Log::channel('ai')->error('GPT Chat API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'error' => 'AI servisi yanıt vermiyor',
                ];
            }

            $data = $response->json();

            return [
                'success' => true,
                'content' => $data['choices'][0]['message']['content'] ?? '',
                'usage' => $data['usage'] ?? [],
            ];
        } catch (\Exception $e) {
            Log::channel('ai')->error('GPT Chat API exception', [
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'AI servisi ile bağlantı kurulamadı',
            ];
        }
    }

    /**
     * Parse recommendations from GPT response
     */
    private function parseRecommendations(string $content): array
    {
        // Simple parsing - can be enhanced
        return [
            'full_text' => $content,
            'summary' => substr($content, 0, 200) . '...',
        ];
    }

    /**
     * Get user's chat limit based on subscription
     */
    private function getUserChatLimit(User $user): int
    {
        return match($user->subscription_plan ?? 'free') {
            'pro' => 100,
            'plus' => 50,
            'bronze' => 20,
            default => 10,
        };
    }

    /**
     * Save conversation to database
     */
    private function saveConversation(int $userId, string $userMessage, string $aiResponse): void
    {
        \DB::table('ai_coach_conversations')->insert([
            'user_id' => $userId,
            'user_message' => $userMessage,
            'ai_response' => $aiResponse,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
