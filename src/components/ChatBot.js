/**
 * ChatBot Component
 * Integrated with Groq Gemma Model
 */

export function showChatBot(schedule) {
    const existing = document.querySelector('.chatbot-modal-overlay');
    if (existing) return;

    const overlay = document.createElement('div');
    overlay.className = 'chatbot-modal-overlay';

    // Calculate Total Expenses
    let totalTripExpense = 0;
    const accommodationExpenses = (schedule.accommodations || []).reduce((sum, acc) => {
        const price = parseInt((acc.price || '0').replace(/[^0-9]/g, ''), 10);
        return sum + (isNaN(price) ? 0 : price);
    }, 0);
    totalTripExpense += accommodationExpenses;

    (schedule.days || []).forEach(day => {
        (day.events || []).forEach(event => {
            if (event.expenses) {
                event.expenses.forEach(exp => {
                    // Assuming exp.amount is number or string number
                    const amount = typeof exp.amount === 'string' ? parseInt(exp.amount, 10) : exp.amount;
                    if (!isNaN(amount)) totalTripExpense += amount;
                });
            }
        });
    });

    // Construct trip context for AI
    const tripContext = {
        title: schedule.title,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        tripType: schedule.tripType === 'domestic' ? '국내' : '해외',
        countries: schedule.countries ? schedule.countries.join(', ') : '',
        members: `성인 ${schedule.members?.adults || 0}명, 아동 ${schedule.members?.children || 0}명`,
        memberNames: {
            adults: schedule.members?.adultList?.join(', ') || '없음',
            children: schedule.members?.childList?.join(', ') || '없음'
        },
        totalExpense: totalTripExpense.toLocaleString() + '원',
        itinerary: (schedule.days || []).map(day =>
            `Day ${day.day} (${day.date}):\n` +
            day.events.map(e => {
                let details = `  - [${e.startTime || '시간미정'}~${e.endTime || ''}] ${e.place || e.description || '장소명 없음'}`;
                if (e.location) details += ` (위치: ${e.location})`;

                // Expenses
                if (e.expenses && e.expenses.length > 0) {
                    const expDetails = e.expenses.map(ex => `${parseInt(ex.amount).toLocaleString()}원(결제:${ex.payer}, 방법:${ex.splitMethod})`).join(', ');
                    details += `\n    └ 비용: ${expDetails}`;
                }
                // Memos
                if (e.memo) {
                    details += `\n    └ 메모: ${e.memo}`;
                }
                return details;
            }).join('\n')
        ).join('\n\n'),
        accommodations: (schedule.accommodations || []).map(acc =>
            `- 숙소명: ${acc.name}\n  유형: ${acc.type || '미지정'}\n  위치: ${acc.location || '정보 없음'}\n  연락처: ${acc.contact || '정보 없음'}\n  가격: ${acc.price || '0'}원\n  URL: ${acc.url || '정보 없음'}\n  체크인: ${acc.checkIn || '미지정'}\n  체크아웃: ${acc.checkOut || '미지정'}\n  메모: ${acc.notes || '없음'}\n  배정날짜: ${acc.assignedDates?.join(', ') || '미배정'}`
        ).join('\n\n'),
        checklist: (schedule.checklists || []).map(cl =>
            `${cl.name} (${cl.type === 'todo' ? '할 일' : '준비물'}): ` +
            cl.items.map(i => `${i.text} [${i.checked ? '완료' : '미완료'}/우선순위:${i.priority}]`).join(', ')
        ).join('\n'),
        tips: (schedule.tips || []).map(tip => `[${tip.title}] ${tip.content}`).join('\n')
    };

    const contextString = `
[여행 제목] ${tripContext.title}
[날짜] ${tripContext.startDate} ~ ${tripContext.endDate}
[인원 구성] ${tripContext.members}
[성인 명단] ${tripContext.memberNames.adults}
[아동 명단] ${tripContext.memberNames.children}
[방문국가/도시] ${tripContext.countries}
[총 예상 지출] ${tripContext.totalExpense} (숙소 포함, 미입력 비용 제외)

[상세 일정 및 지출]
${tripContext.itinerary || "일정 정보가 없습니다."}

[숙소 및 캠핑장 상세 정보]
${tripContext.accommodations || "숙소 정보가 없습니다."}

[체크리스트 상태]
${tripContext.checklist || "체크리스트 정보가 없습니다."}

[여행 꿀팁]
${tripContext.tips || "팁 정보가 없습니다."}
    `.trim();

    // For Debugging
    console.log("Generatd Chatbot Context:", contextString);

    overlay.innerHTML = `
        <div class="chatbot-container">
            <div class="chatbot-header">
                <h3 class="chat-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                        <circle cx="12" cy="5" r="2"></circle>
                        <path d="M12 7v4"></path>
                        <line x1="8" y1="16" x2="8" y2="16"></line>
                        <line x1="16" y1="16" x2="16" y2="16"></line>
                    </svg>
                    AI 여행 비서
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
        overlay.classList.add('closing');
        // Wait for animation to finish (300ms)
        setTimeout(() => {
            overlay.remove();
        }, 300);
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
        throw new Error("VITE_GROQ_API_KEY가 설정되지 않았습니다. .env 파일을 확인해 주세요.");
    }

    const systemPrompt = `당신은 여행 일정을 완벽하게 숙지하고 있는 친절한 '여행 비서'입니다. 
반드시 제공된 [현재 여행 정보]만을 바탕으로 답변해야 하며, 정보에 없는 내용을 추측하거나 지어내지 마세요.
모든 답변은 반드시 질문한 언어로만 답변해주세요. 다른언어는 사용하지 마세요.
사용자가 모든 숙소 정보를 요청하면 '배정날짜' 항목이 입력 되어있는 숙소 정보만 출력해주세요. 특정 날짜의 숙소 정보를 요청하면 해당 날짜의 숙소 정보만 출력해주세요. 배정날짜가 등록되지 않은 숙소도 물어보면 그때 대답해주세요.
만약 질문에 대한 정보가 [현재 여행 정보]에 없다면, "해당 정보는 여행 계획에 포함되어 있지 않습니다" 또는 "내용을 확인할 수 없어 답변해 드리기 어렵습니다"와 같이 정보가 없음을 명확하고 정중하게 한국어로 대답해주세요.

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
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            temperature: 0.7
        })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        console.error("Groq API Error Detail:", data);
        const errorMsg = data.error?.message || response.statusText || "Unknown Error";
        throw new Error(`API 호출 실패: ${errorMsg} (${response.status})`);
    }

    return data.choices[0].message.content;
}
