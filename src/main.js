// 메인 애플리케이션 로직

import './style.css';
import './styles/tip-form.css';
import './styles/checklist-form.css';
import { getCurrentSchedule, getSchedule, setCurrentSchedule } from './storage.js';
import { loadFromShareUrl, uploadFromJson } from './share.js';
import { renderScheduleList } from './components/ScheduleList.js';
import { renderScheduleEditor } from './components/ScheduleEditor.js';
import { showShareModal, showImportModal } from './components/ShareModal.js';
import { showChatBot } from './components/ChatBot.js';
import './styles/chatbot.css';

// 앱 상태
let currentView = 'list'; // 'list', 'view', 'edit'

// 앱 초기화
function init() {
    // URL 공유 링크 확인
    const sharedSchedule = loadFromShareUrl();
    if (sharedSchedule) {
        alert('✅ 공유받은 일정을 가져왔습니다!');
        setCurrentSchedule(sharedSchedule.id);
        showView('view');
        return;
    }

    // 기본 뷰 표시
    showView('list');

    // 네비게이션 이벤트
    setupNavigation();
}

// 네비게이션 설정
function setupNavigation() {
    // FAB 이벤트 리스너
    document.getElementById('fabAdd')?.addEventListener('click', () => showView('edit'));

    // 로고 클릭 시 목록으로 이동
    document.querySelector('.app-logo')?.addEventListener('click', () => showView('list'));
}

// 뷰 전환
function showView(view, scheduleId = null) {
    currentView = view;
    const appContainer = document.getElementById('app');
    const fabButton = document.getElementById('fabAdd');

    // FAB 표시/숨김 제어: 목록 화면에서만 표시
    if (fabButton) {
        fabButton.style.display = view === 'list' ? 'flex' : 'none';
    }

    // 헤더 제어 (목록 화면에서만 표시)
    const appHeader = document.querySelector('.app-header');
    if (appHeader) {
        appHeader.style.display = view === 'list' ? 'flex' : 'none';
    }

    window.scrollTo(0, 0);
    switch (view) {
        case 'list':
            renderScheduleList(appContainer, (action, id) => {
                if (action === 'new') {
                    showView('edit');
                } else if (action === 'view') {
                    showView('view', id);
                } else if (action === 'edit') {
                    showView('edit', id);
                } else if (action === 'share') {
                    showShareModal(id);
                } else if (action === 'import') {
                    showImportModal((schedule) => {
                        setCurrentSchedule(schedule.id);
                        showView('list'); // Refresh list
                    });
                }
            });
            break;

        case 'view':
            renderScheduleView(appContainer, scheduleId);
            break;

        case 'edit':
            renderScheduleEditor(appContainer, scheduleId,
                (saved) => {
                    setCurrentSchedule(saved.id);
                    showView('view', saved.id);
                },
                () => {
                    // Back logic: If editing an existing schedule, go back to View.
                    // If creating new, go back to List.
                    if (scheduleId) {
                        showView('view', scheduleId);
                    } else {
                        showView('list');
                    }
                }
            );
            break;
    }
}

// 일정 상세 보기
function renderScheduleView(container, scheduleId) {
    const schedule = scheduleId ? getSchedule(scheduleId) : getCurrentSchedule();

    if (!schedule) {
        showView('list');
        return;
    }

    const themeMap = {
        solo: 'theme_single.png',
        friends: 'theme_friendship.png',
        couple: 'theme_couple.png',
        family: 'theme_family.png',
        babymoon: 'theme_prenatal.png'
    };

    const baseUrl = import.meta.env.BASE_URL;
    const themeImage = (schedule.theme && themeMap[schedule.theme])
        ? `${baseUrl}images/theme/${themeMap[schedule.theme]}`
        : `${baseUrl}images/theme/theme_basic.png`;

    container.innerHTML = `
        <div class="view-container page-transition">
            <header class="header" style="${themeImage ? `background-image: url('${themeImage}'); background-size: cover; background-position: center;` : ''}">
                <div class="header-actions-group">
                    <button class="btn-icon" id="btnEdit" aria-label="수정">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon" id="btnShare" aria-label="공유">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                    </button>
                    <button class="btn-icon" id="btnChatBot" aria-label="챗봇">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                            <circle cx="12" cy="5" r="2"></circle>
                            <path d="M12 7v4"></path>
                            <line x1="8" y1="16" x2="8" y2="16"></line>
                            <line x1="16" y1="16" x2="16" y2="16"></line>
                        </svg>
                    </button>
                </div>
                <div class="header-back-fixed">
                    <button class="btn-header-back" id="btnBack">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                </div>
                <span class="trip-tag">${schedule.tripType === 'domestic' ? '국내여행' : '해외여행'}</span>
                <h1 class="title">${schedule.title}</h1>
                ${schedule.tags && schedule.tags.length > 0 ? `
                    <div class="tags-display">
                        ${schedule.tags.map(tag => `<span class="tag-badge">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="subtitle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>${schedule.startDate} - ${schedule.endDate}</span>
                </div>
            </header>

            <div class="stats entry-stagger-1">
                <div class="stat-item">
                    <div class="stat-label">DURATION</div>
                    <div class="stat-value">${calculateDuration(schedule.startDate, schedule.endDate)}</div>
                </div>
                <div class="stat-item stat-item-countries" style="border-left: 1px solid #eee; border-right: 1px solid #eee;">
                    <div class="stat-label">COUNTRIES</div>
                    <div class="stat-value stat-value-collapsible collapsed" id="countriesValue">${schedule.countries ? schedule.countries.join(' ') : '-'}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">MEMBERS</div>
                    <div class="stat-value">성인${schedule.members?.adults || 0} 아동${schedule.members?.children || 0}</div>
                </div>
                
                <button class="stat-toggle-btn-floating" id="btnToggleCountries" aria-label="국가 목록 펼치기/접기">
                    <svg class="toggle-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
            </div>
            
            <div class="view-tabs-container entry-stagger-2">
                <div class="view-tabs">
                    <button class="view-tab active" data-tab="itinerary">일정</button>
                    <button class="view-tab" data-tab="checklist">체크리스트</button>
                    <button class="view-tab" data-tab="tips">여행팁</button>
                    <div class="view-tab-indicator"></div>
                </div>
            </div>
            
            <div class="view-sections entry-stagger-2">
                <div class="view-section active" id="section-itinerary">
                    ${renderDays(schedule.days, schedule.accommodations)}
                </div>
                <div class="view-section" id="section-checklist">
                    ${renderChecklistsSection(schedule.checklists)}
                </div>
                <div class="view-section" id="section-tips">
                    ${renderTipsSection(schedule.tips)}
                </div>
            </div>
        </div>
    `;

    container.querySelector('#btnBack').addEventListener('click', () => showView('list'));
    container.querySelector('#btnEdit').addEventListener('click', () => showView('edit', schedule.id));
    container.querySelector('#btnShare').addEventListener('click', () => showShareModal(schedule.id));
    container.querySelector('#btnChatBot').addEventListener('click', () => showChatBot(schedule));

    // Tabs functionality
    const tabs = container.querySelectorAll('.view-tab');
    const sections = container.querySelectorAll('.view-section');
    const indicator = container.querySelector('.view-tab-indicator');

    function updateIndicator(activeTab) {
        if (!activeTab || !indicator) return;

        const colors = {
            'itinerary': '#45B8AF',
            'checklist': '#456eb8',
            'tips': '#b89545'
        };

        const target = activeTab.dataset.tab;
        indicator.style.width = `${activeTab.offsetWidth}px`;
        indicator.style.left = `${activeTab.offsetLeft}px`;
        if (colors[target]) {
            indicator.style.background = colors[target];
        }
    }

    // Initial indicator position
    setTimeout(() => {
        const activeTab = container.querySelector('.view-tab.active');
        updateIndicator(activeTab);
    }, 100);

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            // Update tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateIndicator(tab);

            // Update sections
            sections.forEach(s => {
                s.classList.remove('active');
                if (s.id === `section-${target}`) {
                    s.classList.add('active');
                }
            });
        });
    });

    // Countries toggle functionality
    const toggleBtn = container.querySelector('#btnToggleCountries');
    const countriesValue = container.querySelector('#countriesValue');
    if (toggleBtn && countriesValue) {
        const checkHeight = () => {
            const lineHeight = parseFloat(getComputedStyle(countriesValue).lineHeight);
            const maxHeight = lineHeight * 2;
            const actualHeight = countriesValue.scrollHeight;

            if (actualHeight > maxHeight) {
                toggleBtn.style.display = 'flex';
            } else {
                toggleBtn.style.display = 'none';
                countriesValue.classList.remove('collapsed');
            }
        };

        checkHeight();
        window.addEventListener('resize', checkHeight);
        toggleBtn.addEventListener('click', () => {
            countriesValue.classList.toggle('collapsed');
            toggleBtn.classList.toggle('expanded');
        });
    }

    // Initialize day accordion
    initDayAccordion();
}

// 일정 일수 계산
function calculateDuration(startDate, endDate) {
    if (!startDate || !endDate) return '-';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const nights = days - 1;
    return nights <= 0 ? `무박 ${days}일` : `${nights}박 ${days}일`;
}

// 일별 일정 렌더링
function renderDays(days = [], allAccommodations = []) {
    if (days.length === 0) {
        return '<div class="empty-state"><p>아직 일정이 없습니다</p></div>';
    }

    return days.map(day => {
        // Find accommodations assigned to this specific date
        const dayAccommodations = allAccommodations.filter(acc =>
            acc.assignedDates && acc.assignedDates.includes(day.date)
        );

        return `
            <div class="day-card" style="margin-left: 15px; margin-right: 15px;">
                <div class="day-header">
                    <div class="day-info">
                        <span class="day-badge">Day ${day.day}</span>
                        <span class="day-date">${(() => {
                try {
                    const date = new Date(day.date);
                    if (isNaN(date.getTime())) return day.date;
                    const month = date.getMonth() + 1;
                    const dayNum = date.getDate();
                    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                    const dayName = dayNames[date.getDay()];
                    return `${month}월 ${dayNum}일 (${dayName})`;
                } catch (e) {
                    return day.date;
                }
            })()}</span>
                    </div>
                    <svg class="collapse-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
                <div class="events-list-view tip-content-wrapper" style="margin:0 !important; padding:0 !important;">
                    <div class="tip-content-inner" style="margin-top:5px;">
                    ${day.events && day.events.length > 0 ? day.events.map((event, index) => {
                // Support for multiple data structures (compatibility)
                const startTime = event.startTime || event.time || '';
                const endTime = event.endTime || '';
                const place = event.place || event.detail || '';
                const desc = event.description || '';

                return `
                            ${index > 0 && startTime ? '<div class="event-divider"></div>' : ''}
                            <div class="event">
                                <div class="event-time-col">
                                    ${startTime ? `
                                        <span class="event-time-bullet"></span>
                                        <span class="event-time-start">${startTime}</span>
                                    ` : '<span class="event-time-spacer"></span>'}
                                    <span class="event-time-dash">${startTime || endTime ? '-' : ''}</span>
                                    <span class="event-time-end">${endTime}</span>
                                </div>
                                <div class="event-detail-content">
                                    <span class="event-place">${place}</span>
                                    <span class="event-desc">${desc}</span>
                                </div>
                            </div>
                        `;
            }).join('') : '<div class="no-events">일정을 등록해 주세요</div>'}
                
                    ${dayAccommodations.length > 0 ? `
                        ${dayAccommodations.map(acc => `
                            <div class="day-card-under collapsed hotel-card-nested" style="margin-top: 10px; box-shadow: none;">
                                <div class="day-header" style="background: #246367; padding: 12px 15px;">
                                    <div class="day-info">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-right: 2px;">
                                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                            <polyline points="9 22 9 12 15 12 15 22"/>
                                        </svg>
                                        <span class="day-date" style="font-size: 0.95rem; font-weight: 800; color: #ffffff;">${acc.name}</span>
                                    </div>
                                    <svg class="collapse-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                                <div class="tip-content-wrapper" style="background: #246367 !important;">
                                    <div class="tip-content-inner">
                                        <div class="acc-details" style="gap:2px !important; margin-left:15px; margin-right:15px;">
                                            ${acc.location ? `<p class="acc-detail-item" style="font-size: 0.85rem; margin-top: 2px; margin-bottom: 2px; color: #ffffff; display: flex; align-items: flex-start; gap: 8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> <span>${acc.location}</span></p>` : ''}
                                            ${acc.contact ? `<p class="acc-detail-item" style="font-size: 0.85rem; margin-top: 2px; margin-bottom: 2px; color: #ffffff; display: flex; align-items: center; gap: 8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.21-2.21a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> <span>${acc.contact}</span></p>` : ''}
                                            ${acc.url ? `<p class="acc-detail-item" style="font-size: 0.85rem; margin-top: 2px; margin-bottom: 2px; display: flex; align-items: center; gap: 8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg> <a href="${acc.url}" target="_blank" style="color: #45B8AF; text-decoration: none; font-weight: 600;">홈페이지 방문</a></p>` : ''}
                                            ${acc.checkIn || acc.checkOut ? `<p class="acc-detail-item" style="font-size: 0.85rem; margin-top: 2px; margin-bottom: 2px; color: #ffffff; display: flex; align-items: center; gap: 8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> <span>체크인 ${acc.checkIn || '미지정'} / 체크아웃 ${acc.checkOut || '미지정'}</span></p>` : ''}
                                            ${acc.notes ? `<div class="acc-notes" style="font-size: 0.85rem; color: #6a6a6a; background: #fff; padding: 12px; border-radius: 8px; white-space: pre-wrap; line-height: 1.5; margin-top: 8px;">${acc.notes}</div>` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 체크리스트 섹션 렌더링
function renderChecklistsSection(checklists = []) {
    if (!checklists || checklists.length === 0) return '';

    return `
        <div class="view-list-container" style="margin-top: 10px;">
            ${checklists.map(list => `
                <div class="day-card collapsed" style="margin-bottom: 5px; margin-left: 15px; margin-right: 15px; border: 1px solid #e2e8f0;">
                    <div class="day-header" style="background: #456eb8; padding: 12px 15px;">
                        <div class="day-info">
                            <span class="day-badge" style="background: rgba(255,255,255,0.2); color: white; font-size: 0.75rem; font-weight: 800; padding: 2px 6px; border-radius: 4px;">LIST</span>
                            <span class="day-date" style="font-size: 0.95rem; font-weight: 800; color: white;">${list.name || 'Checklist'}</span>
                        </div>
                        <svg class="collapse-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                    <div class="tip-content-wrapper">
                        <div class="tip-content-inner">
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                ${list.items && list.items.length > 0 ? list.items.map(item => `
                                    <li style="display: flex; align-items: center; gap: 10px; padding: 8px; border-bottom: 1px solid #f0f0f0;">
                                        <div style="width: 18px; height: 18px; border-radius: 4px; border: 2px solid #ddd; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                                            ${item.completed ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#456eb8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                                        </div>
                                        <span style="font-size: 0.95rem; color: #333; ${item.completed ? 'text-decoration: line-through; color: #aaa;' : ''}">${item.text}</span>
                                    </li>
                                `).join('') : '<li style="color: #999; font-size: 0.9rem;">항목이 없습니다.</li>'}
                            </ul>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 꿀팁 섹션 렌더링
function renderTipsSection(tips = []) {
    if (!tips || tips.length === 0) return '';

    return `
        <div class="view-list-container" style="margin-top: 10px;">
            ${tips.map(tip => `
                <div class="day-card collapsed" style="margin-bottom: 5px; margin-left: 15px; margin-right: 15px; border: 1px solid #e2e8f0;">
                    <div class="day-header" style="background: #b89545; padding: 12px 15px;">
                        <div class="day-info">
                            <span class="day-badge" style="background: rgba(255,255,255,0.2); color: white; font-size: 0.75rem; font-weight: 800; padding: 2px 6px; border-radius: 4px;">TIP</span>
                            <span class="day-date" style="font-size: 0.95rem; font-weight: 800; color: white;">${tip.title}</span>
                        </div>
                        <svg class="collapse-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                    <div class="tip-content-wrapper">
                        <div class="tip-content-inner">
                            <div style="font-size: 0.95rem; padding: 8px; color: #444; line-height: 1.6; white-space: pre-wrap;">${tip.content}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Initialize accordion functionality for day cards
function initDayAccordion() {
    const dayCards = document.querySelectorAll('.day-card, .day-card-under');
    dayCards.forEach(card => {
        const header = card.querySelector('.day-header');
        const contentWrapper = card.querySelector('.tip-content-wrapper');
        const collapseIcon = card.querySelector('.collapse-icon');

        if (header && contentWrapper && collapseIcon) {
            header.addEventListener('click', () => {
                card.classList.toggle('collapsed');
            });
        }
    });
}

// 앱 시작
init();
