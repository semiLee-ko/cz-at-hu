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

    // Initialize checklist interaction
    initChecklistInteraction(schedule);

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
                    <div class="tip-content-inner" style="margin-top:5px;">
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
// Initialize accordion functionality for day cards
function initDayAccordion() {
    const dayCards = document.querySelectorAll('.day-card, .day-card-under');
    dayCards.forEach(card => {
        const header = card.querySelector('.day-header');
        if (header) {
            header.addEventListener('click', () => {
                card.classList.toggle('collapsed');
            });
        }
    });

    initSpotlightMode();
}

// Spotlight & Itinerary Action Menu
function initSpotlightMode() {
    const eventGroups = document.querySelectorAll('.event-group');
    if (eventGroups.length === 0) return;

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
            <div class="action-item action-map" title="이동경로">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                    <line x1="8" y1="2" x2="8" y2="18"></line>
                    <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
            </div>
            <div class="action-item action-members" title="인원체크">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
            </div>
            <div class="action-item action-settlement" title="정산">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                    <line x1="12" y1="6" x2="12" y2="18"></line>
                </svg>
            </div>
        `;
        document.body.appendChild(actionBar);

        // --- NEW: Attach listeners ONLY ONCE when created ---
        // Location Picker Logic
        actionBar.querySelector('.action-location').addEventListener('click', () => {
            const activeGroup = document.querySelector('.event-group.active-spotlight');
            if (!activeGroup) return;

            const dayIdx = parseInt(activeGroup.dataset.dayIndex);
            const eventIdx = parseInt(activeGroup.dataset.eventIndex);
            const schedule = getCurrentSchedule();
            const targetEvent = schedule.days[dayIdx].events[eventIdx];

            if (targetEvent.coords) {
                showCustomConfirm('저장된 위치 정보를 삭제할까요?', () => {
                    delete targetEvent.coords;
                    saveSchedule(schedule);
                    updateActionStates(activeGroup);
                });
            } else {
                showCustomConfirm('현재 위치를 이 일정의 정보로 저장할까요?', () => {
                    if (!navigator.geolocation) {
                        alert('Geolocation을 지원하지 않는 브라우저입니다.');
                        return;
                    }

                    navigator.geolocation.getCurrentPosition((position) => {
                        targetEvent.coords = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            timestamp: new Date().toISOString()
                        };
                        saveSchedule(schedule);
                        updateActionStates(activeGroup);
                    }, (err) => {
                        showCustomAlert('위치 정보를 가져오는데 실패했습니다: ' + err.message);
                    }, {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    });
                });
            }
        });

        // Map Popup Logic
        actionBar.querySelector('.action-map').addEventListener('click', () => {
            showMapPopup();
        });

        // Member Selection Logic
        actionBar.querySelector('.action-members').addEventListener('click', () => {
            const activeGroup = document.querySelector('.event-group.active-spotlight');
            if (activeGroup) showMemberSelectionPopup(activeGroup, updateActionStates);
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
        const schedule = getCurrentSchedule();
        const dayIdx = group.dataset.dayIndex;
        const eventIdx = group.dataset.eventIndex;
        const firstEvent = schedule.days[dayIdx]?.events[eventIdx];

        const locationBtn = actionBar.querySelector('.action-location');
        if (firstEvent && firstEvent.coords) {
            locationBtn.classList.add('active-red');
        } else {
            locationBtn.classList.remove('active-red');
        }

        const membersBtn = actionBar.querySelector('.action-members');
        if (firstEvent && firstEvent.participants && firstEvent.participants.length > 0) {
            membersBtn.classList.add('active-blue');
        } else {
            membersBtn.classList.remove('active-blue');
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

// Member Selection Popup
function showMemberSelectionPopup(group, updateActionStatesCallback) {
    const schedule = getCurrentSchedule();
    if (!schedule) return;

    const dayIdx = parseInt(group.dataset.dayIndex);
    const eventIdx = parseInt(group.dataset.eventIndex);
    const targetEvent = schedule.days[dayIdx].events[eventIdx];

    // Get all trip members
    const allMembers = [
        ...(schedule.members?.adultList || []),
        ...(schedule.members?.childList || [])
    ];

    // Current participants
    let currentParticipants = targetEvent.participants || [];

    const modal = document.createElement('div');
    modal.className = 'member-selection-overlay';

    const renderContent = () => {
        const selected = currentParticipants;
        const available = allMembers.filter(m => !selected.includes(m));

        modal.innerHTML = `
            <div class="member-selection-container">
                <div class="member-selection-header">
                    <h3>참여 인원 선택</h3>
                    <button class="btn-close-members">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="member-selection-content">
                    <div class="selection-section">
                        <label>일정 참여자 <span class="count">${selected.length}</span></label>
                        <div class="member-list selected-list">
                            ${selected.length > 0 ? selected.map(name => `
                                <div class="member-chip active" data-name="${name}">
                                    ${name} <span class="chip-icon">×</span>
                                </div>
                            `).join('') : '<p class="empty-msg">목록에서 이름을 클릭해 추가하세요</p>'}
                        </div>
                    </div>
                    <div class="selection-section">
                        <label>전체 인원 <span class="count">${available.length}</span></label>
                        <div class="member-list available-list">
                            ${available.map(name => `
                                <div class="member-chip" data-name="${name}">
                                    ${name} <span class="chip-icon">+</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add events
        modal.querySelector('.btn-close-members').onclick = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelectorAll('.member-chip').forEach(chip => {
            chip.onclick = () => {
                const name = chip.dataset.name;
                if (currentParticipants.includes(name)) {
                    currentParticipants = currentParticipants.filter(p => p !== name);
                } else {
                    currentParticipants.push(name);
                }

                // Auto-save on every click
                targetEvent.participants = currentParticipants;
                saveSchedule(schedule);
                if (updateActionStatesCallback) updateActionStatesCallback(group);

                renderContent();
            };
        });
    };

    renderContent();
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

// Map Popup with Leaflet
function showMapPopup() {
    const schedule = getCurrentSchedule();
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
            color: '#45B8AF',
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

// 앱 시작
init();
