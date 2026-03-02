// api/verify.js
export default async function handler(req, res) {
  // CORS 설정 (필요시)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // 프론트엔드에서 넘겨받은 결제번호와 예상 금액
  const { paymentId, expectedAmount } = req.body;

  if (!paymentId) {
    return res.status(400).json({ success: false, message: '결제 번호가 누락되었습니다.' });
  }

  try {
    // ⭐️ 1. 포트원 V2 본사 서버로 결제 내역 단건 조회
    const portoneResponse = await fetch(`https://api.portone.io/payments/${paymentId}`, {
      headers: {
        // Vercel에 등록해둔 포트원 비밀키 사용
        "Authorization": `PortOne ${process.env.PORTONE_API_SECRET}`,
        "Content-Type": "application/json"
      }
    });

    if (!portoneResponse.ok) {
      throw new Error('포트원 결제 조회에 실패했습니다.');
    }

    const payment = await portoneResponse.json();

    // ⭐️ 2. 팩트 체크: 결제가 진짜로 완료(PAID)되었는지, 금액이 일치하는지 확인
    if (payment.status !== "PAID") {
      return res.status(400).json({ success: false, message: "결제가 완료되지 않은 건입니다." });
    }

    if (payment.amount.total !== expectedAmount) {
      return res.status(400).json({ success: false, message: "위조된 결제 금액입니다." });
    }

    // ⭐️ 3. 검증 통과 완료! 
    // (여기서 DB에 결제 완료 상태를 저장하거나, 결제 완료 문자를 보내는 로직을 추가할 수 있습니다.)
    
    return res.status(200).json({ 
      success: true, 
      message: "결제 검증 및 승인 완료",
      data: payment 
    });

  } catch (error) {
    console.error("백엔드 검증 에러:", error);
    return res.status(500).json({ success: false, message: "서버 결제 검증 중 오류가 발생했습니다." });
  }
}
