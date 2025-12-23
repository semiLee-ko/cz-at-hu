// 여행 일정 목록 컴포넌트

import { getAllSchedules, deleteSchedule, setCurrentSchedule } from '../storage.js';

export function renderScheduleList(container, onSelect) {
    const schedules = getAllSchedules();

    container.innerHTML = `
        <div class="schedule-list-header">
            <h2>내 여행 일정</h2>
            <div style="display: flex; gap: 10px;">
                <button class="btn-secondary" id="btnImport" title="일정 가져오기">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    가져오기
                </button>
            </div>
        </div>
        
        <div class="schedule-cards">
            ${schedules.length === 0 ? `
                <div class="empty-state">
                    <p class="empty-hint">새 일정을 만들어보세요!</p>
                </div>
            ` : schedules.map(schedule => `
                <div class="schedule-card" data-id="${schedule.id}">
                    <div class="schedule-card-header">
                        <span class="schedule-tag ${schedule.tripType || 'domestic'}">
                            ${schedule.tripType === 'domestic' ? '국내여행' : '해외여행'}
                        </span>
                        <button class="btn-delete" data-id="${schedule.id}" title="삭제">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="schedule-content clickable" data-id="${schedule.id}">
                        <h3 class="schedule-title">${schedule.title}</h3>
                        <div class="schedule-info">
                            <svg class="info-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <span>${schedule.startDate} ~ ${schedule.endDate}</span>
                        </div>
                        <div class="schedule-info">
                            <svg class="info-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span>${schedule.countries ? schedule.countries.join(', ') : '대한민국'}</span>
                        </div>
                        ${schedule.tags && schedule.tags.length > 0 ? `
                            <div class="schedule-tags">
                                ${schedule.tags.map(tag => `<span class="hashtag">#${tag}</span>`).join(' ')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="schedule-actions">
                        <button class="btn-edit" data-id="${schedule.id}">수정</button>
                        <button class="btn-share" data-id="${schedule.id}">공유</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // 이벤트 리스너
    // 카드 내용 클릭 시 상세 보기
    container.querySelectorAll('.schedule-content').forEach(content => {
        content.addEventListener('click', () => {
            const id = content.dataset.id;
            setCurrentSchedule(id);
            onSelect('view', id);
        });
    });

    // 수정 버튼
    container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
            const id = btn.dataset.id;
            setCurrentSchedule(id);
            onSelect('edit', id);
        });
    });

    // 공유 버튼
    container.querySelectorAll('.btn-share').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            onSelect('share', id);
        });
    });

    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            if (confirm('이 일정을 삭제하시겠습니까?')) {
                deleteSchedule(id);
                renderScheduleList(container, onSelect);
            }
        });
    });

    const btnImport = container.querySelector('#btnImport');
    if (btnImport) {
        btnImport.addEventListener('click', () => {
            onSelect('import');
        });
    }
}
