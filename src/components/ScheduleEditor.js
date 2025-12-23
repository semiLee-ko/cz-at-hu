// 여행 일정 생성/편집 컴포넌트

import { saveSchedule, getSchedule } from '../storage.js';
import { createStepManager } from './editor/stepManager.js';
import { createAccommodationManager } from './editor/accommodationManager.js';
import { createChecklistManager } from './editor/checklistManager.js';
import { createTipManager } from './editor/tipManager.js';

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
            <!-- Step Progress Indicator -->
            <div class="step-indicator">
                <div class="step-item active" data-step="1">
                    <div class="step-circle">1</div>
                    <div class="step-label">기본<br />정보</div>
                </div>
                <div class="step-line"></div>
                <div class="step-item" data-step="2">
                    <div class="step-circle">2</div>
                    <div class="step-label">일별<br />일정</div>
                </div>
                <div class="step-line"></div>
                <div class="step-item" data-step="3">
                    <div class="step-circle">3</div>
                    <div class="step-label">숙소<br />정보</div>
                </div>
                <div class="step-line"></div>
                <div class="step-item" data-step="4">
                    <div class="step-circle">4</div>
                    <div class="step-label">체크<br />리스트</div>
                </div>
                <div class="step-line"></div>
                <div class="step-item" data-step="5">
                    <div class="step-circle">5</div>
                    <div class="step-label">팁<br />작성</div>
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
                        <div class="tags-container" id="locationsContainer" style="${(schedule.countries && schedule.countries.length > 0) ? '' : 'display: none;'}">
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
                        <label>여행 테마</label>
                        <select name="theme" class="form-select" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;">
                            <option value="default" ${!schedule.theme ? 'selected' : ''}>테마 선택 안함</option>
                            <option value="solo" ${schedule.theme === 'solo' ? 'selected' : ''}>홀로여행</option>
                            <option value="friends" ${schedule.theme === 'friends' ? 'selected' : ''}>우정여행</option>
                            <option value="couple" ${schedule.theme === 'couple' ? 'selected' : ''}>커플여행</option>
                            <option value="family" ${schedule.theme === 'family' ? 'selected' : ''}>가족여행</option>
                            <option value="babymoon" ${schedule.theme === 'babymoon' ? 'selected' : ''}>태교여행</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>해시태그 <span class="hint">(엔터로 추가)</span></label>
                        <div class="tags-container" id="tagsContainer" style="${(schedule.tags && schedule.tags.length > 0) ? '' : 'display: none;'}">
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

                <!-- Step 5: Tips -->
                <div class="form-step" data-step="5" style="display: none;">
                    <div class="tip-section">
                        <h3 class="section-title">팁 & 유의사항</h3>
                        <p class="section-subtitle">여행에 필요한 유용한 정보나 주의할 점을 기록하세요.</p>
                        
                        <!-- Tip Form -->
                         <div class="tip-form-section">
                            <h4 id="tipFormTitle">새 팁 작성</h4>
                            <div class="form-group">
                                <label>제목</label>
                                <input type="text" id="tipTitle" placeholder="예: 환전 팁, 대중교통 이용법">
                            </div>
                            <div class="form-group">
                                <label>내용</label>
                                <textarea id="tipContent" placeholder="상세 내용을 입력하세요" rows="4"></textarea>
                            </div>
                            <div style="display: flex; align-items: center;">
                                <button type="button" class="btn-primary" id="btnAddTip" style="padding: 0.6rem 1.2rem; margin-top: 0;">+ 팁 추가</button>
                            </div>
                        </div>

                        <!-- Tips List (Accordion) -->
                        <div id="tipsContainer" class="tip-list">
                            <!-- Tips will be rendered here -->
                        </div>
                    </div>
                </div>
                
                <!-- Navigation Buttons -->
                <div class="form-navigation">
                    <button type="button" class="btn-secondary" id="btnCancel">취소</button>
                    <button type="button" class="btn-secondary" id="btnPrev" style="display: none;">이전</button>
                    <button type="button" class="btn-primary" id="btnNext">다음</button>
                    <button type="submit" class="btn-primary" id="btnSubmit" style="display: none;">저장</button>
                </div>
            </form>
        </div>
    `;

    // Tag management
    const tags = new Set(schedule.tags || []);
    const locations = new Set(schedule.countries || []);

    // Initialize managers
    const stepManager = createStepManager(container, schedule, locations);
    const accommodationManager = createAccommodationManager(container, schedule, stepManager.generateDaysFromDateRange);
    const checklistManager = createChecklistManager(container, schedule);
    const tipManager = createTipManager(container, schedule);

    // Initial render
    stepManager.updateStepUI();

    // Navigation button events
    // REPLACED standard next/prev with goToStep usage for buttons too, or keep them but update UI
    container.querySelector('#btnNext').addEventListener('click', () => {
        stepManager.goToStep(stepManager.currentStep + 1, {
            renderStep2: () => renderStep2(stepManager.generateDaysFromDateRange(container.querySelector('input[name="startDate"]').value, container.querySelector('input[name="endDate"]').value, schedule.days), Array.from(locations), container),
            renderAccommodations: () => accommodationManager.renderAccommodations(),
            renderChecklists: (tab) => checklistManager.renderChecklists(tab),
            renderTips: () => tipManager.renderTips()
        });
        updateStatus(); // Update status after move
    });
    container.querySelector('#btnPrev').addEventListener('click', () => {
        stepManager.goToStep(stepManager.currentStep - 1);
        updateStatus();
    });
    container.querySelector('#btnCancel').addEventListener('click', onCancel);

    // --- NEW: Step Status & Navigation Logic ---

    function getStepStatuses() {
        const statuses = {};
        const form = container.querySelector('#scheduleForm');
        const formData = new FormData(form);

        // Step 1: Basic Info Validation
        const title = formData.get('title');
        const startDate = formData.get('startDate');
        const endDate = formData.get('endDate');
        const hasLocations = locations.size > 0;

        const isStep1Valid = title && startDate && endDate && hasLocations;
        statuses[1] = isStep1Valid ? 'valid' : 'invalid'; // Mandatory

        // Step 2: Days (Optional)
        // We need to check if ANY event exists in the collected days data OR existing schedule logic
        // For accurate real-time check, we might need to look at DOM or internal state
        // Here we just check if days are generated and likely have events. 
        // A better check: check DOM for events or use collected data. 
        // Since Step 2 is rendered dynamically, we check the DOM if visible, or fallback to schedule data?
        // Let's check schedule.days if we are not on step 2, or DOM if we are? 
        // Simpler: Check schedule.days length and events count.
        // NOTE: schedule object is NOT auto-updated until save. 
        // So we rely on "Valid" (Mint) meaning "User has visited/added something"?
        // Plan said: "Check if any data exists. Return 'valid' if yes, 'empty' if no."
        // We'll treat this loosely for now. If events exist > valid.
        // But since we can't easily peek into un-rendered DOMs for other steps, we rely on manager's state if possible.
        // Managers (accommodationManager, etc.) usually keep state in DOM or internal array.
        // accommodationManager exposes .getAccommodations(). 
        // checklistManager .getChecklists().
        // tipManager .getTips().

        // However, days are tricky as they are generated on fly. 
        // We'll check the DOM for Step 2 if rendered, else rely on schedule.days (saved state).
        // This might be slightly out of sync if user edits but doesn't save? 
        // Actually, we are in ONE editing session. We should assume managers hold the truth.
        // Step 2 logic is embedded in ScheduleEditor. 
        // Let's check container for .event-item
        const hasEvents = container.querySelectorAll('.event-item').length > 0 || (schedule.days && schedule.days.some(d => d.events.length > 0));
        statuses[2] = hasEvents ? 'valid' : 'empty';

        // Step 3: Accommodations
        const accs = accommodationManager.getAccommodations();
        statuses[3] = (accs && accs.length > 0) ? 'valid' : 'empty';

        // Step 4: Checklists
        const checks = checklistManager.getChecklists();
        const hasChecks = (checks.packing && checks.packing.length > 0) || (checks.todo && checks.todo.length > 0);
        statuses[4] = hasChecks ? 'valid' : 'empty';

        // Step 5: Tips
        const tips = tipManager.getTips();
        statuses[5] = (tips && tips.length > 0) ? 'valid' : 'empty';

        return statuses;
    }

    function updateStatus() {
        stepManager.updateStepUI(getStepStatuses());
    }

    // Attach Click Handlers to Step Indicators (Tab Navigation)
    container.querySelectorAll('.step-item').forEach(item => {
        item.addEventListener('click', () => {
            const targetStep = parseInt(item.dataset.step);

            // Define callbacks for rendering
            const callbacks = {
                onLeaveStep1: () => {
                    // Collect Step 1 data if needed, or just rely on form state
                    // generateDays logic is called in goToStep target check if we want, 
                    // but stepManager.js calls renderStep2Callback.
                },
                renderStep2: () => renderStep2(stepManager.generateDaysFromDateRange(
                    container.querySelector('input[name="startDate"]').value,
                    container.querySelector('input[name="endDate"]').value,
                    container.querySelectorAll('.day-card').length > 0 ? collectDaysData(container) : schedule.days // Preserve current edits if re-rendering? 
                    // Actually generateDays... merges existing. 
                    // We should pass potentially modified 'days'.
                    // But collectDaysData reads DOM. If Step 2 is not visible, it returns nothing?
                    // Wait, if we jump 1->3, Step 2 is skipped. 
                    // If we jump 2->3, we should probably save Step 2 state? 
                    // `schedule` object is local to this editor. We should update `schedule.days`?
                    // For simplicity in this refactor, we pass `schedule.days` (original) merged with dates.
                    // Events added in Step 2 are in DOM only until save! 
                    // This is a risk. If user goes 2 -> 1 -> 2, they might lose events if we re-render from schedule.days?
                    // stepManager.generateDaysFromDateRange merges `existingDays`.
                    // We must insure `schedule.days` is up to date OR pass current DOM state.
                    // FIX: If we leave Step 2, we must capture its state!
                ), Array.from(locations), container),

                renderAccommodations: () => accommodationManager.renderAccommodations(),
                renderChecklists: (tab) => checklistManager.renderChecklists(tab),
                renderTips: () => tipManager.renderTips()
            };

            // Before moving, if we are on Step 2, capture days data to `schedule.days` so it's preserved
            if (stepManager.currentStep === 2) {
                schedule.days = collectDaysData(container);
            }

            stepManager.goToStep(targetStep, callbacks);
            updateStatus();
        });
    });

    // Real-time Validation Listeners
    // Step 1 Inputs
    const inputsStep1 = container.querySelectorAll('input[name="title"], input[name="startDate"], input[name="endDate"]');
    inputsStep1.forEach(input => {
        input.addEventListener('input', updateStatus);
        input.addEventListener('change', updateStatus); // Date inputs
    });

    // Locations/Tags observers
    // We already have addLocation/removeLocation. We should call updateStatus there.
    // We'll hook into them below.

    // Initial Status Update
    updateStatus();

    // ------------------------------------

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
                if (locationsContainer.children.length === 0) {
                    locationsContainer.style.display = 'none';
                }
                updateStatus(); // Update status on remove
            });
            locationsContainer.appendChild(locationElement);
            locationsContainer.style.display = 'flex';
            locationInput.value = '';

            updateStatus(); // Update status on add
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
            if (locationsContainer.children.length === 0) {
                locationsContainer.style.display = 'none';
            }
            updateStatus(); // Update status on existing remove
        });
    });

    // 태그 관리
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
                if (tagsContainer.children.length === 0) {
                    tagsContainer.style.display = 'none';
                }
            });
            tagsContainer.appendChild(tagElement);
            tagsContainer.style.display = 'flex';
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
            if (tagsContainer.children.length === 0) {
                tagsContainer.style.display = 'none';
            }
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
            theme: formData.get('theme'),
            tags: Array.from(tags),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            countries: Array.from(locations),
            members: {
                adults: parseInt(formData.get('adults')) || 0,
                children: parseInt(formData.get('children')) || 0
            },
            days: collectDaysData(container),
            accommodations: accommodationManager.getAccommodations(),
            checklists: checklistManager.getChecklists(),
            tips: tipManager.getTips()
        };

        const saved = saveSchedule(newSchedule);
        onSave(saved);
    });

    // 취소 버튼
    container.querySelector('#btnCancel').addEventListener('click', onCancel);

    // Render Step 2 Helper Functions

    function collectDaysData(container) {
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

    function renderStep2(days, locationsList, containerElement) {
        const daysContainer = containerElement.querySelector('#daysContainer');
        const timeOptions = stepManager.generateTimeOptions(); // Use shared helper

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

}
