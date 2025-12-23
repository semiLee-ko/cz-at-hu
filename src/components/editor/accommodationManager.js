// Accommodation Management Module
// Handles all accommodation-related functionality

export function createAccommodationManager(container, schedule, generateDaysFromDateRange) {
    let accommodations = schedule.accommodations || [];
    let editingAccommodationId = null;

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

    function renderAccommodations() {
        const accommodationList = container.querySelector('#accommodationList');
        if (accommodations.length === 0) {
            accommodationList.innerHTML = '<p class="no-events">숙소를 추가해주세요</p>';
            return;
        }

        accommodationList.innerHTML = accommodations.map(acc => `
            <div class="accommodation-item" data-acc-id="${acc.id}">
                <div class="acc-header">
                    <div class="acc-info">
                        <h4>${acc.name}</h4>
                        <div class="acc-details">
                            ${acc.type ? `<div class="acc-detail-item"><span class="acc-detail-label">형태:</span> ${acc.type}</div>` : ''}
                            ${acc.location ? `<div class="acc-detail-item"><span class="acc-detail-label">위치:</span> ${acc.location}</div>` : ''}
                            ${acc.contact ? `<div class="acc-detail-item"><span class="acc-detail-label">연락처:</span> ${acc.contact}</div>` : ''}
                            ${acc.price ? `<div class="acc-detail-item"><span class="acc-detail-label">가격:</span> ₩${acc.price}</div>` : ''}
                            ${acc.url ? `<div class="acc-detail-item"><span class="acc-detail-label">URL:</span> <a href="${acc.url}" target="_blank" style="color: var(--secondary); text-decoration: underline;">${acc.url.length > 30 ? acc.url.substring(0, 30) + '...' : acc.url}</a></div>` : ''}
                            ${acc.checkIn ? `<div class="acc-detail-item"><span class="acc-detail-label">입실:</span> ${acc.checkIn}</div>` : ''}
                            ${acc.checkOut ? `<div class="acc-detail-item"><span class="acc-detail-label">퇴실:</span> ${acc.checkOut}</div>` : ''}
                        </div>
                        ${acc.notes ? `<p style="margin-top: 8px; color: var(--text-secondary); font-size: 0.9rem;">${acc.notes}</p>` : ''}
                        <div class="assigned-dates">
                            ${acc.assignedDates && acc.assignedDates.length > 0
                ? acc.assignedDates.map(date => `<span class="date-badge">Day ${getDayNumber(date)}</span>`).join('')
                : '<span class="no-dates">일정 미지정</span>'}
                        </div>
                    </div>
                    <div class="acc-actions">
                        <button class="btn-assign-dates" data-acc-id="${acc.id}">일정선택</button>
                        <button class="btn-edit-acc" data-acc-id="${acc.id}">수정</button>
                        <button class="btn-delete-acc" data-acc-id="${acc.id}">삭제</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners
        accommodationList.querySelectorAll('.btn-assign-dates').forEach(btn => {
            btn.addEventListener('click', () => openDateModal(btn.dataset.accId));
        });

        accommodationList.querySelectorAll('.btn-edit-acc').forEach(btn => {
            btn.addEventListener('click', () => editAccommodation(btn.dataset.accId));
        });

        accommodationList.querySelectorAll('.btn-delete-acc').forEach(btn => {
            btn.addEventListener('click', () => deleteAccommodation(btn.dataset.accId));
        });
    }

    function addOrUpdateAccommodation() {
        const name = container.querySelector('#accName').value.trim();
        if (!name) {
            alert('숙소명을 입력해주세요.');
            return;
        }

        const accommodation = {
            id: editingAccommodationId || generateAccommodationId(),
            name,
            type: container.querySelector('#accType').value.trim(),
            location: container.querySelector('#accLocation').value.trim(),
            contact: container.querySelector('#accContact').value.trim(),
            price: container.querySelector('#accPrice').value.trim(),
            url: container.querySelector('#accUrl').value.trim(),
            checkIn: container.querySelector('#accCheckIn').value.trim(),
            checkOut: container.querySelector('#accCheckOut').value.trim(),
            notes: container.querySelector('#accNotes').value.trim(),
            assignedDates: editingAccommodationId
                ? accommodations.find(a => a.id === editingAccommodationId)?.assignedDates || []
                : []
        };

        if (editingAccommodationId) {
            const index = accommodations.findIndex(a => a.id === editingAccommodationId);
            accommodations[index] = accommodation;
            editingAccommodationId = null;
        } else {
            accommodations.push(accommodation);
        }

        clearAccommodationForm();
        renderAccommodations();
    }

    function editAccommodation(accId) {
        const acc = accommodations.find(a => a.id === accId);
        if (!acc) return;

        editingAccommodationId = accId;
        container.querySelector('#accName').value = acc.name || '';
        container.querySelector('#accType').value = acc.type || '';
        container.querySelector('#accLocation').value = acc.location || '';
        container.querySelector('#accContact').value = acc.contact || '';
        container.querySelector('#accPrice').value = acc.price || '';
        container.querySelector('#accUrl').value = acc.url || '';
        container.querySelector('#accCheckIn').value = acc.checkIn || '';
        container.querySelector('#accCheckOut').value = acc.checkOut || '';
        container.querySelector('#accNotes').value = acc.notes || '';

        container.querySelector('#btnAddAccommodation').textContent = '수정 완료';
        container.querySelector('.accommodation-form').scrollIntoView({ behavior: 'smooth' });
    }

    function deleteAccommodation(accId) {
        if (!confirm('이 숙소를 삭제하시겠습니까?')) return;

        accommodations = accommodations.filter(a => a.id !== accId);
        renderAccommodations();
    }

    function clearAccommodationForm() {
        container.querySelector('#accName').value = '';
        container.querySelector('#accType').value = '';
        container.querySelector('#accLocation').value = '';
        container.querySelector('#accContact').value = '';
        container.querySelector('#accPrice').value = '';
        container.querySelector('#accUrl').value = '';
        container.querySelector('#accCheckIn').value = '';
        container.querySelector('#accCheckOut').value = '';
        container.querySelector('#accNotes').value = '';
        container.querySelector('#btnAddAccommodation').textContent = '+ 숙소 추가';
        editingAccommodationId = null;
    }

    function openDateModal(accId) {
        const form = container.querySelector('#scheduleForm');
        const formData = new FormData(form);
        const startDate = formData.get('startDate');
        const endDate = formData.get('endDate');

        if (!startDate || !endDate) {
            alert('1단계에서 여행 날짜를 먼저 입력해주세요.');
            return;
        }

        const days = generateDaysFromDateRange(startDate, endDate);
        const acc = accommodations.find(a => a.id === accId);

        const modalHTML = `
            <div class="date-modal-overlay" id="dateModal">
                <div class="date-modal-content">
                    <div class="date-modal-header">
                        <h3>일정 선택</h3>
                        <button class="btn-close-modal" id="btnCloseModal">×</button>
                    </div>
                    <div class="date-checkboxes">
                        ${days.map(day => `
                            <label class="date-checkbox-label">
                                <input type="checkbox" value="${day.date}" 
                                       ${acc.assignedDates?.includes(day.date) ? 'checked' : ''}>
                                <span class="date-checkbox-text">Day ${day.day} - ${day.date} (${day.dayName})</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="modal-actions">
                        <button class="btn-modal-cancel" id="btnModalCancel">취소</button>
                        <button class="btn-modal-save" id="btnModalSave">저장</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('dateModal');

        document.getElementById('btnCloseModal').addEventListener('click', () => modal.remove());
        document.getElementById('btnModalCancel').addEventListener('click', () => modal.remove());

        document.getElementById('btnModalSave').addEventListener('click', () => {
            const selectedDates = Array.from(modal.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value);

            const accIndex = accommodations.findIndex(a => a.id === accId);
            accommodations[accIndex].assignedDates = selectedDates;

            renderAccommodations();
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // Initialize event listener
    container.querySelector('#btnAddAccommodation')?.addEventListener('click', addOrUpdateAccommodation);

    return {
        renderAccommodations,
        getAccommodations: () => accommodations
    };
}
