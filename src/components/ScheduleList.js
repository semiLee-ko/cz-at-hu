// 여행 일정 목록 컴포넌트

import { getAllSchedules, deleteSchedule, setCurrentSchedule, getSchedule } from '../storage.js';
import { showShareModal } from './ShareModal.js';
import { showChatBot } from './ChatBot.js';
import { showCustomConfirm } from '../utils/modalUtils.js';

export function renderScheduleList(container, onSelect) {
    const schedules = getAllSchedules();


    container.innerHTML = `
        <div class="page-transition">
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
                ` : schedules.map((schedule, index) => `
                    <div class="schedule-card" data-id="${schedule.id}" style="animation-delay: ${index * 0.05}s">
                        <div class="schedule-card-header">
                            <span class="schedule-tag ${schedule.tripType || 'domestic'}">
                                ${schedule.tripType === 'domestic' ? '국내여행' : '해외여행'}
                            </span>
                            <div class="card-actions">
                                <button class="btn-icon-action btn-chat-icon" data-id="${schedule.id}" title="챗봇">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                                        <circle cx="12" cy="5" r="2"></circle>
                                        <path d="M12 7v4"></path>
                                        <line x1="8" y1="16" x2="8" y2="16"></line>
                                        <line x1="16" y1="16" x2="16" y2="16"></line>
                                    </svg>
                                </button>
                                <button class="btn-icon-action btn-share-icon" data-id="${schedule.id}" title="공유">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="18" cy="5" r="3"></circle>
                                        <circle cx="6" cy="12" r="3"></circle>
                                        <circle cx="18" cy="19" r="3"></circle>
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                    </svg>
                                </button>
                                <button class="btn-icon-action btn-edit-icon" data-id="${schedule.id}" title="수정">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                                <button class="btn-icon-action btn-delete-icon" data-id="${schedule.id}" title="삭제">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </div>
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
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Event Listeners
    container.querySelectorAll('.clickable').forEach(el => {
        el.addEventListener('click', () => {
            onSelect('view', el.dataset.id);
        });
    });

    container.querySelectorAll('.btn-edit-icon').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onSelect('edit', btn.dataset.id);
        });
    });

    container.querySelectorAll('.btn-delete-icon').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showCustomConfirm('정말 삭제하시겠습니까?', () => {
                deleteSchedule(btn.dataset.id);
                renderScheduleList(container, onSelect);
            });
        });
    });

    container.querySelectorAll('.btn-share-icon').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showShareModal(btn.dataset.id);
        });
    });

    container.querySelectorAll('.btn-chat-icon').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const schedule = getSchedule(btn.dataset.id);
            if (schedule) {
                showChatBot(schedule);
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
