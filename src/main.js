// 메인 애플리케이션 로직

import './style.css';
import './styles/tip-form.css';
import './styles/checklist-form.css';
import { getCurrentSchedule, getSchedule, setCurrentSchedule } from './storage.js';
import { loadFromShareUrl, uploadFromJson } from './share.js';
import { renderScheduleList } from './components/ScheduleList.js';
import { renderScheduleEditor } from './components/ScheduleEditor.js';
import { showShareModal, showImportModal } from './components/ShareModal.js';

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
                
                <!-- Toggle button positioned at bottom center -->
                <button class="stat-toggle-btn-floating" id="btnToggleCountries" aria-label="국가 목록 펼치기/접기">
                    <svg class="toggle-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
            </div>
            
            <div class="days-container entry-stagger-2">
                ${renderDays(schedule.days)}
            </div>
        </div>
    `;

    container.querySelector('#btnBack').addEventListener('click', () => showView('list'));
    container.querySelector('#btnEdit').addEventListener('click', () => showView('edit', schedule.id));
    container.querySelector('#btnShare').addEventListener('click', () => showShareModal(schedule.id));

    // Countries toggle functionality
    const toggleBtn = container.querySelector('#btnToggleCountries');
    const countriesValue = container.querySelector('#countriesValue');
    if (toggleBtn && countriesValue) {
        // Check if content exceeds 2 lines (approximately 3em with line-height 1.5)
        const checkHeight = () => {
            const lineHeight = parseFloat(getComputedStyle(countriesValue).lineHeight);
            const maxHeight = lineHeight * 2; // 2 lines
            const actualHeight = countriesValue.scrollHeight;

            if (actualHeight > maxHeight) {
                toggleBtn.style.display = 'flex'; // Show button
            } else {
                toggleBtn.style.display = 'none'; // Hide button
                countriesValue.classList.remove('collapsed'); // Ensure it's expanded if short
            }
        };

        // Check on load
        checkHeight();

        // Recheck on window resize (for orientation changes)
        window.addEventListener('resize', checkHeight);

        // Toggle functionality
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
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const nights = days - 1;
    return nights === 0 ? `무박 ${days}일` : `${nights}박 ${days}일`;
}

// 일별 일정 렌더링
function renderDays(days = []) {
    if (days.length === 0) {
        return '<div class="empty-state"><p>아직 일정이 없습니다</p></div>';
    }

    return days.map(day => `
        <div class="day-card">
            <div class="day-header">
                <div class="day-info">
                    <span class="day-badge">Day ${day.day}</span>
                    <span class="day-date">${(() => {
            const date = new Date(day.date);
            const month = date.getMonth() + 1;
            const dayNum = date.getDate();
            const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
            const dayName = dayNames[date.getDay()];
            return `${month}월 ${dayNum}일 (${dayName})`;
        })()}</span>
                </div>
                <svg class="collapse-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
            <div class="events-list-view tip-content-wrapper">
                <div class="tip-content-inner">
                ${day.events && day.events.length > 0 ? day.events.map((event, index) => `
                    ${index > 0 && event.startTime ? '<div class="event-divider"></div>' : ''}
                    <div class="event">
                        <div class="event-time-col">
                            ${event.startTime ? `
                                <span class="event-time-bullet"></span>
                                <span class="event-time-start">${event.startTime}</span>
                            ` : '<span class="event-time-spacer"></span>'}
                            <span class="event-time-dash">${event.startTime || event.endTime ? '-' : ''}</span>
                            <span class="event-time-end">${event.endTime || ''}</span>
                        </div>
                        <div class="event-detail-content">
                            <span class="event-place">${event.place || ''}</span>
                            <span class="event-desc">${event.description || ''}</span>
                        </div>
                    </div>
                `).join('') : '<div class="no-events">일정을 등록해 주세요</div>'}
            
                ${day.hotel ? `
                    <div class="hotel-info">
                        <div class="hotel-label">🛌 ACCOMMODATION</div>
                        <div class="hotel-name">${day.hotel.name}</div>
                        ${day.hotel.description ? `<div class="hotel-desc">${day.hotel.description}</div>` : ''}
                    </div>
                ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Initialize accordion functionality for day cards
function initDayAccordion() {
    const dayCards = document.querySelectorAll('.day-card');
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
