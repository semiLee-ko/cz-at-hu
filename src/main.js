// 메인 애플리케이션 로직

import './style.css';
import './styles/tip-form.css';
import './styles/checklist-form.css';
import { getCurrentSchedule, getSchedule, setCurrentSchedule, saveSchedule } from './storage.js';
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

            <!-- Floating Action Group -->
            <div class="floating-action-group">
                <button class="btn-floating action-map-floating" title="이동경로">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                        <line x1="8" y1="2" x2="8" y2="18"></line>
                        <line x1="16" y1="6" x2="16" y2="22"></line>
                    </svg>
                </button>
                <button class="btn-floating action-receipt-floating" title="영수증/정산 목록">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"></path>
                        <path d="M16 8h-8"></path>
                        <path d="M16 12h-8"></path>
                        <path d="M13 16h-5"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;

    container.querySelector('#btnBack').addEventListener('click', () => showView('list'));
    container.querySelector('#btnEdit').addEventListener('click', () => showView('edit', schedule.id));
    container.querySelector('#btnShare').addEventListener('click', () => showShareModal(schedule.id));
    container.querySelector('#btnChatBot').addEventListener('click', () => showChatBot(schedule));

    // Floating Buttons
    container.querySelector('.action-map-floating').addEventListener('click', () => {
        showMapPopup(schedule.id);
    });

    container.querySelector('.action-receipt-floating').addEventListener('click', () => {
        showTotalSettlementPopup(schedule.id);
    });

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

    // Initialize checklist interaction
    initChecklistInteraction(schedule);

    // Initialize day accordion
    initDayAccordion(schedule);
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

        // Group events: A group starts when an event has a startTime
        const eventGroups = [];
        if (day.events && day.events.length > 0) {
            let currentGroup = null;
            day.events.forEach((event, index) => {
                const startTime = event.startTime || event.time || '';
                if (startTime || index === 0) {
                    currentGroup = {
                        startTime: startTime,
                        endTime: event.endTime || '',
                        events: [],
                        startEventIndex: index // Store the index of the first event in the group
                    };
                    eventGroups.push(currentGroup);
                }
                currentGroup.events.push(event);
            });
        }

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
                    <div class="tip-content-inner">
                        ${eventGroups.length > 0 ? eventGroups.map((group, gIndex) => {
                const dayIndex = days.indexOf(day);
                return `
                                ${gIndex > 0 ? '<div class="event-divider"></div>' : ''}
                                <div class="event-group" data-group-index="${gIndex}" data-day-index="${dayIndex}" data-event-index="${group.startEventIndex}">
                                    ${group.events.map((event, eIndex) => {
                    const startTime = event.startTime || event.time || '';
                    const endTime = event.endTime || '';
                    const place = event.place || event.detail || '';
                    const desc = event.description || '';

                    return `
                                            <div class="event">
                                                <div class="event-time-col">
                                                    ${eIndex === 0 && startTime ? `
                                                        <span class="event-time-bullet"></span>
                                                        <span class="event-time-start">${startTime}</span>
                                                    ` : '<span class="event-time-spacer"></span>'}
                                                    <span class="event-time-dash">${(eIndex === 0 && (startTime || endTime)) ? '-' : ''}</span>
                                                    <span class="event-time-end">${eIndex === 0 ? endTime : ''}</span>
                                                </div>
                                                <div class="event-detail-content">
                                                    <span class="event-place">${place}</span>
                                                    <span class="event-desc">${desc}</span>
                                                </div>
                                            </div>
                                        `;
                }).join('')}
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
                                            ${acc.price ? `<p class="acc-detail-item" style="font-size: 0.85rem; margin-top: 2px; margin-bottom: 2px; color: #ffffff; display: flex; align-items: center; gap: 8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg> <span>${Number(acc.price) ? Number(acc.price).toLocaleString() + '원' : acc.price}</span></p>` : ''}
                                            ${acc.url ? `<p class="acc-detail-item" style="font-size: 0.85rem; margin-top: 2px; margin-bottom: 2px; color: #ffffff; display: flex; align-items: center; gap: 8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg> <a href="${acc.url}" target="_blank" style="color: #45B8AF; text-decoration: none; font-weight: 600;">홈페이지 방문</a></p>` : ''}
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
    // Handle both old object format and new array format
    let checklistArray = [];

    if (Array.isArray(checklists)) {
        checklistArray = checklists;
    } else if (checklists && typeof checklists === 'object') {
        // Convert old format {packing: [...], todo: [...]} to new array format
        const packing = checklists.packing || [];
        const todo = checklists.todo || [];
        checklistArray = [...packing, ...todo];
    }

    if (!checklistArray || checklistArray.length === 0) return '';

    return `
        <div class="view-list-container" style="margin-top: 10px;">
            ${checklistArray.map(list => `
                <div class="day-card" style="margin-bottom: 5px; margin-left: 15px; margin-right: 15px; border: 1px solid #e2e8f0;">
                    <div class="day-header" style="background: #456eb8; padding: 12px 15px;">
                        <div class="day-info">
                            <span class="day-badge" style="background: rgba(255,255,255,0.2); color: white; font-size: 0.75rem; font-weight: 800; padding: 2px 6px; border-radius: 4px;">${list.type === 'todo' ? '할일' : '준비물'}</span>
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
                                    <li class="view-checklist-item" style="display: flex; align-items: center; gap: 10px; padding: 12px 10px; border-bottom: 1px solid #f0f0f0; cursor: pointer; transition: all 0.2s; background-color: ${(() => {
            if (item.checked) return 'transparent';
            const colors = { high: '#fef2f2', medium: '#fffbeb', low: '#ecfdf5' };
            return colors[item.priority] || 'transparent';
        })()};" data-cat-id="${list.id}" data-item-id="${item.id}">
                                        <div class="checklist-checkbox ${item.checked ? 'checked' : ''}" style="width: 20px; height: 20px; border-radius: 6px; border: 2px solid ${item.checked ? '#456eb8' : '#ddd'}; background: ${item.checked ? '#f0f4ff' : 'white'}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                                            ${item.checked ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#456eb8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                                        </div>
                                        <span class="checklist-text" style="font-size: 0.95rem; color: ${item.checked ? '#aaa' : '#333'}; font-weight: ${item.priority === 'high' && !item.checked ? '600' : 'normal'}; transition: all 0.2s; ${item.checked ? 'text-decoration: line-through;' : ''}">${item.text}</span>
                                    </li>
                                `).join('') : '<li style="color: #999; font-size: 0.9rem; padding: 10px;">항목이 없습니다.</li>'}
                            </ul>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 체크리스트 상호작용 초기화
function initChecklistInteraction(schedule) {
    const items = document.querySelectorAll('.view-checklist-item');

    items.forEach(item => {
        item.addEventListener('click', (e) => {
            const catId = item.dataset.catId;
            const itemId = item.dataset.itemId;

            // 데이터 구조에서 해당 항목 찾기
            const list = schedule.checklists.find(l => l.id === catId);
            if (!list) return;

            const checkItem = list.items.find(i => i.id === itemId);
            if (!checkItem) return;

            // 상태 토글
            checkItem.checked = !checkItem.checked;

            // UI 업데이트
            const checkbox = item.querySelector('.checklist-checkbox');
            const text = item.querySelector('.checklist-text');

            if (checkItem.checked) {
                checkbox.classList.add('checked');
                checkbox.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#456eb8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                text.style.textDecoration = 'line-through';
                text.style.color = '#aaa';
                text.style.fontWeight = 'normal';
                checkbox.style.borderColor = '#456eb8';
                checkbox.style.background = '#f0f4ff';
                item.style.backgroundColor = 'transparent';
            } else {
                checkbox.classList.remove('checked');
                checkbox.innerHTML = '';
                text.style.textDecoration = 'none';
                text.style.color = '#333';
                text.style.fontWeight = checkItem.priority === 'high' ? '600' : 'normal';
                checkbox.style.borderColor = '#ddd';
                checkbox.style.background = 'white';

                const colors = { high: '#fef2f2', medium: '#fffbeb', low: '#ecfdf5' };
                item.style.backgroundColor = colors[checkItem.priority] || 'transparent';
            }

            // 저장
            saveSchedule(schedule);
        });
    });
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
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-right: 5px;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
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
function initDayAccordion(schedule) {
    const dayCards = document.querySelectorAll('.day-card, .day-card-under');
    dayCards.forEach(card => {
        const header = card.querySelector('.day-header');
        if (header) {
            header.addEventListener('click', () => {
                card.classList.toggle('collapsed');
            });
        }
    });

    initSpotlightMode(schedule);
}

// Spotlight & Itinerary Action Menu
function initSpotlightMode(schedule) {
    const eventGroups = document.querySelectorAll('.event-group');
    if (eventGroups.length === 0) return;

    // Store schedule ID in each event group for later reference
    eventGroups.forEach(group => {
        group.dataset.scheduleId = schedule.id;
    });

    // Create Spotlight Overlay if it doesn't exist
    let overlay = document.querySelector('.spotlight-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'spotlight-overlay';
        document.body.appendChild(overlay);
    }

    // Create Action Bar if it doesn't exist
    let actionBar = document.querySelector('.event-action-bar');
    if (!actionBar) {
        actionBar = document.createElement('div');
        actionBar.className = 'event-action-bar';
        actionBar.innerHTML = `
            <div class="action-item action-camera" title="카메라">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                </svg>
            </div>
            <div class="action-item action-location" title="위치정보">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
            </div>
            <div class="action-item action-settlement" title="정산/인원">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                    <line x1="12" y1="6" x2="12" y2="18"></line>
                </svg>
            </div>
        `;
        document.body.appendChild(actionBar);

        // --- NEW: Attach listeners ONLY ONCE when created ---
        // Camera Review Logic
        actionBar.querySelector('.action-camera').addEventListener('click', () => {
            const activeGroup = document.querySelector('.event-group.active-spotlight');
            if (activeGroup) {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.capture = 'environment';
                fileInput.classList.add('hidden-file-input');
                fileInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        showCameraPopup(activeGroup, file);
                    }
                };
                fileInput.click();
            }
        });

        // Location Picker Logic
        actionBar.querySelector('.action-location').addEventListener('click', () => {
            const activeGroup = document.querySelector('.event-group.active-spotlight');
            if (!activeGroup) return;

            const scheduleId = activeGroup.dataset.scheduleId;
            const dayIdx = parseInt(activeGroup.dataset.dayIndex);
            const eventIdx = parseInt(activeGroup.dataset.eventIndex);
            const schedule = getSchedule(scheduleId);
            if (!schedule) return;
            const targetEvent = schedule.days[dayIdx].events[eventIdx];

            // Location Picker Logic
            // NEW: Always open picker (Edit Mode)
            const currentLat = targetEvent.coords ? targetEvent.coords.lat : null;
            const currentLng = targetEvent.coords ? targetEvent.coords.lng : null;

            window.showLocationPicker(currentLat, currentLng, (coords) => {
                targetEvent.coords = {
                    lat: coords.lat,
                    lng: coords.lng,
                    timestamp: new Date().toISOString()
                };
                saveSchedule(schedule);
                updateActionStates(activeGroup);
            });
        });



        // Settlement Logic
        actionBar.querySelector('.action-settlement').addEventListener('click', () => {
            const activeGroup = document.querySelector('.event-group.active-spotlight');
            if (activeGroup) {
                const scheduleId = activeGroup.dataset.scheduleId;
                showSettlementPopup(activeGroup, updateActionStates, scheduleId);
            }
        });
    }

    const deactivateSpotlight = () => {
        document.body.classList.remove('spotlight-active');
        document.querySelectorAll('.event-group.active-spotlight').forEach(el => el.classList.remove('active-spotlight'));
        document.querySelectorAll('.day-card.spotlight-parent').forEach(el => el.classList.remove('spotlight-parent'));
        overlay.classList.remove('active');
        actionBar.classList.remove('active');
        document.body.style.overflow = ''; // Enable scroll
    };

    const updateActionStates = (group) => {
        const scheduleId = group.dataset.scheduleId;
        const schedule = getSchedule(scheduleId);
        if (!schedule) return;
        const dayIdx = group.dataset.dayIndex;
        const eventIdx = group.dataset.eventIndex;
        const firstEvent = schedule.days[dayIdx]?.events[eventIdx];

        const locationBtn = actionBar.querySelector('.action-location');
        if (firstEvent && firstEvent.coords) {
            locationBtn.classList.add('active-red');
        } else {
            locationBtn.classList.remove('active-red');
        }


        const settlementBtn = actionBar.querySelector('.action-settlement');
        if (firstEvent && firstEvent.expenses && firstEvent.expenses.length > 0) {
            settlementBtn.classList.add('active-green');
        } else {
            settlementBtn.classList.remove('active-green');
        }
    };

    eventGroups.forEach(group => {
        group.addEventListener('click', (e) => {
            e.stopPropagation();

            const parentCard = group.closest('.day-card');

            // If already active, deactivate
            if (group.classList.contains('active-spotlight')) {
                deactivateSpotlight();
                return;
            }

            // Deactivate others
            document.querySelectorAll('.event-group.active-spotlight').forEach(el => el.classList.remove('active-spotlight'));
            document.querySelectorAll('.day-card.spotlight-parent').forEach(el => el.classList.remove('spotlight-parent'));

            // Activate current
            group.classList.add('active-spotlight');
            if (parentCard) parentCard.classList.add('spotlight-parent');

            document.body.classList.add('spotlight-active');
            overlay.classList.add('active');
            actionBar.classList.add('active');
            document.body.style.overflow = 'hidden'; // Disable scroll

            // Update button states for this group
            updateActionStates(group);
        });
    });

    overlay.addEventListener('click', deactivateSpotlight);
}

// Custom Confirm Utility
function showCustomConfirm(message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'custom-confirm-overlay';
    modal.innerHTML = `
        <div class="custom-confirm-modal">
            <div class="confirm-message">${message}</div>
            <div class="confirm-actions">
                <button class="btn-confirm-cancel">취소</button>
                <button class="btn-confirm-ok">확인</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Animate in
    setTimeout(() => modal.classList.add('active'), 10);

    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.btn-confirm-cancel').onclick = closeModal;
    modal.querySelector('.btn-confirm-ok').onclick = () => {
        onConfirm();
        closeModal();
    };
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}

// Custom Alert Utility
function showCustomAlert(message) {
    const modal = document.createElement('div');
    modal.className = 'custom-confirm-overlay'; // Reuse overlay style
    modal.innerHTML = `
        <div class="custom-confirm-modal">
            <div class="confirm-message">${message}</div>
            <div class="confirm-actions">
                <button class="btn-confirm-ok" style="width: 100%;">확인</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Animate in
    setTimeout(() => modal.classList.add('active'), 10);

    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.btn-confirm-ok').onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}


// Settlement Popup for Expense Management (Integrated with Members)
function showSettlementPopup(group, updateActionStatesCallback, scheduleId) {
    const schedule = getSchedule(scheduleId);
    if (!schedule) return;
    const dayIdx = group.dataset.dayIndex;
    const eventIdx = group.dataset.eventIndex;
    const event = schedule.days[dayIdx]?.events[eventIdx];

    if (!event) return;

    if (!event.participants) event.participants = [];
    if (!event.expenses) event.expenses = [];

    // All trip members
    const allMembers = [
        ...(schedule.members?.adultList || []),
        ...(schedule.members?.childList || [])
    ];

    const modal = document.createElement('div');
    modal.className = 'settlement-popup-overlay';

    // Local state for current input
    let tempParticipants = [...event.participants];

    const renderContent = () => {
        const totalAmount = event.expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
        const selectedCount = tempParticipants.length;
        const available = allMembers.filter(m => !tempParticipants.includes(m));

        modal.innerHTML = `
            <div class="settlement-popup-container">
                <div class="settlement-popup-header">
                    <div class="header-info">
                        <h3>지출/인원 관리</h3>
                        <p class="total-summary">총 ${totalAmount.toLocaleString()}원 지출</p>
                    </div>
                    <button class="btn-close-settlement">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div class="settlement-popup-content">
                    <!-- Integrated Input Card -->
                    <div class="settlement-input-card">
                        <!-- New Expense Input -->
                        <div class="expense-input-section">
                            <div class="expense-input-header">
                                <label>신규 지출 추가</label>
                            </div>
                            <div class="participants-toggle-area">
                                <p class="small-label">정산 참여 인원 선택 (기본: 전체) <span class="count">${tempParticipants.length}명</span></p>
                                <div class="mini-chips">
                                    ${allMembers.map(name => `
                                        <div class="mini-chip ${tempParticipants.includes(name) ? 'selected' : ''}" data-name="${name}">${name}</div>
                                    `).join('')}
                                    ${allMembers.length === 0 ? '<p class="empty-msg-sm">여행 멤버를 먼저 등록해주세요</p>' : ''}
                                </div>
                            </div>
                            <div class="input-grid-group">
                                <div class="field-item">
                                    <label>사용처 (항목)</label>
                                    <input type="text" class="usage-input-sm" placeholder="예: 점심 식사, 기차표 등">
                                </div>
                                <div class="field-row">
                                    <div class="field-item flex-1">
                                        <label>결제자</label>
                                        <select class="payer-select-sm">
                                            ${tempParticipants.map(p => `<option value="${p}">${p}</option>`).join('')}
                                            ${tempParticipants.length === 0 ? '<option value="">인원 없음</option>' : ''}
                                        </select>
                                    </div>
                                    <div class="field-item flex-1">
                                        <label>금액 (원)</label>
                                        <input type="number" class="amount-input-sm" placeholder="0" inputmode="numeric">
                                    </div>
                                    <button class="btn-add-expense-integrated">추가</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- History List -->
                    <div class="expense-history-list">
                        <h4>지출 내역</h4>
                        ${event.expenses.length === 0 ? `
                            <div class="empty-msg">내역이 없습니다.</div>
                        ` : event.expenses.map((exp, idx) => `
                            <div class="expense-item-card">
                                <div class="exp-main">
                                    <div class="exp-header">
                                        <span class="exp-usage">${exp.usage || '지출 내역'}</span>
                                        <span class="exp-date">${new Date(exp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div class="exp-meta">
                                        <span class="exp-payer-mini"><b>${exp.payer}</b> 결제</span>
                                        <span class="exp-participants-list">참여: ${exp.participants?.join(', ') || '전체'}</span>
                                    </div>
                                </div>
                                <div class="exp-right">
                                    <span class="exp-amount">${Number(exp.amount).toLocaleString()}원</span>
                                    <button class="btn-del-expense-sm" data-index="${idx}">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        `).reverse().join('')}
                    </div>
                </div>
            </div>
        `;

        // 1. Mini Chips (Event Participant Management)
        modal.querySelectorAll('.mini-chip').forEach(chip => {
            chip.onclick = () => {
                const name = chip.dataset.name;
                if (tempParticipants.includes(name)) {
                    tempParticipants = tempParticipants.filter(p => p !== name);
                } else {
                    tempParticipants.push(name);
                }
                // Save to event participants pool
                event.participants = tempParticipants;
                saveSchedule(schedule);
                if (updateActionStatesCallback) updateActionStatesCallback(group);
                renderContent();
            };
        });

        // 2. Close logic
        modal.querySelector('.btn-close-settlement').onclick = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };

        // 3. Add Expense
        const btnAdd = modal.querySelector('.btn-add-expense-integrated');
        if (btnAdd) {
            btnAdd.onclick = () => {
                const amount = modal.querySelector('.amount-input-sm').value.trim();
                const usage = modal.querySelector('.usage-input-sm').value.trim();
                const payer = modal.querySelector('.payer-select-sm').value;
                const selectedParticipants = Array.from(modal.querySelectorAll('.mini-chip.selected')).map(c => c.dataset.name);

                if (!payer) {
                    showCustomAlert('결제자를 선택해주세요.');
                    return;
                }
                if (!amount || isNaN(amount)) {
                    showCustomAlert('금액을 정확히 입력해주세요.');
                    return;
                }
                if (selectedParticipants.length === 0) {
                    showCustomAlert('정산에 참여할 인원을 최소 1명 선택해주세요.');
                    return;
                }

                event.expenses.push({
                    payer: payer,
                    usage: usage || '지출 내역', // Default usage if empty
                    amount: parseInt(amount),
                    participants: selectedParticipants, // Bundle participants with expense
                    timestamp: new Date().toISOString()
                });

                saveSchedule(schedule);
                renderContent();
                if (updateActionStatesCallback) updateActionStatesCallback(group);
            };
        }

        // 4. Delete Expense
        modal.querySelectorAll('.btn-del-expense-sm').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.index);
                event.expenses.splice(idx, 1);
                saveSchedule(schedule);
                renderContent();
                if (updateActionStatesCallback) updateActionStatesCallback(group);
            };
        });
    };

    renderContent();
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

// Total Settlement (N-bbang) Popup
function showTotalSettlementPopup(scheduleId) {
    const schedule = getSchedule(scheduleId);
    if (!schedule) return;

    const modal = document.createElement('div');
    modal.className = 'total-settlement-overlay';

    // 1. Calculate N-bbang Results
    const calculateResults = () => {
        const balances = {};
        let totalTripExpense = 0;

        schedule.days.forEach(day => {
            day.events.forEach(event => {
                if (event.expenses && event.expenses.length > 0) {
                    event.expenses.forEach(exp => {
                        const amount = Number(exp.amount) || 0;
                        totalTripExpense += amount;

                        // Use per-expense participants, fallback to event participants
                        const participants = (exp.participants && exp.participants.length > 0)
                            ? exp.participants
                            : (event.participants || []);

                        if (participants.length > 0) {
                            const share = amount / participants.length;
                            participants.forEach(p => {
                                balances[p] = (balances[p] || 0) + share;
                            });
                            balances[exp.payer] = (balances[exp.payer] || 0) - amount;
                        } else {
                            // If no participants assigned, assume only the payer is responsible (uncommon but safe)
                            balances[exp.payer] = (balances[exp.payer] || 0) - amount;
                        }
                    });
                }
            });
        });

        const transfers = [];
        const debtors = [];
        const creditors = [];

        Object.keys(balances).forEach(name => {
            const bal = balances[name];
            if (bal > 1) debtors.push({ name, bal });
            else if (bal < -1) creditors.push({ name, bal: Math.abs(bal) });
        });

        // Greedy matching for transfers
        let dIdx = 0, cIdx = 0;
        const debtorsTemp = debtors.map(d => ({ ...d }));
        const creditorsTemp = creditors.map(c => ({ ...c }));

        while (dIdx < debtorsTemp.length && cIdx < creditorsTemp.length) {
            const d = debtorsTemp[dIdx];
            const c = creditorsTemp[cIdx];
            const transfer = Math.min(d.bal, c.bal);

            transfers.push({
                from: d.name,
                to: c.name,
                amount: Math.round(transfer)
            });

            d.bal -= transfer;
            c.bal -= transfer;

            if (d.bal < 1) dIdx++;
            if (c.bal < 1) cIdx++;
        }

        return { totalTripExpense, transfers };
    };

    const { totalTripExpense, transfers } = calculateResults();

    modal.innerHTML = `
        <div class="total-settlement-container">
            <div class="total-settlement-header">
                <div class="header-left">
                    <h3>전체 정산 리포트</h3>
                    <p class="trip-total-amount">총 지출: ${totalTripExpense.toLocaleString()}원</p>
                </div>
                <button class="btn-close-total-settlement">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <div class="total-settlement-content">
                <!-- N-bbang Summary Card -->
                <div class="settlement-summary-card">
                    <div class="settlement-header-row">
                        <h4>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                                <line x1="12" y1="6" x2="12" y2="18"></line>
                            </svg>
                            정산 결과
                        </h4>
                        ${transfers.length > 0 ? `
                            <button class="btn-copy-settlement" title="정산 내역 복사">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                    ${transfers.length === 0 ? `
                        <div class="empty-results">정산할 내역이 없습니다. 모두 공평하게 지출했거나 지출이 없어요!</div>
                    ` : `
                        <div class="transfer-list">
                            ${transfers.map(t => `
                                <div class="transfer-item">
                                    <div class="transfer-main">
                                        <span class="transfer-from"><b>${t.from}</b></span>
                                        <span class="transfer-arrow">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                <polyline points="12 5 19 12 12 19"></polyline>
                                            </svg>
                                        </span>
                                        <span class="transfer-to"><b>${t.to}</b></span>
                                    </div>
                                    <span class="transfer-amount">${t.amount.toLocaleString()}원</span>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>

                <!-- Detailed History by Day -->
                <div class="settlement-history-section">
                    <h4>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        상세 지출 내역
                    </h4>
                    <div class="history-list">
                        ${schedule.days.map((day, dIdx) => {
        const dayExpenses = [];
        day.events.forEach(event => {
            if (event.expenses && event.expenses.length > 0) {
                dayExpenses.push({ event, expenses: event.expenses });
            }
        });

        if (dayExpenses.length === 0) return '';

        return `
                                <div class="history-day-group">
                                    <div class="day-label">Day ${dIdx + 1}</div>
                                    ${dayExpenses.map(item => `
                                        <div class="history-event-card">
                                            <div class="event-expense-items">
                                                ${item.expenses.map(exp => `
                                                    <div class="history-exp-row">
                                                        <div class="exp-left">
                                                            <div class="exp-usage-main">${exp.usage || '지출 내역'}</div>
                                                            <div class="exp-who-meta">
                                                                <span class="exp-payer-name"><b>${exp.payer}</b> 결제</span>
                                                                <span class="exp-participants">(${exp.participants?.join(', ') || item.event.participants?.join(', ') || '전체'})</span>
                                                            </div>
                                                        </div>
                                                        <span class="exp-cost">${Number(exp.amount).toLocaleString()}원</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
    }).join('') || '<div class="empty-msg">상세 내역이 없습니다.</div>'}
                    </div>
                </div>
            </div>
            <div class="total-settlement-footer">
                <button class="btn-confirm-total-settlement">닫기</button>
            </div>
        </div>
    `;

    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    };

    modal.querySelector('.btn-close-total-settlement').onclick = closeModal;
    modal.querySelector('.btn-confirm-total-settlement').onclick = closeModal;

    // Copy settlement results
    const btnCopy = modal.querySelector('.btn-copy-settlement');
    if (btnCopy) {
        btnCopy.onclick = async () => {
            const header = `LITTLE TRIP에서 ${schedule.title}의 정산 결과를 가져왔어요!\n\n`;
            const text = header + transfers.map(t => `${t.from} → ${t.to}: ${t.amount.toLocaleString()}원`).join('\n');
            try {
                await navigator.clipboard.writeText(text);
                showCustomAlert('정산 내역이 복사되었습니다!');
            } catch (err) {
                showCustomAlert('복사에 실패했습니다.');
            }
        };
    }

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
}


// Camera Popup for Polaroid Reviews
function showCameraPopup(group, imageFile) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageUrl = e.target.result;

        const modal = document.createElement('div');
        modal.className = 'camera-popup-overlay';

        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeStr = `${year}-${month}-${day} ${hours}:${minutes}`;

        let starRating = 5;

        const renderContent = () => {
            modal.innerHTML = `
                <div class="camera-popup-container">
                    <div class="camera-popup-header">
                        <h3>폴라로이드 리뷰 만들기</h3>
                        <button class="btn-close-camera">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="camera-popup-content">
                        <!-- Preview Card -->
                        <div class="polaroid-preview-card">
                            <div class="polaroid-frame">
                                <div class="polaroid-image-container">
                                    <img src="${imageUrl}" class="polaroid-image">
                                    <div class="polaroid-time-stamp">${timeStr}</div>
                                    <div class="polaroid-branding">LITTLE TRIP</div>
                                    <button class="btn-reselect-image" title="이미지 다시 선택">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                            <circle cx="12" cy="13" r="4"></circle>
                                        </svg>
                                    </button>
                                </div>
                                <div class="polaroid-info">
                                    <div class="info-line place-preview">장소를 입력하세요</div>
                                    <div class="info-line item-preview">메뉴를 입력하세요</div>
                                    <div class="info-memo memo-preview">메모를 입력하세요</div>
                                    <div class="info-footer">
                                        <span class="price-preview">0원</span>
                                        <span class="rating-preview">★★★★★</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Input Area -->
                        <div class="polaroid-inputs">
                            <div class="input-group">
                                <label>장소명</label>
                                <input type="text" class="input-place" placeholder="예: 구글 맛집">
                            </div>
                            <div class="input-group">
                                <label>메뉴/항목</label>
                                <input type="text" class="input-item" placeholder="예: 시그니처 샌드위치">
                            </div>
                            <div class="input-group">
                                <label>메모</label>
                                <textarea class="input-memo" placeholder="여행의 소중한 순간을 기록하세요..." rows="3"></textarea>
                            </div>
                            <div class="input-row">
                                <div class="input-group">
                                    <label>가격</label>
                                    <input type="number" class="input-price" placeholder="0" inputmode="numeric">
                                </div>
                                <div class="input-group">
                                    <label>평가 (별점)</label>
                                    <div class="star-rating-input">
                                        ${[1, 2, 3, 4, 5].map(n => `<span class="star ${n <= starRating ? 'active' : ''}" data-value="${n}">★</span>`).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="camera-popup-footer">
                        <button class="btn-generate-polaroid">이미지로 저장하기</button>
                    </div>
                    <canvas id="polaroid-canvas" style="display:none;"></canvas>
                </div>
            `;

            // Close
            modal.querySelector('.btn-close-camera').onclick = () => {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
            };

            // Real-time Preview Sync
            const inputPlace = modal.querySelector('.input-place');
            const inputItem = modal.querySelector('.input-item');
            const inputPrice = modal.querySelector('.input-price');
            const inputMemo = modal.querySelector('.input-memo');

            const previewPlace = modal.querySelector('.place-preview');
            const previewItem = modal.querySelector('.item-preview');
            const previewPrice = modal.querySelector('.price-preview');
            const previewRating = modal.querySelector('.rating-preview');
            const previewMemo = modal.querySelector('.memo-preview');

            inputPlace.oninput = () => previewPlace.textContent = inputPlace.value || '장소를 입력하세요';
            inputItem.oninput = () => previewItem.textContent = inputItem.value || '메뉴를 입력하세요';
            inputPrice.oninput = () => previewPrice.textContent = (Number(inputPrice.value).toLocaleString() || '0') + '원';
            inputMemo.oninput = () => previewMemo.textContent = inputMemo.value || '메모를 입력하세요';

            // Image Re-selection
            modal.querySelector('.btn-reselect-image').onclick = () => {
                const reselectInput = document.createElement('input');
                reselectInput.type = 'file';
                reselectInput.accept = 'image/*';
                reselectInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader2 = new FileReader();
                        reader2.onload = (e2) => {
                            const newUrl = e2.target.result;
                            modal.querySelector('.polaroid-image').src = newUrl;
                            imageUrl = newUrl; // Update closure variable
                        };
                        reader2.readAsDataURL(file);
                    }
                };
                reselectInput.click();
            };

            // Star Rating Logic
            modal.querySelectorAll('.star').forEach(star => {
                star.onclick = () => {
                    starRating = parseInt(star.dataset.value);
                    const stars = modal.querySelectorAll('.star');
                    stars.forEach((s, i) => {
                        if (i < starRating) s.classList.add('active');
                        else s.classList.remove('active');
                    });
                    previewRating.textContent = '★'.repeat(starRating) + '☆'.repeat(5 - starRating);
                };
            });

            // Generate Canvas & Download
            modal.querySelector('.btn-generate-polaroid').onclick = () => {
                const canvas = modal.querySelector('#polaroid-canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = imageUrl;

                img.onload = () => {
                    // Polaroid dimensions
                    const frameWidth = 1000;
                    const frameHeight = 1300;
                    const padding = 60;
                    const imageSize = frameWidth - (padding * 2);
                    const footerHeight = 300;

                    canvas.width = frameWidth;
                    canvas.height = frameHeight;

                    // 1. Draw White Background
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, frameWidth, frameHeight);

                    // 2. Draw Image (Square crop)
                    const side = Math.min(img.width, img.height);
                    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, padding, padding, imageSize, imageSize);

                    // 3. Draw Border for Image
                    ctx.strokeStyle = '#f1f5f9';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(padding, padding, imageSize, imageSize);

                    // 3.5 Draw Internal Branding & Time
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
                    ctx.font = 'bold 22px sans-serif';

                    // Time Stamp (Top Right)
                    ctx.textAlign = 'right';
                    ctx.fillText(timeStr, padding + imageSize - 20, padding + 40);

                    // Service Branding (Bottom Center)
                    ctx.textAlign = 'center';
                    ctx.font = '600 20px sans-serif';
                    ctx.letterSpacing = "2px";
                    ctx.fillText('LITTLE TRIP', padding + (imageSize / 2), padding + imageSize - 20);
                    ctx.letterSpacing = "0px";

                    // Reset alignment for other texts
                    ctx.textAlign = 'left';

                    // 4. Draw Text Info
                    ctx.fillStyle = '#1e293b';

                    // Place Name (Bold)
                    ctx.font = 'bold 48px sans-serif';
                    ctx.fillText(inputPlace.value || '장소명 미입력', padding, imageSize + padding + 80);

                    // Item Name
                    ctx.font = '40px sans-serif';
                    ctx.fillStyle = '#64748b';
                    ctx.fillText(inputItem.value || '항목 미입력', padding, imageSize + padding + 140);

                    // Footer Side by Side
                    const footerY = imageSize + padding + 220;

                    // Price
                    ctx.font = 'bold 44px sans-serif';
                    ctx.fillStyle = '#10b981';
                    ctx.fillText((Number(inputPrice.value).toLocaleString() || '0') + '원', padding, footerY);

                    // Rating
                    ctx.font = '44px sans-serif';
                    ctx.fillStyle = '#fbbf24';
                    const ratingStr = '★'.repeat(starRating) + '☆'.repeat(5 - starRating);
                    const ratingWidth = ctx.measureText(ratingStr).width;
                    ctx.fillText(ratingStr, frameWidth - padding - ratingWidth, footerY);

                    // 4.5 Draw Memo (Wrapped Text)
                    if (inputMemo.value) {
                        ctx.font = 'italic 34px sans-serif';
                        ctx.fillStyle = '#475569';
                        const memoY = footerY + 80;
                        const maxWidth = frameWidth - (padding * 2);
                        const words = inputMemo.value.split(''); // Char-level split for CJK
                        let line = '';
                        let lineCount = 0;

                        for (let n = 0; n < words.length; n++) {
                            let testLine = line + words[n];
                            let metrics = ctx.measureText(testLine);
                            let testWidth = metrics.width;
                            if (testWidth > maxWidth && n > 0) {
                                ctx.fillText(line, padding, memoY + (lineCount * 50));
                                line = words[n];
                                lineCount++;
                                if (lineCount >= 3) break; // Limit to 3 lines
                            } else {
                                line = testLine;
                            }
                        }
                        if (lineCount < 3) {
                            ctx.fillText(line, padding, memoY + (lineCount * 50));
                        }
                    }

                    // 5. Save as Image
                    const dataUrl = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.download = `review-${Date.now()}.png`;
                    link.href = dataUrl;
                    link.click();

                    // Close modal after saving
                    modal.classList.remove('active');
                    setTimeout(() => modal.remove(), 300);
                };
            };
        };

        renderContent();
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    };
    reader.readAsDataURL(imageFile);
}

// Map Popup with Leaflet
function showMapPopup(scheduleId) {
    const schedule = getSchedule(scheduleId);
    if (!schedule) return;

    // Collect all coordinates in order
    const locations = [];
    schedule.days.forEach((day, dIdx) => {
        day.events?.forEach((event, eIdx) => {
            if (event.coords) {
                locations.push({
                    lat: event.coords.lat,
                    lng: event.coords.lng,
                    name: event.place || event.detail || `Day ${dIdx + 1}`,
                    day: dIdx + 1,
                    time: event.startTime || event.time || ''
                });
            }
        });
    });

    if (locations.length === 0) {
        showCustomAlert('저장된 위치 정보가 없습니다.<br>위치를 먼저 추가해 주세요!');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'map-popup-overlay';
    modal.innerHTML = `
        <div class="map-popup-container">
            <div class="map-popup-header">
                <h3>여행 경로 확인</h3>
                <button class="btn-close-map">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div id="map" class="map-content"></div>
            <div class="map-footer">
                저장된 ${locations.length}개의 포인트가 연결되었습니다.
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    const closeMap = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.btn-close-map').onclick = closeMap;

    // Load Leaflet dynamically
    loadLeaflet(() => {
        const map = L.map('map').setView([locations[0].lat, locations[0].lng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        const latlngs = locations.map(loc => [loc.lat, loc.lng]);

        // Add markers
        locations.forEach((loc, i) => {
            const marker = L.marker([loc.lat, loc.lng]).addTo(map);
            marker.bindPopup(`
                <div style="font-family: inherit; padding: 5px;">
                    <strong style="color: #45B8AF;">Day ${loc.day}</strong><br>
                    <strong>${loc.name}</strong><br>
                    <small>${loc.time}</small>
                </div>
            `);
            if (i === 0) marker.openPopup();
        });

        // Draw polyline
        const polyline = L.polyline(latlngs, {
            color: '#ff0000ff',
            weight: 4,
            opacity: 0.7,
            dashArray: '10, 10',
            lineJoin: 'round'
        }).addTo(map);

        // Zoom to fit
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    });
}

function loadLeaflet(callback) {
    if (window.L) {
        callback();
        return;
    }

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = callback;
    document.head.appendChild(script);
}

// Location Picker with Search
window.showLocationPicker = function (initialLat, initialLng, callback) {
    // 1. Create Modal UI
    const modal = document.createElement('div');
    modal.className = 'map-popup-overlay'; // Reuse map popup style
    modal.innerHTML = `
        <div class="map-popup-container">
            <div class="map-popup-header">
                <h3>위치 선택</h3>
                <button class="btn-close-map">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <!-- Search Bar -->
            <div class="map-search-bar" style="padding: 10px 15px; display: flex; gap: 8px; border-bottom: 1px solid #eee;">
                <input type="text" id="mapSearchInput" placeholder="장소 검색 (예: 프라하 성)" style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px;">
                <button id="btnMapSearch" style="padding: 8px 16px; background: #45B8AF; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">검색</button>
            </div>

            <div id="pickerMap" class="map-content" style="height: 300px;"></div>
            
            <div class="map-footer" style="display: flex; justify-content: space-between; align-items: center;">
                <span id="locationStatus" style="font-size: 12px; color: #666;">지도를 클릭하여 위치를 선택하세요</span>
                <button id="btnSelectLocation" style="padding: 8px 20px; background: #333; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">이 위치로 선택</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    let selectedCoords = null;
    let map = null;
    let marker = null;

    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.btn-close-map').onclick = closeModal;

    // Load Leaflet
    loadLeaflet(() => {
        // Default: Prague or provided coords
        const defaultLat = 50.0755;
        const defaultLng = 14.4378;

        let targetLat = initialLat || defaultLat;
        let targetLng = initialLng || defaultLng;

        map = L.map('pickerMap').setView([targetLat, targetLng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        // Marker Logic
        const updateMarker = (lat, lng) => {
            if (marker) {
                marker.setLatLng([lat, lng]);
            } else {
                marker = L.marker([lat, lng], { draggable: true }).addTo(map);

                // Handle Drag
                marker.on('dragend', (e) => {
                    const pos = e.target.getLatLng();
                    selectedCoords = { lat: pos.lat, lng: pos.lng };
                    document.getElementById('locationStatus').textContent = `선택됨: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`;
                });
            }
            selectedCoords = { lat, lng };
            map.panTo([lat, lng]);
            document.getElementById('locationStatus').textContent = `선택됨: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        };

        if (initialLat && initialLng) {
            updateMarker(initialLat, initialLng);
        } else if (navigator.geolocation && !initialLat) {
            // Try geolocation if no initial coords
            navigator.geolocation.getCurrentPosition((pos) => {
                updateMarker(pos.coords.latitude, pos.coords.longitude);
            }, () => {
                // Fail silently, stay at default
            }, { enableHighAccuracy: true });
        }

        // Map Click
        map.on('click', (e) => {
            updateMarker(e.latlng.lat, e.latlng.lng);
        });

        // Search Logic
        const handleSearch = () => {
            const query = document.getElementById('mapSearchInput').value.trim();
            if (!query) return;

            // Use local proxy to avoid CORS and add User-Agent
            fetch(`/api/nominatim/search?q=${encodeURIComponent(query)}&format=json`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        const lat = parseFloat(data[0].lat);
                        const lon = parseFloat(data[0].lon);
                        updateMarker(lat, lon);
                        map.setView([lat, lon], 15);
                    } else {
                        alert('장소를 찾을 수 없습니다.');
                    }
                })
                .catch(() => alert('검색 중 오류가 발생했습니다.'));
        };

        document.getElementById('btnMapSearch').onclick = handleSearch;
        document.getElementById('mapSearchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });

        // Confirm Selection
        document.getElementById('btnSelectLocation').onclick = () => {
            if (selectedCoords) {
                callback(selectedCoords);
                closeModal();
            } else {
                alert('위치를 선택해주세요.');
            }
        };

        // Invalidate size to fix rendering issues
        setTimeout(() => map.invalidateSize(), 200);
    });
};



// 앱 시작
init();
