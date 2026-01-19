// Vercel Serverless Function - 탄원서 생성 API
// 환경변수: OPENAI_API_KEY

// 간단한 메모리 기반 rate limiting (서버 재시작 시 초기화됨)
// 프로덕션에서는 Upstash Redis 사용 권장
const rateLimitMap = new Map();

const DAILY_LIMIT = 3;

function getRateLimitKey(ip) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${ip}_${today}`;
}

function checkRateLimit(ip) {
  const key = getRateLimitKey(ip);
  const current = rateLimitMap.get(key) || 0;
  
  // 오래된 키 정리 (메모리 관리)
  const today = new Date().toISOString().split('T')[0];
  for (const [k] of rateLimitMap) {
    if (!k.includes(today)) {
      rateLimitMap.delete(k);
    }
  }
  
  return {
    allowed: current < DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - current),
    used: current
  };
}

function incrementRateLimit(ip) {
  const key = getRateLimitKey(ip);
  const current = rateLimitMap.get(key) || 0;
  rateLimitMap.set(key, current + 1);
}

export default async function handler(req, res) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // IP 추출
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             'unknown';

  // Rate limit 체크
  const rateLimit = checkRateLimit(ip);
  
  if (!rateLimit.allowed) {
    return res.status(429).json({ 
      error: 'RATE_LIMIT_EXCEEDED',
      message: '오늘 무료 사용 횟수를 모두 사용하셨습니다.',
      used: rateLimit.used,
      limit: DAILY_LIMIT,
      remaining: 0
    });
  }

  // API 키 확인
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { caseNumber, defendant, relationship, damages, attitudes, message, isVictim } = req.body;

    // 입력 검증
    if (!caseNumber || !defendant || !relationship) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
    }

    const systemPrompt = `당신은 10년 경력의 형사 전문 법률가입니다. 피해자측이 법원에 제출할 '엄벌 탄원서'를 작성합니다.

[필수] 반드시 한국어로만 작성하세요.

작성 원칙:
1. 판사의 마음을 움직이되, 과장 없이 사실에 기반
2. 피해자의 고통을 구체적이고 절제된 언어로 전달
3. 가해자의 반성 없는 태도가 양형에 미치는 영향 논리적 서술
4. 법적 용어를 적절히 사용하되 진정성 있는 호소
5. 심리적 항거불능, 학습된 무기력 등 피해자 심리 반영
6. 재범 방지와 사회적 경각심 차원의 엄벌 필요성

형식:
- 제목: 탄원서
- 사건번호, 피고인 정보
- 본문: 피해 경위 → 피해 증상 → 가해자 태도 → 엄벌 호소
- 결론 및 서명란 (날짜, 탄원인)`;

    const userPrompt = `[사건 정보]
사건번호: ${caseNumber}
피고인: ${defendant}
관계: ${relationship}
작성자: ${isVictim ? '피해자 본인' : '피해자 지인'}

[피해 증상]
${damages && damages.length > 0 ? damages.join(', ') : '명시되지 않음'}

[가해자 태도]
${attitudes && attitudes.length > 0 ? attitudes.join(', ') : '명시되지 않음'}

[전하고 싶은 말]
${message || '없음'}

위 정보로 엄벌 탄원서를 작성해주세요.`;

    // OpenAI API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI API 오류');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // 성공 시 rate limit 증가
    incrementRateLimit(ip);
    const updatedLimit = checkRateLimit(ip);

    return res.status(200).json({ 
      success: true,
      content,
      usage: {
        used: updatedLimit.used,
        remaining: updatedLimit.remaining,
        limit: DAILY_LIMIT
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error.message || '탄원서 생성 중 오류가 발생했습니다.' 
    });
  }
}
