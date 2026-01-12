const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

/**
 * Cloud Function to proxy requests to Groq API securely.
 * Uses API key from environment config.
 */
exports.callGroq = functions.region("asia-northeast3").runWith({
    timeoutSeconds: 60,
    memory: '256MB'
}).https.onCall(async (data, context) => {
    console.log('🔵 callGroq called');

    const { message, context: tripContext } = data;

    if (!message) {
        throw new functions.https.HttpsError('invalid-argument', 'Message is required');
    }

    const GROQ_API_KEY = functions.config().groq?.key;
    if (!GROQ_API_KEY) {
        console.error('❌ Groq API Key is not configured in Firebase Functions');
        throw new functions.https.HttpsError('failed-precondition', 'Server is not configured with Groq API Key');
    }

    const systemPrompt = `당신은 여행 일정을 완벽하게 숙지하고 있는 친절한 '여행 비서'입니다. 
반드시 제공된 [현재 여행 정보]만을 바탕으로 답변해야 하며, 정보에 없는 내용을 추측하거나 지어내지 마세요.
모든 답변은 반드시 질문한 언어로만 답변해주세요. 다른언어는 사용하지 마세요.
사용자가 모든 숙소 정보를 요청하면 '배정날짜' 항목이 입력 되어있는 숙소 정보만 출력해주세요. 특정 날짜의 숙소 정보를 요청하면 해당 날짜의 숙소 정보만 출력해주세요. 배정날짜가 등록되지 않은 숙소도 물어보면 그때 대답해주세요.
만약 질문에 대한 정보가 [현재 여행 정보]에 없다면, "해당 정보는 여행 계획에 포함되어 있지 않습니다" 또는 "내용을 확인할 수 없어 답변해 드리기 어렵습니다"와 같이 정보가 없음을 명확하고 정중하게 한국어로 대답해주세요.

[현재 여행 정보]
${tripContext}
`;

    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('✅ Groq response received');
        return {
            reply: response.data.choices[0].message.content
        };

    } catch (error) {
        console.error("❌ Groq API Error:", error.message);
        if (error.response) {
            console.error("HTTP Status:", error.response.status);
            console.error("Response Data:", JSON.stringify(error.response.data));
            throw new functions.https.HttpsError('internal', `Groq API Error: ${error.response.data.error?.message || error.message}`);
        }
        throw new functions.https.HttpsError('internal', `Call Failed: ${error.message}`);
    }
});
