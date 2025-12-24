// Accommodation Management Module
// Handles adding, editing, and deleting accommodations in an accordion style

export function createAccommodationManager(container, schedule, generateDaysFromDateRange) {
    // Scope selectors to this specific step to avoid conflicts with other steps sharing same classes
    const stepRoot = container.querySelector('.form-step[data-step="3"]');

    let accommodations = schedule.accommodations || [];
    let editingAccommodationId = null;
    let draggedItem = null;
    let placeholder = null;

    function generateAccommodationId() {
        return 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function getDayNumber(dateString) {
        const form = container.querySelector('#scheduleForm');
        const formData = new FormData(form);
        const startDate = new Date(formData.get('startDate'));
        const targetDate = new Date(dateString);
        const diffTime = targetDate - startDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    }

    // Real-time validation for accommodation form
    function validateAccommodationForm() {
        if (!stepRoot) return;
        const nameInput = stepRoot.querySelector('#accName');
        const btnAdd = stepRoot.querySelector('#btnAddAccommodation');
        const btnContainer = stepRoot.querySelector('.tip-add-button-container');

        if (!nameInput || !btnAdd) return;

        const isValid = nameInput.value.trim().length > 0;
        btnAdd.disabled = !isValid;

        if (btnContainer) {
            btnContainer.classList.toggle('hidden', !isValid);
        }
    }

    function renderAccommodations() {
        if (!stepRoot) return;
        const accommodationList = stepRoot.querySelector('#accommodationList');
        if (!accommodationList) return;

        // 1. Render List
        if (accommodations.length === 0) {
            accommodationList.innerHTML = '<p class="no-events">등록된 숙소가 없습니다. 새 숙소를 추가해보세요.</p>';
        } else {
            accommodationList.innerHTML = accommodations.map(acc => `
            <div class="day-card tip-card collapsed" draggable="true" data-acc-id="${acc.id}">
                <div class="day-header" data-toggle="acc">
                    <div class="drag-handle" draggable="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="5 9 2 12 5 15"></polyline>
                            <polyline points="9 5 12 2 15 5"></polyline>
                            <polyline points="19 9 22 12 19 15"></polyline>
                            <polyline points="9 19 12 22 15 19"></polyline>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <line x1="12" y1="2" x2="12" y2="22"></line>
                        </svg>
                    </div>
                    <div class="day-info">
                        <span class="day-badge">${acc.type || '숙소'}</span>
                        <span class="day-date">${acc.name}</span>
                    </div>
                    <svg class="collapse-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
                <div class="events-list tip-content-wrapper">
                    <div class="tip-content-inner">
                        <div class="tip-body">
                            <div class="acc-details">
                                ${acc.location ? `<p class="acc-detail-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${acc.location}</p>` : ''}
                                ${acc.contact ? `<p class="acc-detail-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.21-2.21a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> ${acc.contact}</p>` : ''}
                                ${acc.price ? `<p class="acc-detail-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> ₩${Number(acc.price.replace(/,/g, '')).toLocaleString()}</p>` : ''}
                                ${acc.url ? `<p class="acc-detail-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg> <a href="${acc.url}" target="_blank" rel="noopener noreferrer">홈페이지</a></p>` : ''}
                                ${acc.checkIn || acc.checkOut ? `<p class="acc-detail-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> IN: ${acc.checkIn || '미지정'} / OUT: ${acc.checkOut || '미지정'}</p>` : ''}
                                ${acc.notes ? `<p class="acc-notes">${acc.notes}</p>` : ''}
                            </div>
                            
                            <div class="acc-actions">
                                <button type="button" class="btn-assign-dates" data-acc-id="${acc.id}" title="일정 선택">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                </button>
                                <button type="button" class="btn-delete-acc-icon" data-acc-id="${acc.id}" title="삭제">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </div>
                            
                            ${acc.assignedDates?.length > 0 ? `
                                <div class="assigned-dates-badges">
                                    ${acc.assignedDates.map(date => `<span class="date-badge">Day ${getDayNumber(date)}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // 2. Render Guide separately at the bottom
        const guideContainer = stepRoot.querySelector('#accommodationGuide');
        if (guideContainer) {
            guideContainer.style.display = 'flex';
            guideContainer.innerHTML = `
                <span class="guide-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </span>
                목록의 왼쪽 이동버튼을 끌어서 순서변경이 가능하고, 새 숙소 추가 영역에 끌어다 놓으면 수정이 가능합니다.
            `;
        }

        attachAccommodationEventListeners();
        clearAccommodationForm();
        validateAccommodationForm();
    }

    function attachAccommodationEventListeners() {
        if (!stepRoot) return;
        const accommodationList = stepRoot.querySelector('#accommodationList');
        const formSection = stepRoot.querySelector('.accommodation-form');

        accommodationList.querySelectorAll('.day-header').forEach(header => {
            if (!header.dataset.listenerAttached) {
                header.addEventListener('click', (e) => {
                    if (e.target.closest('.drag-handle')) return;
                    header.closest('.day-card').classList.toggle('collapsed');
                });
                header.dataset.listenerAttached = 'true';
            }
        });

        accommodationList.querySelectorAll('.btn-delete-acc-icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const accId = btn.dataset.accId || btn.closest('.btn-delete-acc-icon').dataset.accId;
                deleteAccommodation(accId);
            });
        });

        accommodationList.querySelectorAll('.btn-assign-dates').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const accId = btn.dataset.accId || btn.closest('.btn-assign-dates').dataset.accId;
                openDateModal(accId);
            });
        });

        attachDragEventListeners(accommodationList, formSection);
    }

    function attachDragEventListeners(accommodationList, formSection) {
        accommodationList.querySelectorAll('.drag-handle').forEach(handle => {
            handle.addEventListener('dragstart', (e) => {
                const item = handle.closest('.day-card');
                draggedItem = item;
                e.dataTransfer.setData('text/plain', item.dataset.accId);
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => item.classList.add('dragging'), 0);
                item.classList.add('collapsed');
            });
            handle.addEventListener('dragend', () => resetDragState(formSection));
        });

        accommodationList.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedItem) handleDragOverList(accommodationList, e.clientY);
        });

        accommodationList.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedItem) handleDropList(accommodationList);
        });

        if (formSection) {
            formSection.addEventListener('dragover', (e) => {
                e.preventDefault();
                formSection.classList.add('drag-over');
                e.dataTransfer.dropEffect = 'copy';
            });
            formSection.addEventListener('dragleave', () => formSection.classList.remove('drag-over'));
            formSection.addEventListener('drop', (e) => {
                e.preventDefault();
                handleDropForm(formSection, e.dataTransfer.getData('text/plain'));
            });
        }

        // Touch events
        accommodationList.querySelectorAll('.drag-handle').forEach(handle => {
            handle.addEventListener('touchstart', (e) => {
                if (e.cancelable) e.preventDefault();
                const item = handle.closest('.day-card');
                draggedItem = item;
                item.classList.add('dragging');
                item.classList.add('collapsed');
            }, { passive: false });
        });

        accommodationList.addEventListener('touchmove', (e) => {
            if (!draggedItem) return;
            if (e.cancelable) e.preventDefault();
            const touch = e.touches[0];
            const fingerEl = document.elementFromPoint(touch.clientX, touch.clientY);

            if (formSection && (formSection === fingerEl || formSection.contains(fingerEl))) {
                formSection.classList.add('drag-over');
                if (placeholder?.parentNode) placeholder.parentNode.removeChild(placeholder);
            } else {
                if (formSection) formSection.classList.remove('drag-over');
                handleDragOverList(accommodationList, touch.clientY);
            }
        }, { passive: false });

        accommodationList.addEventListener('touchend', (e) => {
            if (!draggedItem) return;
            if (formSection?.classList.contains('drag-over')) {
                handleDropForm(formSection, draggedItem.dataset.accId);
            } else {
                handleDropList(accommodationList);
            }
            resetDragState(formSection);
        });
    }

    function resetDragState(formSection) {
        draggedItem?.classList.remove('dragging');
        draggedItem = null;
        if (placeholder?.parentNode) placeholder.parentNode.removeChild(placeholder);
        formSection?.classList.remove('drag-over');
    }

    function handleDragOverList(container, clientY) {
        const afterEl = draggableElementsAfter(container, clientY);
        if (!placeholder) {
            placeholder = document.createElement('div');
            placeholder.className = 'sortable-placeholder';
            Object.assign(placeholder.style, {
                height: '50px',
                background: 'rgba(69, 184, 175, 0.1)',
                border: '2px dashed #45B8AF',
                margin: '0 0 12px 0',
                borderRadius: '6px'
            });
        }

        // Ensure afterEl is a child of container to prevent NotFoundError
        if (afterEl && afterEl.parentNode !== container) {
            console.warn('afterEl is not a child of container, appending to end');
            container.appendChild(placeholder);
        } else if (afterEl == null) {
            container.appendChild(placeholder);
        } else {
            container.insertBefore(placeholder, afterEl);
        }
    }

    function handleDropList(container) {
        if (!placeholder?.parentNode) return;
        container.insertBefore(draggedItem, placeholder);
        const newAccs = Array.from(container.querySelectorAll('.day-card'))
            .map(el => accommodations.find(a => a.id === el.dataset.accId))
            .filter(Boolean);
        accommodations.length = 0;
        accommodations.push(...newAccs);
        renderAccommodations();
    }

    function handleDropForm(formSection, accId) {
        formSection.classList.remove('drag-over');
        if (accId) {
            editAccommodation(accId);
            const inputs = formSection.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.style.backgroundColor = '#e6f7f6';
                setTimeout(() => input.style.backgroundColor = '', 500);
            });
        }
    }

    function draggableElementsAfter(container, y) {
        // Use container.children to only consider direct children
        const draggables = Array.from(container.children).filter(child =>
            child.classList.contains('day-card') && !child.classList.contains('dragging')
        );

        return draggables.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) return { offset, element: child };
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function addOrUpdateAccommodation() {
        if (!stepRoot) return;
        const name = stepRoot.querySelector('#accName').value.trim();
        const type = stepRoot.querySelector('#accType').value.trim();
        const location = stepRoot.querySelector('#accLocation').value.trim();
        const contact = stepRoot.querySelector('#accContact').value.trim();
        const price = stepRoot.querySelector('#accPrice').value.trim();
        const url = stepRoot.querySelector('#accUrl').value.trim();
        const checkIn = stepRoot.querySelector('#accCheckIn').value.trim();
        const checkOut = stepRoot.querySelector('#accCheckOut').value.trim();
        const notes = stepRoot.querySelector('#accNotes').value.trim();

        if (!name) return alert('숙소명을 입력해주세요.');

        const accData = { name, type, location, contact, price, url, checkIn, checkOut, notes };

        if (editingAccommodationId) {
            const index = accommodations.findIndex(a => a.id === editingAccommodationId);
            if (index !== -1) accommodations[index] = { ...accommodations[index], ...accData };
        } else {
            accommodations.push({ id: generateAccommodationId(), ...accData, assignedDates: [] });
        }
        renderAccommodations();
    }

    function editAccommodation(accId) {
        if (!stepRoot) return;
        const acc = accommodations.find(a => a.id === accId);
        if (!acc) return;

        editingAccommodationId = accId;
        stepRoot.querySelector('#accName').value = acc.name;
        stepRoot.querySelector('#accType').value = acc.type || '';
        stepRoot.querySelector('#accLocation').value = acc.location || '';
        stepRoot.querySelector('#accContact').value = acc.contact || '';
        stepRoot.querySelector('#accPrice').value = acc.price || '';
        stepRoot.querySelector('#accUrl').value = acc.url || '';
        stepRoot.querySelector('#accCheckIn').value = acc.checkIn || '';
        stepRoot.querySelector('#accCheckOut').value = acc.checkOut || '';
        stepRoot.querySelector('#accNotes').value = acc.notes || '';

        if (stepRoot.querySelector('#accFormTitle')) stepRoot.querySelector('#accFormTitle').textContent = '숙소 정보 수정';

        if (!stepRoot.querySelector('.btn-close-edit')) {
            const btnClose = document.createElement('button');
            btnClose.className = 'btn-close-edit';
            btnClose.type = 'button';
            btnClose.title = '편집 취소';
            btnClose.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            btnClose.addEventListener('click', clearAccommodationForm);
            stepRoot.querySelector('.accommodation-form')?.appendChild(btnClose);
        }
        stepRoot.querySelector('.accommodation-form').scrollIntoView({ behavior: 'smooth' });
        validateAccommodationForm();
    }

    function deleteAccommodation(accId) {
        if (confirm('이 숙소 정보를 삭제하시겠습니까?')) {
            accommodations = accommodations.filter(a => a.id !== accId);
            renderAccommodations();
        }
    }

    function openDateModal(accId) {
        const form = container.querySelector('#scheduleForm');
        const formData = new FormData(form);
        const startDate = formData.get('startDate');
        const endDate = formData.get('endDate');
        if (!startDate || !endDate) return alert('1단계에서 여행 날짜를 먼저 입력해주세요.');

        const days = generateDaysFromDateRange(startDate, endDate);
        const acc = accommodations.find(a => a.id === accId);
        const modalHTML = `
            <div class="date-modal-overlay" id="dateModal">
                <div class="date-modal-content">
                    <div class="date-modal-header">
                        <h3>일정 선택</h3>
                        <button type="button" class="btn-close-modal" id="btnCloseModal">×</button>
                    </div>
                    <div class="date-checkboxes">
                        ${days.map(day => `
                            <label class="date-checkbox-label">
                                <input type="checkbox" value="${day.date}" ${acc.assignedDates?.includes(day.date) ? 'checked' : ''}>
                                <span class="date-checkbox-text">Day ${day.day} - ${day.date} (${day.dayName})</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-modal-cancel" id="btnModalCancel">취소</button>
                        <button type="button" class="btn-modal-save" id="btnModalSave">저장</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('dateModal');
        modal.querySelector('#btnCloseModal').addEventListener('click', () => modal.remove());
        modal.querySelector('#btnModalCancel').addEventListener('click', () => modal.remove());
        modal.querySelector('#btnModalSave').addEventListener('click', () => {
            const selectedDates = Array.from(modal.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            const accIndex = accommodations.findIndex(a => a.id === accId);
            accommodations[accIndex].assignedDates = selectedDates;
            renderAccommodations();
            modal.remove();
        });
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }

    function clearAccommodationForm() {
        if (!stepRoot) return;
        const fields = ['#accName', '#accType', '#accLocation', '#accContact', '#accPrice', '#accUrl', '#accCheckIn', '#accCheckOut', '#accNotes'];
        fields.forEach(f => { if (stepRoot.querySelector(f)) stepRoot.querySelector(f).value = ''; });
        if (stepRoot.querySelector('#btnAddAccommodation')) stepRoot.querySelector('#btnAddAccommodation').disabled = true;
        stepRoot.querySelector('.tip-add-button-container')?.classList.add('hidden');
        editingAccommodationId = null;
        if (stepRoot.querySelector('#accFormTitle')) stepRoot.querySelector('#accFormTitle').textContent = '새 숙소 추가';
        stepRoot.querySelector('.btn-close-edit')?.remove();
    }

    // Direct event assignment scoped to stepRoot
    if (stepRoot) {
        stepRoot.querySelector('#accName')?.addEventListener('input', validateAccommodationForm);
        stepRoot.querySelector('#btnAddAccommodation')?.addEventListener('click', addOrUpdateAccommodation);
    }

    return {
        renderAccommodations,
        getAccommodations: () => accommodations
    };
}
