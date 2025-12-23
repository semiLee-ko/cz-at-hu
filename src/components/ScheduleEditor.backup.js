// 여행 일정 생성/편집 컴포넌트

import { saveSchedule, getSchedule } from '../storage.js';
import { createStepManager } from './editor/stepManager.js';
import { createAccommodationManager } from './editor/accommodationManager.js';
import { createChecklistManager } from './editor/checklistManager.js';

export function renderScheduleEditor(container, scheduleId, onSave, onCancel) {
    // 오늘 날짜 가져오기
    const today = new Date().toISOString().split('T')[0];

    const schedule = scheduleId ? getSchedule(scheduleId) : {
        title: '',
        tripType: 'international', // 'domestic' or 'international'
        tags: [],
        startDate: today,
        endDate: today,
        countries: [],
        members: { adults: 2, children: 0 },
        days: []
    };

    container.innerHTML = `
        <div class="editor-container">
            <div class="editor-header">
                <h2>${scheduleId ? '일정 수정' : '새 일정 만들기'}</h2>
                <button class="btn-close" id="btnCancel">✕</button>
            </div>
            
            <!-- Step Progress Indicator -->
            <div class="step-indicator">
                <div class="step-item active" data-step="1">
                    <div class="step-circle">1</div>
                    <div class="step-label">기본 정보</div>
                </div>
                <div class="step-line"></div>
                <div class="step-item" data-step="2">
                    <div class="step-circle">2</div>
                    <div class="step-label">일별 일정</div>
                </div>
                <div class="step-line"></div>
                <div class="step-item" data-step="3">
                    <div class="step-circle">3</div>
                    <div class="step-label">숙소 정보</div>
                </div>
                <div class="step-line"></div>
                <div class="step-item" data-step="4">
                    <div class="step-circle">4</div>
                    <div class="step-label">체크리스트</div>
                </div>
            </div>
            
            <form id="scheduleForm" class="schedule-form">
                <!-- Step 1: Basic Information -->
                <div class="form-step" data-step="1">
                    <div class="form-group">
                        <label>여행 제목 *</label>
                        <input type="text" name="title" value="${schedule.title}" 
                               placeholder="예: 동유럽 3국 가을 여행" required>
                    </div>
                    
                    <div class="form-group">
                        <label>여행 유형 *</label>
                        <div class="trip-type-selector">
                            <label class="radio-option">
                                <input type="radio" name="tripType" value="domestic" 
                                       ${schedule.tripType === 'domestic' ? 'checked' : ''}>
                                <span>국내 여행</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="tripType" value="international" 
                                       ${schedule.tripType === 'international' || !schedule.tripType ? 'checked' : ''}>
                                <span>해외 여행</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label id="locationLabel">
                            ${schedule.tripType === 'domestic' ? '도시' : '국가'} <span class="hint">(엔터로 추가)</span>
                        </label>
                        <div class="tags-container" id="locationsContainer">
                            ${(schedule.countries || []).map(location => `
                                <span class="tag-item location-tag">
                                    ${location}
                                    <button type="button" class="tag-remove" data-location="${location}">×</button>
                                </span>
                            `).join('')}
                        </div>
                        <input type="text" id="locationInput" class="tag-input" 
                               placeholder="${schedule.tripType === 'domestic' ? '예: 서울 (엔터)' : '예: 미국 (엔터)'}">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>시작일 *</label>
                            <input type="date" name="startDate" class="date-input" 
                                   value="${schedule.startDate}" 
                                   inputmode="numeric" 
                                   required>
                        </div>
                        <div class="form-group">
                            <label>종료일 *</label>
                            <input type="date" name="endDate" class="date-input" 
                                   value="${schedule.endDate}" 
                                   inputmode="numeric" 
                                   required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>성인</label>
                            <input type="number" name="adults" value="${schedule.members?.adults || 2}" min="0">
                        </div>
                        <div class="form-group">
                            <label>아동</label>
                            <input type="number" name="children" value="${schedule.members?.children || 0}" min="0">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>해시태그 <span class="hint">(엔터로 추가)</span></label>
                        <div class="tags-container" id="tagsContainer">
                            ${(schedule.tags || []).map(tag => `
                                <span class="tag-item">
                                    #${tag}
                                    <button type="button" class="tag-remove" data-tag="${tag}">×</button>
                                </span>
                            `).join('')}
                        </div>
                        <input type="text" id="tagInput" class="tag-input" placeholder="태그 입력 후 엔터">
                    </div>
                </div>
                
                <!-- Step 2: Daily Itinerary -->
                <div class="form-step" data-step="2" style="display: none;">
                    <div id="daysContainer">
                        <!-- Days will be generated dynamically -->
                    </div>
                </div>
                
                <!-- Step 3: Accommodation -->
                <div class="form-step" data-step="3" style="display: none;">
                    <div class="accommodation-section">
                        <h3 class="section-title">숙소 관리</h3>
                        
                        <!-- Accommodation Form -->
                        <div class="accommodation-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>숙소명 *</label>
                                    <input type="text" id="accName" placeholder="예: 힐튼 호텔">
                                </div>
                                <div class="form-group">
                                    <label>형태</label>
                                    <input type="text" id="accType" placeholder="예: 호텔, 캠핑, 게스트하우스">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>위치</label>
                                    <input type="text" id="accLocation" placeholder="예: 서울 강남구">
                                </div>
                                <div class="form-group">
                                    <label>연락처</label>
                                    <input type="text" id="accContact" placeholder="예: 02-1234-5678">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>가격</label>
                                    <input type="text" id="accPrice" placeholder="예: 150,000">
                                </div>
                                <div class="form-group">
                                    <label>URL</label>
                                    <input type="url" id="accUrl" placeholder="예: https://booking.com/...">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>입실시간</label>
                                    <input type="text" id="accCheckIn" list="time-options" placeholder="15:00">
                                </div>
                                <div class="form-group">
                                    <label>퇴실시간</label>
                                    <input type="text" id="accCheckOut" list="time-options" placeholder="11:00">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>메모</label>
                                <textarea id="accNotes" placeholder="추가 정보나 메모를 입력하세요" rows="3"></textarea>
                            </div>
                            
                            <button type="button" class="btn-add-accommodation" id="btnAddAccommodation">+ 숙소 추가</button>
                        </div>
                        
                        <!-- Accommodation List -->
                        <div class="accommodation-list" id="accommodationList">
                            <!-- Accommodations will be rendered here -->
                        </div>
                    </div>
                </div>
                
                <!-- Step 4: Checklist -->
                <div class="form-step" data-step="4" style="display: none;">
                    <div class="checklist-section">
                        <!-- Tab Navigation -->
                        <div class="checklist-tabs">
                            <button type="button" class="tab-btn active" data-tab="packing">준비물</button>
                            <button type="button" class="tab-btn" data-tab="todo">할 일</button>
                        </div>
                        
                        <!-- Packing Tab Content -->
                        <div class="tab-content active" data-tab-content="packing">
                            <div class="categories-container" id="packingCategories">
                                <!-- Categories will be rendered here -->
                            </div>
                            <button type="button" class="btn-add-category" data-tab="packing">+ 카테고리 추가</button>
                        </div>
                        
                        <!-- Todo Tab Content -->
                        <div class="tab-content" data-tab-content="todo">
                            <div class="categories-container" id="todoCategories">
                                <!-- Categories will be rendered here -->
                            </div>
                            <button type="button" class="btn-add-category" data-tab="todo">+ 카테고리 추가</button>
                        </div>
                    </div>
                </div>
                
                <!-- Navigation Buttons -->
                <div class="form-navigation">
                    <button type="button" class="btn-secondary" id="btnPrev" style="display: none;">← 이전</button>
                    <button type="button" class="btn-primary" id="btnNext">다음 →</button>
                    <button type="submit" class="btn-primary" id="btnSubmit" style="display: none;">저장</button>
                </div>
            </form>
        </div>
    `;

    // Step management
    let currentStep = 1;
    const totalSteps = 4;

    function updateStepUI() {
        // Update step indicator
        container.querySelectorAll('.step-item').forEach(item => {
            const step = parseInt(item.dataset.step);
            if (step < currentStep) {
                item.classList.add('completed');
                item.classList.remove('active');
            } else if (step === currentStep) {
                item.classList.add('active');
                item.classList.remove('completed');
            } else {
                item.classList.remove('active', 'completed');
            }
        });

        // Show/hide form steps
        container.querySelectorAll('.form-step').forEach(step => {
            step.style.display = parseInt(step.dataset.step) === currentStep ? 'block' : 'none';
        });

        // Update navigation buttons
        const btnPrev = container.querySelector('#btnPrev');
        const btnNext = container.querySelector('#btnNext');
        const btnSubmit = container.querySelector('#btnSubmit');

        btnPrev.style.display = currentStep > 1 ? 'inline-block' : 'none';
        btnNext.style.display = currentStep < totalSteps ? 'inline-block' : 'none';
        btnSubmit.style.display = currentStep === totalSteps ? 'inline-block' : 'none';
    }

    function nextStep() {
        if (currentStep < totalSteps) {
            // Moving to Step 2 - generate days from date range
            if (currentStep === 1) {
                const form = container.querySelector('#scheduleForm');
                const formData = new FormData(form);
                const startDate = formData.get('startDate');
                const endDate = formData.get('endDate');

                // Generate days and render Step 2
                const generatedDays = generateDaysFromDateRange(startDate, endDate, schedule.days || []);
                renderStep2(generatedDays, Array.from(locations), container);
            }

            // Moving to Step 3 - render accommodations
            if (currentStep === 2) {
                renderAccommodations();
            }

            // Moving to Step 4 - render checklists
            if (currentStep === 3) {
                renderChecklists('packing');
                renderChecklists('todo');
            }

            currentStep++;
            updateStepUI();
            container.querySelector('.schedule-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
            updateStepUI();
            container.querySelector('.schedule-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Navigation button events
    container.querySelector('#btnNext').addEventListener('click', nextStep);
    container.querySelector('#btnPrev').addEventListener('click', prevStep);

    // Accommodation management
    let accommodations = schedule.accommodations || [];
    let editingAccommodationId = null;

    function generateAccommodationId() {
        return 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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

    function getDayNumber(dateString) {
        const form = container.querySelector('#scheduleForm');
        const formData = new FormData(form);
        const startDate = new Date(formData.get('startDate'));
        const targetDate = new Date(dateString);
        const diffTime = targetDate - startDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
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

    // Add accommodation button event
    container.querySelector('#btnAddAccommodation')?.addEventListener('click', addOrUpdateAccommodation);

    // Checklist management
    let checklists = schedule.checklists || {
        packing: [],
        todo: []
    };
    let currentTab = 'packing';

    function generateCategoryId() {
        return 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function generateItemId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Tab switching
    function switchTab(tabName) {
        currentTab = tabName;

        // Update tab buttons
        container.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update tab content
        container.querySelectorAll('.tab-content').forEach(content => {
            if (content.dataset.tabContent === tabName) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }

    // Tab button events
    container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Render checklists
    function renderChecklists(tabName) {
        const categories = checklists[tabName];
        const containerId = tabName === 'packing' ? 'packingCategories' : 'todoCategories';
        const categoriesContainer = container.querySelector(`#${containerId}`);

        if (categories.length === 0) {
            categoriesContainer.innerHTML = '<p class="no-categories">카테고리를 추가해주세요</p>';
            return;
        }

        categoriesContainer.innerHTML = categories.map(category => `
            <div class="category-card" data-category-id="${category.id}">
                <div class="category-header">
                    <h4>${category.name}</h4>
                    <button type="button" class="btn-delete-category" data-category-id="${category.id}">삭제</button>
                </div>
                
                <div class="items-list">
                    ${category.items.map((item, index) => `
                        <div class="checklist-item ${item.checked ? 'checked' : ''}" data-item-id="${item.id}">
                            <div class="item-left">
                                <button type="button" class="btn-move-up" data-item-id="${item.id}" ${index === 0 ? 'disabled' : ''}>↑</button>
                                <button type="button" class="btn-move-down" data-item-id="${item.id}" ${index === category.items.length - 1 ? 'disabled' : ''}>↓</button>
                                <input type="checkbox" ${item.checked ? 'checked' : ''} data-item-id="${item.id}">
                                <span class="item-text">${item.text}</span>
                            </div>
                            <div class="item-right">
                                <select class="priority-select priority-${item.priority}" data-item-id="${item.id}">
                                    <option value="high" ${item.priority === 'high' ? 'selected' : ''}>상</option>
                                    <option value="medium" ${item.priority === 'medium' ? 'selected' : ''}>중</option>
                                    <option value="low" ${item.priority === 'low' ? 'selected' : ''}>하</option>
                                </select>
                                <button type="button" class="btn-delete-item" data-item-id="${item.id}">×</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="add-item-form">
                    <input type="text" class="item-input" placeholder="항목 입력" data-category-id="${category.id}">
                    <button type="button" class="btn-add-item" data-category-id="${category.id}">추가</button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        attachChecklistEventListeners(tabName);
    }

    function attachChecklistEventListeners(tabName) {
        const containerId = tabName === 'packing' ? 'packingCategories' : 'todoCategories';
        const categoriesContainer = container.querySelector(`#${containerId}`);

        // Delete category
        categoriesContainer.querySelectorAll('.btn-delete-category').forEach(btn => {
            btn.addEventListener('click', () => deleteCategory(tabName, btn.dataset.categoryId));
        });

        // Add item
        categoriesContainer.querySelectorAll('.btn-add-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = categoriesContainer.querySelector(`.item-input[data-category-id="${btn.dataset.categoryId}"]`);
                if (input.value.trim()) {
                    addItem(tabName, btn.dataset.categoryId, input.value.trim());
                    input.value = '';
                }
            });
        });

        // Add item on Enter
        categoriesContainer.querySelectorAll('.item-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && input.value.trim()) {
                    addItem(tabName, input.dataset.categoryId, input.value.trim());
                    input.value = '';
                }
            });
        });

        // Toggle checkbox
        categoriesContainer.querySelectorAll('.checklist-item input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => toggleItem(tabName, cb.dataset.itemId, cb.checked));
        });

        // Update priority
        categoriesContainer.querySelectorAll('.priority-select').forEach(select => {
            select.addEventListener('change', () => updatePriority(tabName, select.dataset.itemId, select.value));
        });

        // Delete item
        categoriesContainer.querySelectorAll('.btn-delete-item').forEach(btn => {
            btn.addEventListener('click', () => deleteItem(tabName, btn.dataset.itemId));
        });

        // Move item up
        categoriesContainer.querySelectorAll('.btn-move-up').forEach(btn => {
            btn.addEventListener('click', () => moveItem(tabName, btn.dataset.itemId, 'up'));
        });

        // Move item down
        categoriesContainer.querySelectorAll('.btn-move-down').forEach(btn => {
            btn.addEventListener('click', () => moveItem(tabName, btn.dataset.itemId, 'down'));
        });
    }

    function addCategory(tabName) {
        const categoryName = prompt('카테고리 이름을 입력하세요:');
        if (!categoryName || !categoryName.trim()) return;

        const newCategory = {
            id: generateCategoryId(),
            name: categoryName.trim(),
            items: []
        };

        checklists[tabName].push(newCategory);
        renderChecklists(tabName);
    }

    function deleteCategory(tabName, categoryId) {
        if (!confirm('이 카테고리를 삭제하시겠습니까?')) return;

        checklists[tabName] = checklists[tabName].filter(cat => cat.id !== categoryId);
        renderChecklists(tabName);
    }

    function addItem(tabName, categoryId, text) {
        const category = checklists[tabName].find(cat => cat.id === categoryId);
        if (!category) return;

        const newItem = {
            id: generateItemId(),
            text,
            priority: 'medium',
            checked: false,
            order: category.items.length
        };

        category.items.push(newItem);
        renderChecklists(tabName);
    }

    function deleteItem(tabName, itemId) {
        checklists[tabName].forEach(category => {
            category.items = category.items.filter(item => item.id !== itemId);
        });
        renderChecklists(tabName);
    }

    function toggleItem(tabName, itemId, checked) {
        checklists[tabName].forEach(category => {
            const item = category.items.find(item => item.id === itemId);
            if (item) item.checked = checked;
        });
        renderChecklists(tabName);
    }

    function updatePriority(tabName, itemId, priority) {
        checklists[tabName].forEach(category => {
            const item = category.items.find(item => item.id === itemId);
            if (item) item.priority = priority;
        });
        renderChecklists(tabName);
    }

    function moveItem(tabName, itemId, direction) {
        checklists[tabName].forEach(category => {
            const itemIndex = category.items.findIndex(item => item.id === itemId);
            if (itemIndex === -1) return;

            const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
            if (newIndex < 0 || newIndex >= category.items.length) return;

            // Swap items
            [category.items[itemIndex], category.items[newIndex]] =
                [category.items[newIndex], category.items[itemIndex]];
        });
        renderChecklists(tabName);
    }

    // Add category button events
    container.querySelectorAll('.btn-add-category').forEach(btn => {
        btn.addEventListener('click', () => addCategory(btn.dataset.tab));
    });

    // 여행 유형 변경 시 레이블 업데이트
    const tripTypeRadios = container.querySelectorAll('input[name="tripType"]');
    const locationLabel = container.querySelector('#locationLabel');
    const locationInput = container.querySelector('#locationInput');

    tripTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const isDomestic = e.target.value === 'domestic';
            const labelText = isDomestic ? '도시' : '국가';
            locationLabel.innerHTML = `${labelText} <span class="hint">(엔터로 추가)</span>`;
            locationInput.placeholder = isDomestic ? '예: 서울 (엔터)' : '예: 미국 (엔터)';
        });
    });

    // 위치 관리 (countries/cities)
    const locations = new Set(schedule.countries || []);
    const locationsContainer = container.querySelector('#locationsContainer');

    function addLocation(locationText) {
        const cleanLocation = locationText.trim();
        if (cleanLocation && !locations.has(cleanLocation)) {
            locations.add(cleanLocation);
            const locationElement = document.createElement('span');
            locationElement.className = 'tag-item location-tag';
            locationElement.innerHTML = `
                ${cleanLocation}
                <button type="button" class="tag-remove" data-location="${cleanLocation}">×</button>
            `;
            locationElement.querySelector('.tag-remove').addEventListener('click', () => {
                locations.delete(cleanLocation);
                locationElement.remove();
            });
            locationsContainer.appendChild(locationElement);
            locationInput.value = '';
        }
    }

    // 위치 입력 이벤트
    locationInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addLocation(locationInput.value);
        }
    });

    // 기존 위치 삭제 버튼
    container.querySelectorAll('.location-tag .tag-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const location = btn.dataset.location;
            locations.delete(location);
            btn.parentElement.remove();
        });
    });

    // 태그 관리
    const tags = new Set(schedule.tags || []);
    const tagInput = container.querySelector('#tagInput');
    const tagsContainer = container.querySelector('#tagsContainer');

    function addTag(tagText) {
        const cleanTag = tagText.replace(/^#/, '').trim();
        if (cleanTag && !tags.has(cleanTag)) {
            tags.add(cleanTag);
            const tagElement = document.createElement('span');
            tagElement.className = 'tag-item';
            tagElement.innerHTML = `
                #${cleanTag}
                <button type="button" class="tag-remove" data-tag="${cleanTag}">×</button>
            `;
            tagElement.querySelector('.tag-remove').addEventListener('click', () => {
                tags.delete(cleanTag);
                tagElement.remove();
            });
            tagsContainer.appendChild(tagElement);
            tagInput.value = '';
        }
    }

    // 태그 입력 이벤트
    tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(tagInput.value);
        }
    });

    // 자동 # 추가
    tagInput.addEventListener('input', (e) => {
        if (e.target.value && !e.target.value.startsWith('#')) {
            e.target.value = '#' + e.target.value;
        }
    });

    // 기존 태그 삭제 버튼
    container.querySelectorAll('.tag-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.dataset.tag;
            tags.delete(tag);
            btn.parentElement.remove();
        });
    });

    // 폼 제출
    const form = container.querySelector('#scheduleForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const newSchedule = {
            ...schedule,
            title: formData.get('title'),
            tripType: formData.get('tripType'),
            tags: Array.from(tags),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            countries: Array.from(locations),
            members: {
                adults: parseInt(formData.get('adults')) || 0,
                children: parseInt(formData.get('children')) || 0
            },
            days: collectDaysData(),
            accommodations: accommodations,
            checklists: checklists
        };

        const saved = saveSchedule(newSchedule);
        onSave(saved);
    });

    // 취소 버튼
    container.querySelector('#btnCancel').addEventListener('click', onCancel);
}

function renderDaysEditor(days = []) {
    if (days.length === 0) {
        return '<p class="hint">날짜를 추가해서 일정을 만들어보세요</p>';
    }
    return days.map((day, index) => createDayItem(index + 1, day)).join('');
}

function createDayItem(dayNum, day) {
    return `
        <div class="day-item">
            <div class="day-item-header">
                <strong>Day ${dayNum}</strong>
                <button type="button" class="btn-remove" onclick="this.parentElement.parentElement.remove()">삭제</button>
            </div>
            <input type="text" placeholder="날짜 (예: 10.02 금)" 
                   value="${day.date || ''}" data-field="date">
            <input type="text" placeholder="위치 (예: 프라하 도착 🇨🇿)" 
                   value="${day.location || ''}" data-field="location">
            <textarea placeholder="일정 (한 줄씩 입력)" rows="3" 
                      data-field="events">${day.events ? day.events.map(e => `${e.time} ${e.detail}`).join('\n') : ''}</textarea>
        </div>
    `;
}

function collectDaysData() {
    const dayCards = container.querySelectorAll('.day-card');
    const days = [];

    dayCards.forEach(dayCard => {
        const dayNum = parseInt(dayCard.dataset.day);
        const dayBadge = dayCard.querySelector('.day-badge').textContent;
        const dayDate = dayCard.querySelector('.day-date').textContent.split(' ')[0]; // Get just the date part

        const eventItems = dayCard.querySelectorAll('.event-item');
        const events = [];

        eventItems.forEach(eventItem => {
            // Get selected location from checkboxes
            const locationCheckbox = eventItem.querySelector('.location-checkboxes input[type="checkbox"]:checked');
            const location = locationCheckbox ? locationCheckbox.value : '';

            const place = eventItem.querySelector('.event-place').value;
            const startTime = eventItem.querySelector('.event-start-time').value;
            const endTime = eventItem.querySelector('.event-end-time').value;
            const description = eventItem.querySelector('.event-description').value;

            if (location || place || description) {
                events.push({
                    location,
                    place,
                    startTime,
                    endTime,
                    description
                });
            }
        });

        days.push({
            day: dayNum,
            date: dayDate,
            events
        });
    });

    return days;
}

// Helper functions for Step 2
function generateDaysFromDateRange(startDate, endDate, existingDays = []) {
    if (!startDate || !endDate) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = [];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    let currentDate = new Date(start);
    let dayNumber = 1;

    while (currentDate <= end) {
        const dateString = currentDate.toISOString().split('T')[0];
        const dayName = dayNames[currentDate.getDay()];

        // Check if we have existing data for this day
        const existingDay = existingDays.find(d => d.day === dayNumber);

        days.push({
            day: dayNumber,
            date: dateString,
            dayName: dayName,
            events: existingDay?.events || []
        });

        currentDate.setDate(currentDate.getDate() + 1);
        dayNumber++;
    }

    return days;
}

function generateTimeOptions() {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            options.push(timeString);
        }
    }
    return options;
}

// Render Step 2 with dynamic days
function renderStep2(days, locationsList, containerElement) {
    const daysContainer = containerElement.querySelector('#daysContainer');
    const timeOptions = generateTimeOptions();

    daysContainer.innerHTML = `
        <datalist id="time-options">
            ${timeOptions.map(time => `<option value="${time}">`).join('')}
        </datalist>
    ` + days.map((day, dayIndex) => `
        <div class="day-card" data-day="${day.day}">
            <div class="day-header" data-toggle="day">
                <div class="day-info">
                    <span class="day-badge">Day ${day.day}</span>
                    <span class="day-date">${day.date} (${day.dayName})</span>
                </div>
                <svg class="collapse-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            
            <div class="events-list" id="events-day-${day.day}">
                ${day.events.length > 0 ? day.events.map((event, eventIndex) =>
        renderEventItem(event, eventIndex, locationsList, timeOptions, day.day)
    ).join('') : '<p class="no-events">일정을 추가해주세요</p>'}
            </div>
            
            <button type="button" class="btn-add-event" data-day="${day.day}">+ 일정 추가</button>
        </div>
    `).join('');

    // Add collapse/expand functionality for day cards
    daysContainer.querySelectorAll('[data-toggle="day"]').forEach(header => {
        header.addEventListener('click', () => {
            const dayCard = header.closest('.day-card');
            const eventsList = dayCard.querySelector('.events-list');
            const addBtn = dayCard.querySelector('.btn-add-event');
            const icon = header.querySelector('.collapse-icon');

            dayCard.classList.toggle('collapsed');
            if (dayCard.classList.contains('collapsed')) {
                eventsList.style.display = 'none';
                addBtn.style.display = 'none';
                icon.innerHTML = '<path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
            } else {
                eventsList.style.display = 'block';
                addBtn.style.display = 'block';
                icon.innerHTML = '<path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
            }
        });
    });

    // Add event listeners for add/remove buttons
    daysContainer.querySelectorAll('.btn-add-event').forEach(btn => {
        btn.addEventListener('click', () => {
            const dayNum = parseInt(btn.dataset.day);
            addEventToDay(dayNum, locationsList, timeOptions, containerElement);
        });
    });

    // Add event listeners for existing remove buttons
    daysContainer.querySelectorAll('.btn-remove-event').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent collapse toggle
            btn.closest('.event-item').remove();
            // Check if no events left, show placeholder
            const dayNum = parseInt(btn.dataset.day);
            const eventsList = containerElement.querySelector(`#events-day-${dayNum}`);
            if (eventsList.querySelectorAll('.event-item').length === 0) {
                eventsList.innerHTML = '<p class="no-events">일정을 추가해주세요</p>';
            }
        });
    });

    // Add collapse/expand functionality for event items
    daysContainer.querySelectorAll('[data-toggle="event"]').forEach(header => {
        header.addEventListener('click', () => {
            const eventItem = header.closest('.event-item');
            const eventContent = eventItem.querySelector('.event-content');
            const icon = header.querySelector('.collapse-icon');

            eventItem.classList.toggle('collapsed');
            if (eventItem.classList.contains('collapsed')) {
                eventContent.style.display = 'none';
                icon.innerHTML = '<path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
            } else {
                eventContent.style.display = 'block';
                icon.innerHTML = '<path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
            }
        });
    });
}

function renderEventItem(event, eventIndex, locationsList, timeOptions, dayNum) {
    return `
        <div class="event-item">
            <div class="event-header" data-toggle="event">
                <span>일정 ${eventIndex + 1}</span>
                <div class="event-actions">
                    <svg class="collapse-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <button type="button" class="btn-remove-event" data-day="${dayNum}">삭제</button>
                </div>
            </div>
            
            <div class="event-content">
                <div class="form-group">
                    <label>도시/국가</label>
                    <div class="location-checkboxes">
                        ${locationsList.map(loc => `
                            <label class="checkbox-label">
                                <input type="checkbox" value="${loc}" ${event.location === loc ? 'checked' : ''}>
                                <span>${loc}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label>위치</label>
                    <input type="text" class="event-place" value="${event.place || ''}" placeholder="예: 프라하 공항">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>시작 시간</label>
                        <input type="text" class="event-start-time" value="${event.startTime || '09:00'}" 
                               list="time-options" placeholder="00:00">
                    </div>
                    <div class="form-group">
                        <label>종료 시간</label>
                        <input type="text" class="event-end-time" value="${event.endTime || '10:00'}" 
                               list="time-options" placeholder="00:00">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>내용</label>
                    <textarea class="event-description" placeholder="일정 내용 입력" rows="3">${event.description || ''}</textarea>
                </div>
            </div>
        </div>
    `;
}

function addEventToDay(dayNum, locationsList, timeOptions, containerElement) {
    const eventsList = containerElement.querySelector(`#events-day-${dayNum}`);
    const noEventsMsg = eventsList.querySelector('.no-events');
    if (noEventsMsg) {
        noEventsMsg.remove();
    }

    const eventCount = eventsList.querySelectorAll('.event-item').length;
    const newEvent = {
        location: locationsList[0] || '',
        place: '',
        startTime: '09:00',
        endTime: '10:00',
        description: ''
    };

    const eventHTML = renderEventItem(newEvent, eventCount, locationsList, timeOptions, dayNum);
    eventsList.insertAdjacentHTML('beforeend', eventHTML);

    // Add remove event listener to new item
    const newEventItem = eventsList.lastElementChild;
    const removeBtn = newEventItem.querySelector('.btn-remove-event');
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        newEventItem.remove();
        if (eventsList.querySelectorAll('.event-item').length === 0) {
            eventsList.innerHTML = '<p class="no-events">일정을 추가해주세요</p>';
        }
    });

    // Add collapse event listener to new item
    const eventHeader = newEventItem.querySelector('[data-toggle="event"]');
    eventHeader.addEventListener('click', () => {
        const eventContent = newEventItem.querySelector('.event-content');
        const icon = eventHeader.querySelector('.collapse-icon');

        newEventItem.classList.toggle('collapsed');
        if (newEventItem.classList.contains('collapsed')) {
            eventContent.style.display = 'none';
            icon.innerHTML = '<path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
        } else {
            eventContent.style.display = 'block';
            icon.innerHTML = '<path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
        }
    });
}


