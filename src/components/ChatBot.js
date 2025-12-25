/**
 * ChatBot Component
 * Integrated with Groq Gemma Model
 */

export function showChatBot(schedule) {
    const existing = document.querySelector('.chatbot-modal-overlay');
    if (existing) return;

    const overlay = document.createElement('div');
    overlay.className = 'chatbot-modal-overlay';

    // Construct trip context for AI
    const tripContext = {
        title: schedule.title,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        tripType: schedule.tripType === 'domestic' ? '국내' : '해외',
        countries: schedule.countries ? schedule.countries.join(', ') : '',
        members: `성인 ${schedule.members?.adults || 0}명, 아동 ${schedule.members?.children || 0}명`,
        itinerary: (schedule.days || []).map(day => `Day ${day.day}: ${day.events.map(e => `[${e.startTime || e.time || ''}] ${e.place || ''} (${e.description || ''})`).join(', ')}`).join('\n'),
        accommodations: (schedule.accommodations || []).map(acc => `${acc.name} (${acc.location || ''}, 체크인: ${acc.checkIn || ''})`).join('\n'),
        checklist: (schedule.checklists || []).map(cl => `${cl.name}: ${cl.items.map(i => i.text).join(', ')}`).join('\n'),
        tips: (schedule.tips || []).map(tip => `[${tip.title}] ${tip.content}`).join('\n')
    };

    const contextString = `
[여행 제목] ${tripContext.title}
[날짜] ${tripContext.startDate} ~ ${tripContext.endDate}
[인원] ${tripContext.members}
[방문국가/도시] ${tripContext.countries}
[일정]
${tripContext.itinerary || "일정 정보가 없습니다."}
[숙소]
${tripContext.accommodations || "숙소 정보가 없습니다."}
[체크리스트]
${tripContext.checklist || "체크리스트 정보가 없습니다."}
[꿀팁]
${tripContext.tips || "팁 정보가 없습니다."}
    `.trim();

    overlay.innerHTML = `
        <div class="chatbot-container">
            <div class="chatbot-header">
                <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                        <circle cx="12" cy="5" r="2"></circle>
                        <path d="M12 7v4"></path>
                    </svg>
                    여행 비서 (Gemma AI)
                </h3>
                <button class="btn-close-chat">&times;</button>
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="message ai">안녕하세요! <b>${schedule.title}</b> 여행에 대해 궁금한 점이 있으신가요?</div>
            </div>
            <div class="chat-input-area">
                <input type="text" class="chat-input" id="chatInput" placeholder="질문을 입력하세요..." autoFocus>
                <button class="btn-send-chat" id="btnSendChat">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const chatMessages = overlay.querySelector('#chatMessages');
    const chatInput = overlay.querySelector('#chatInput');
    const btnSendChat = overlay.querySelector('#btnSendChat');
    const btnCloseChat = overlay.querySelector('.btn-close-chat');

    function closeChat() {
        overlay.classList.add('fade-out'); // Optional transition
        setTimeout(() => overlay.remove(), 300);
    }

    btnCloseChat.addEventListener('click', closeChat);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeChat();
    });

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        chatInput.value = '';
        addMessage(text, 'user');

        // Typing indicator
        const indicator = addTypingIndicator();

        try {
            const reply = await callGroqAPI(text, contextString);
            indicator.remove();
            addMessage(reply, 'ai');
        } catch (error) {
            indicator.remove();
            addMessage("죄송합니다. 오류가 발생했습니다: " + error.message, 'ai');
        }
    }

    btnSendChat.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.innerHTML = text.replace(/\n/g, '<br>');
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'message ai typing-indicator-container';
        div.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return div;
    }
}

async function callGroqAPI(message, context) {
    const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
    if (!API_KEY) {
        throw new Error("VITE_GROQ_API_KEY가 설정되지 않았습니다.");
    }

    const systemPrompt = `당신은 여행 일정을 완벽하게 숙지하고 있는 친절한 '여행 비서'입니다. 
사용자의 질문에 대해 제공된 [현재 여행 정보]를 바탕으로 다정하고 명확하게 한국어로 대답해주세요.
직관적이고 유용한 조언을 곁들여주세요.

[현재 여행 정보]
${context}
`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "gemma2-9b-it",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Groq API Error:", errorData);
        throw new Error("API 호출 실패");
    }

    const data = await response.json();
    return data.choices[0].message.content;
}
