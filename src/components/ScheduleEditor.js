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
            <!-- Header: Back & Save -->
            <header class="editor-header-nav">
                <button type="button" class="btn-icon" id="btnEditorBack">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <h2 class="editor-title">${scheduleId ? '일정 수정' : '새 일정'}</h2>
                <button type="button" class="btn-icon btn-save disabled" id="btnEditorSave">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </button>
            </header>

            <form id="scheduleForm" class="schedule-form">
                <!-- Step 1: Basic Information -->
                <div class="form-step" data-step="1">
                    <div class="form-group">
                        <label>제목</label>
                        <input type="text" name="title" value="${schedule.title}" 
                               placeholder="예: 동유럽 3국 가을 여행" required maxlength="20">
                        <div class="error-message" id="titleError"></div>
                    </div>
                    
                    <div class="form-group">
                        <label>유형</label>
                        <div class="trip-type-selector">
                            <label class="radio-option">
                                <input type="radio" name="tripType" value="domestic" 
                                       ${schedule.tripType === 'domestic' ? 'checked' : ''}>
                                <span>국내</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="tripType" value="international" 
                                       ${schedule.tripType === 'international' || !schedule.tripType ? 'checked' : ''}>
                                <span>해외</span>
                            </label>
                        </div>
                    </div>
                    
                        <div class="form-group">
                            <label id="locationLabel">
                                ${schedule.tripType === 'domestic' ? '도시' : '국가'} <span class="hint"> (입력 후 엔터)</span>
                            </label>
                            <input type="text" id="locationInput" class="tag-input" 
                                   placeholder="${schedule.tripType === 'domestic' ? '예: 서울 (입력 후 엔터)' : '예: 미국 (입력 후 엔터)'}" 
                                   maxlength="10" enterkeyhint="done">
                            <div class="error-message" id="locationError"></div>
                            <div class="tags-container" id="locationsContainer" style="${(schedule.countries && schedule.countries.length > 0) ? '' : 'display: none;'}">
                                ${(schedule.countries || []).map(location => `
                                    <span class="tag-item location-tag">
                                        ${location}
                                        <button type="button" class="tag-remove" data-location="${location}">×</button>
                                    </span>
                                `).join('')}
                            </div>
                        </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>시작일</label>
                            <div class="date-input-wrapper">
                                <input type="date" name="startDate" class="date-input" 
                                       value="${schedule.startDate}" 
                                       onkeydown="return false;"
                                       onclick="if(this.showPicker) this.showPicker()"
                                       required>
                                <svg class="calendar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>종료일</label>
                            <div class="date-input-wrapper">
                                <input type="date" name="endDate" class="date-input" 
                                       value="${schedule.endDate}" 
                                       onkeydown="return false;"
                                       onclick="if(this.showPicker) this.showPicker()"
                                       required>
                                <svg class="calendar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>성인 <span id="adultCountLabel" class="count-badge">(0명)</span> <span class="hint">(입력 후 엔터)</span></label>
                            <input type="text" id="adultInput" placeholder="이름 입력" maxlength="10" enterkeyhint="done">
                            <div class="error-message" id="adultError"></div>
                            <div class="tags-container" id="adultsContainer" style="display: none;"></div>
                        </div>
                        <div class="form-group">
                            <label>아동 <span id="childCountLabel" class="count-badge">(0명)</span> <span class="hint">(입력 후 엔터)</span></label>
                            <input type="text" id="childInput" placeholder="이름 입력" maxlength="10" enterkeyhint="done">
                            <div class="error-message" id="childError"></div>
                            <div class="tags-container" id="childrenContainer" style="display: none;"></div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>여행 테마</label>
                        <select name="theme" class="form-select">
                            <option value="default" ${!schedule.theme ? 'selected' : ''}>테마 선택 안함</option>
                            <option value="solo" ${schedule.theme === 'solo' ? 'selected' : ''}>홀로여행</option>
                            <option value="friends" ${schedule.theme === 'friends' ? 'selected' : ''}>우정여행</option>
                            <option value="couple" ${schedule.theme === 'couple' ? 'selected' : ''}>커플여행</option>
                            <option value="family" ${schedule.theme === 'family' ? 'selected' : ''}>가족여행</option>
                            <option value="babymoon" ${schedule.theme === 'babymoon' ? 'selected' : ''}>태교여행</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>해시태그 <span class="hint">(입력 후 엔터)</span></label>
                        <input type="text" id="tagInput" class="tag-input" placeholder="태그 입력 후 엔터" maxlength="10" enterkeyhint="done">
                        <div class="error-message" id="tagError"></div>
                        <div class="tags-container" id="tagsContainer" style="${(schedule.tags && schedule.tags.length > 0) ? '' : 'display: none;'}">
                            ${(schedule.tags || []).map(tag => `
                                <span class="tag-item">
                                    #${tag}
                                    <button type="button" class="tag-remove" data-tag="${tag}">×</button>
                                </span>
                            `).join('')}
                        </div>
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
                        <!-- Accommodation Form -->
                        <div class="accommodation-form tip-form-section">
                            <h4 id="accFormTitle">새 숙소 추가</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>숙소명 *</label>
                                    <input type="text" id="accName" placeholder="예: 힐튼 호텔">
                                </div>
                                <div class="form-group">
                                    <label>형태</label>
                                    <input type="text" id="accType" placeholder="예: 호텔, 캠핑">
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
                                    <input type="url" id="accUrl" placeholder="예: https://...">
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
                            
                            <!-- Circular Add Button -->
                            <div class="tip-add-button-container hidden">
                                <button type="button" class="btn-add-tip-circular" id="btnAddAccommodation" disabled>
                                    <span class="icon-check">✓</span>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Accommodation List (Accordion) -->
                        <div class="accommodation-list tip-list" id="accommodationList">
                            <!-- Accommodations will be rendered here -->
                        </div>
                        <!-- Separate Guide Text Container -->
                        <div id="accommodationGuide" class="tip-guide-text" style="display: none;"></div>
                    </div>
                </div>
                
                <!-- Step 4: Checklist -->
                <div class="form-step" data-step="4" style="display: none;">
                    <div class="checklist-section">
 
                        <!-- Category Form -->
                        <div class="category-form-section tip-form-section">
                            <h4 id="categoryFormTitle">새 카테고리 추가</h4>
                            <div class="form-group">
                                <label>카테고리명</label>
                                <input type="text" id="categoryName" placeholder="예: 의류, 세면도구, 예약확인" maxlength="20">
                            </div>

                            <div class="form-group">
                                <label>구분</label>
                                <div class="category-type-selector">
                                    <button type="button" class="btn-type-select active" data-type="packing">준비물</button>
                                    <button type="button" class="btn-type-select" data-type="todo">할 일</button>
                                </div>
                            </div>
                            <!-- Validation Msg (Optional) -->
                            <p id="categoryValidationMsg" class="validation-error-msg"></p>
                            <!-- Circular Add Button -->
                            <div class="category-add-button-container tip-add-button-container hidden">
                                <button type="button" class="btn-add-tip-circular" id="btnAddCategory" disabled title="카테고리 추가">
                                    <span class="icon-check">✓</span>
                                </button>
                            </div>
                        </div>

                        <!-- Checklists List (Accordion) -->
                        <div id="checklistsContainer" class="tip-list">
                            <!-- Categories will be rendered here -->
                        </div>
                        
                        <!-- Separate Guide Text Container -->
                        <div id="checklistGuide" class="tip-guide-text" style="display: none;"></div>
                    </div>
                </div>

                <!-- Step 5: Tips -->
                <div class="form-step" data-step="5" style="display: none;">
                    <div class="tip-section">
                        <!-- Tip Form -->
                         <div class="tip-form-section">
                            <h4 id="tipFormTitle">새 팁 작성</h4>
                            <div class="form-group">
                                <label>제목</label>
                                <input type="text" id="tipTitle" placeholder="예: 환전 팁, 대중교통 이용법" maxlength="50">
                            </div>
                            <div class="form-group">
                                <label>내용</label>
                                <textarea id="tipContent" placeholder="상세 내용을 입력하세요" rows="4" maxlength="200"></textarea>
                            </div>
                            <!-- Validation Error Message -->
                            <p id="tipValidationMsg" class="validation-error-msg"></p>
                            <!-- Circular Add Button -->
                            <div class="tip-add-button-container hidden">
                                <button type="button" class="btn-add-tip-circular" id="btnAddTip" disabled>
                                    <span class="icon-hyphen">−</span>
                                    <span class="icon-check">✓</span>
                                </button>
                            </div>
                        </div>

                        <!-- Tips List (Accordion) -->
                        <div id="tipsContainer" class="tip-list">
                            <!-- Tips will be rendered here -->
                        </div>
                        <!-- Separate Guide Text Container -->
                        <div id="tipGuide" class="tip-guide-text" style="display: none;"></div>
                    </div>
                </div>
            </form>

            <!-- Bottom Navigation (Tabs) -->
            <div class="form-navigation">
                 <div class="step-indicator">
                    <!-- Step 1: Basic Info (Note/Pen) -->
                    <div class="step-item active" data-step="1">
                        <div class="icon-gauge-wrapper">
                            <!-- Background Icon -->
                            <svg class="step-icon step-icon-bg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            <!-- Foreground Icon -->
                            <div class="step-icon-fill-container">
                                <svg class="step-icon step-icon-fill" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <!-- Step 2: Schedule (Calendar) - Keep -->
                    <div class="step-item" data-step="2">
                        <div class="icon-gauge-wrapper">
                            <svg class="step-icon step-icon-bg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <div class="step-icon-fill-container">
                                <svg class="step-icon step-icon-fill" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <!-- Step 3: Accommodation (House) -->
                    <div class="step-item" data-step="3">
                        <div class="icon-gauge-wrapper">
                            <svg class="step-icon step-icon-bg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            <div class="step-icon-fill-container">
                                <svg class="step-icon step-icon-fill" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <!-- Step 4: Checklist (List) - Keep -->
                    <div class="step-item" data-step="4">
                        <div class="icon-gauge-wrapper">
                            <svg class="step-icon step-icon-bg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 11l3 3L22 4"></path>
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                            </svg>
                            <div class="step-icon-fill-container">
                                <svg class="step-icon step-icon-fill" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 11l3 3L22 4"></path>
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <!-- Step 5: Tips (Lightbulb) -->
                    <div class="step-item" data-step="5">
                         <div class="icon-gauge-wrapper">
                            <svg class="step-icon step-icon-bg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 18h6"></path>
                                <path d="M10 22h4"></path>
                                <path d="M15.09 14c.18-.9.65-1.74 1.35-2.36C18.67 9.87 19.34 6.84 17.7 4.5c-2.3-3.05-6.91-3.17-9.35-.2-1.74 2.11-1.28 5.23 1 7.34.7.62 1.17 1.46 1.35 2.36"></path>
                            </svg>
                            <div class="step-icon-fill-container">
                                <svg class="step-icon step-icon-fill" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 18h6"></path>
                                    <path d="M10 22h4"></path>
                                    <path d="M15.09 14c.18-.9.65-1.74 1.35-2.36C18.67 9.87 19.34 6.84 17.7 4.5c-2.3-3.05-6.91-3.17-9.35-.2-1.74 2.11-1.28 5.23 1 7.34.7.62 1.17 1.46 1.35 2.36"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Tag management
    const tags = new Set(schedule.tags || []);
    const locations = new Set(schedule.countries || []);
    const adultMembers = new Set(schedule.members?.adultList || []);
    const childMembers = new Set(schedule.members?.childList || []);

    // Initialize managers
    const stepManager = createStepManager(container, schedule, locations);

    // --- Validation Logic (Moved Up) ---
    const VALIDATION_RULES = {
        title: {
            regex: /^[가-힣a-zA-Z0-9\s~!%^&*()\-_+=:"',.\[\]]+$/,
            maxLength: 20,
            msg: '특수문자는 ~!%^&*()-+=:"\',.[] 만 허용됩니다. (최대 20자)'
        },
        location: {
            regex: /^[가-힣a-zA-Z]+$/, // Korean, English only, No Space
            maxLength: 10,
            noSpace: true,
            msg: '한글, 영문만 입력 가능합니다. (띄어쓰기 금지, 최대 10자)'
        },
        member: {
            regex: /^[가-힣a-zA-Z0-9]+$/, // Korean, English, Number, No Space
            maxLength: 10,
            noSpace: true,
            msg: '한글, 영문, 숫자만 입력 가능합니다. (띄어쓰기 금지, 최대 10자)'
        },
        hashtag: {
            regex: /^[가-힣a-zA-Z]+$/, // Korean, English, No Space
            maxLength: 10,
            noSpace: true,
            msg: '한글, 영문만 입력 가능합니다. (띄어쓰기 금지, 최대 10자)'
        }
    };

    function validateInput(value, type) {
        if (!value) return { valid: false, msg: '' }; // Empty is handled by required/red

        const rule = VALIDATION_RULES[type];
        if (!rule) return { valid: true };

        // Space Check
        if (rule.noSpace && /\s/.test(value)) {
            return { valid: false, msg: '띄어쓰기는 허용되지 않습니다.' };
        }

        // Length Check
        if (value.length > rule.maxLength) {
            return { valid: false, msg: `최대 ${rule.maxLength}자까지 입력 가능합니다.` };
        }

        // Regex Check
        if (!rule.regex.test(value)) {
            return { valid: false, msg: rule.msg };
        }

        return { valid: true };
    }

    function updateErrorUI(input, errorId, isValid, msg = '') {
        const titleError = container.querySelector(`#${errorId}`);
        if (titleError) {
            titleError.textContent = msg;
            if (isValid) {
                titleError.classList.remove('visible');
                input.classList.remove('input-error-border'); // Optional extra style?
            } else {
                titleError.classList.add('visible');
                // input.classList.add('input-error-border');
            }
        }
    }
    const accommodationManager = createAccommodationManager(container, schedule, stepManager.generateDaysFromDateRange);
    const checklistManager = createChecklistManager(container, schedule);
    const tipManager = createTipManager(container, schedule);

    // Initial render
    stepManager.updateStepUI();

    // Navigation button events
    // NEW: Header Back & Save
    container.querySelector('#btnEditorBack').addEventListener('click', onCancel);
    container.querySelector('#btnEditorSave').addEventListener('click', () => {
        // Trigger Submit manually
        form.dispatchEvent(new Event('submit'));
    });

    // --- NEW: Step Status & Navigation Logic ---

    function getStepStatuses() {
        const statuses = {};
        const form = container.querySelector('#scheduleForm');
        const formData = new FormData(form);

        // Step 1: Basic Info Validation
        const title = formData.get('title');
        const startDate = formData.get('startDate');
        const endDate = formData.get('endDate');
        // Adults/Children verified by Set size
        const hasAdults = adultMembers.size > 0;
        const hasChildren = childMembers.size > 0;
        const hasLocations = locations.size > 0;

        // Visual Feedback (Red Background)
        const toggleError = (name, isValid) => {
            const input = form.querySelector(`[name="${name}"]`);
            if (input) {
                if (!isValid) input.classList.add('input-error');
                else input.classList.remove('input-error');
            }
        };

        // Validate Title Logic
        const titleValidation = validateInput(title, 'title');
        const isTitleValid = title && titleValidation.valid;
        toggleError('title', isTitleValid);

        toggleError('startDate', !!startDate);
        toggleError('endDate', !!endDate);

        // ...

        // Explicitly handle Tag Inputs (Adult/Child) by ID
        const adultInput = form.querySelector('#adultInput');
        const childInput = form.querySelector('#childInput');

        if (adultInput) {
            if (adultMembers.size === 0) adultInput.classList.add('input-error');
            else adultInput.classList.remove('input-error');
        }

        if (childInput) {
            childInput.classList.remove('input-error');
        }

        // Location Info Validation
        const locationInput = form.querySelector('#locationInput');
        if (!hasLocations) {
            locationInput.classList.add('input-error');
        } else {
            locationInput.classList.remove('input-error');
        }

        const isStep1Valid = isTitleValid && startDate && endDate && hasLocations && (adultMembers.size > 0);
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
        const hasChecks = checks.length > 0;
        statuses[4] = hasChecks ? 'valid' : 'empty';

        // Step 5: Tips
        const tips = tipManager.getTips();
        statuses[5] = (tips && tips.length > 0) ? 'valid' : 'empty';

        return statuses;
    }

    function interpolateColor(percent) {
        // Red: hsl(0, 70%, 60%) approx #ff6b6b
        // Mint: hsl(174, 53%, 56%) approx #4ecdc4 (var(--secondary))
        // We will interpolate Hue from 0 to 174. 
        // Saturation 70 -> 53
        // Lightness 60 -> 56

        const h = (174 - 0) * (percent / 100) + 0;
        const s = (53 - 70) * (percent / 100) + 70;
        const l = (56 - 60) * (percent / 100) + 60;

        return `hsl(${h}, ${s}%, ${l}%)`;
    }

    function updateGaugeVisuals(statuses) {
        // Step 1 Percent Calculation
        const form = container.querySelector('#scheduleForm');
        const formData = new FormData(form);

        let step1Checks = 0;
        if (formData.get('title')) step1Checks++;
        if (formData.get('startDate')) step1Checks++;
        if (formData.get('endDate')) step1Checks++;
        if (adultMembers.size > 0) step1Checks++;
        if (locations.size > 0) step1Checks++;

        const totalStep1 = 5;
        const step1Percent = (step1Checks / totalStep1) * 100;

        container.querySelectorAll('.step-item').forEach(item => {
            const step = parseInt(item.dataset.step);
            const status = statuses[step];

            // Logic for fill percent
            let percent = 0;
            if (step === 1) {
                percent = step1Percent;
            } else {
                // For other steps, 'valid' means 100%, 'empty'/'invalid' means 0%
                // (User logic: "Basic Info except... others if any input -> full")
                percent = status === 'valid' ? 100 : 0;
            }

            // Apply Gauge Styles
            const fillContainer = item.querySelector('.step-icon-fill-container');
            const iconFill = item.querySelector('.step-icon-fill');

            if (fillContainer) {
                const color = interpolateColor(percent);
                fillContainer.style.setProperty('--fill-percent', `${percent}%`);
                fillContainer.style.setProperty('--fill-color', color);
            }

            // Active Class
            if (step === stepManager.currentStep) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function updateStatus() {
        const statuses = getStepStatuses();
        stepManager.updateStepUI(statuses); // Handle Content Switching & Basic Classes
        updateGaugeVisuals(statuses);       // Handle Gauge Animation

        // Save Button Logic
        const saveBtn = container.querySelector('#btnEditorSave');
        if (saveBtn) {
            const isStep1Valid = statuses[1] === 'valid';
            const wasDisabled = saveBtn.classList.contains('disabled') || !saveBtn.classList.contains('active');

            if (isStep1Valid) {
                saveBtn.classList.remove('disabled');
                saveBtn.classList.add('active');

                // Trigger Pop Effect if it was previously disabled (or on first load if valid)
                if (wasDisabled) {
                    saveBtn.classList.remove('pop-effect'); // Reset to replay
                    void saveBtn.offsetWidth; // Trigger reflow
                    saveBtn.classList.add('pop-effect');
                }
            } else {
                saveBtn.classList.add('disabled');
                saveBtn.classList.remove('active');
            }
        }
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
                renderChecklists: () => checklistManager.renderChecklists(),
                renderTips: () => tipManager.renderTips()
            };

            // Before moving, if we are on Step 2, capture days data to `schedule.days` so it's preserved
            if (stepManager.currentStep === 2) {
                const daysData = collectDaysData(container, true); // Show warning
                if (daysData === null) {
                    return; // User cancelled due to empty events
                }
                schedule.days = daysData;
            }

            stepManager.goToStep(targetStep, callbacks);
            updateHeaderTitle(targetStep);
            updateStatus();

            // Setup time formatting delegation
            setupTimeFormatting(container);
        });
    });

    function setupTimeFormatting(container) {
        const form = container.querySelector('#scheduleForm');
        if (!form || form.dataset.timeFormattingAttached) return;

        form.addEventListener('input', (e) => {
            if (e.target.classList.contains('event-start-time') ||
                e.target.classList.contains('event-end-time') ||
                e.target.id === 'accCheckIn' ||
                e.target.id === 'accCheckOut') {

                let val = e.target.value.replace(/[^0-9]/g, '');
                if (val.length > 4) val = val.slice(0, 4);

                if (val.length >= 3) {
                    val = val.slice(0, 2) + ':' + val.slice(2);
                }

                e.target.value = val;
            }
        });

        // Handle backspace for cleaner UX
        form.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' &&
                (e.target.classList.contains('event-start-time') ||
                    e.target.classList.contains('event-end-time') ||
                    e.target.id === 'accCheckIn' ||
                    e.target.id === 'accCheckOut')) {

                const val = e.target.value;
                if (val.length === 3 && val.endsWith(':')) {
                    e.target.value = val.slice(0, 2);
                }
            }
        });

        form.dataset.timeFormattingAttached = 'true';
    }

    // Step 1 Inputs
    const inputsStep1 = container.querySelectorAll('input[name="title"], input[name="startDate"], input[name="endDate"]');
    inputsStep1.forEach(input => {
        input.addEventListener('input', updateStatus);
        input.addEventListener('change', updateStatus); // Date inputs
    });

    // Header Title Management
    const stepTitles = {
        1: '기본 정보',
        2: '일정',
        3: '숙소',
        4: '체크리스트',
        5: 'Tip'
    };

    function updateHeaderTitle(step) {
        const titleEl = container.querySelector('.editor-title');
        if (titleEl) {
            titleEl.textContent = stepTitles[step];
        }
    }

    // Initial Status & Title Update
    updateStatus();
    updateHeaderTitle(1);

    // Initial time formatting setup if we start at step 2 (unlikely but safe)
    if (stepManager.currentStep === 2) {
        setupTimeFormatting(container);
    }

    // ------------------------------------

    // 여행 유형 변경 시 레이블 업데이트
    const tripTypeRadios = container.querySelectorAll('input[name="tripType"]');
    const locationLabel = container.querySelector('#locationLabel');
    const locationInput = container.querySelector('#locationInput');

    tripTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const isDomestic = e.target.value === 'domestic';
            const labelText = isDomestic ? '도시' : '국가';
            locationLabel.innerHTML = `${labelText} <span class="hint"> (입력 후 엔터)</span>`;
            locationInput.placeholder = isDomestic ? '예: 서울' : '예: 미국';
        });
    });



    // Real-time Validation Binding
    const titleInput = container.querySelector('input[name="title"]');
    if (titleInput) {
        titleInput.addEventListener('input', (e) => {
            const result = validateInput(e.target.value, 'title');
            // For title, empty is also invalid in terms of "required" but regex might match empty?
            // Our regex `+` means 1 or more. So empty fails regex. 
            // But we want "Required" to be red BG, "Invalid Char" to be red Text below.
            if (e.target.value.length > 0) {
                updateErrorUI(titleInput, 'titleError', result.valid, result.msg);
            } else {
                updateErrorUI(titleInput, 'titleError', true, ''); // Clear error if empty (handled by required style)
            }
        });
    }

    // Helper for Realtime on Tag Inputs
    function bindRealtimeValidation(inputId, errorId, ruleType) {
        const input = container.querySelector(`#${inputId}`);
        if (input) {
            input.addEventListener('input', (e) => {
                let val = e.target.value;

                // Force remove # from input if hashtag
                if (ruleType === 'hashtag' && val.includes('#')) {
                    val = val.replace(/#/g, '');
                    e.target.value = val;
                }

                if (val.length > 0) {
                    const result = validateInput(val, ruleType);
                    updateErrorUI(input, errorId, result.valid, result.msg);
                } else {
                    updateErrorUI(input, errorId, true, '');
                }
            });
        }
    }

    bindRealtimeValidation('locationInput', 'locationError', 'location');
    bindRealtimeValidation('adultInput', 'adultError', 'member');
    bindRealtimeValidation('childInput', 'childError', 'member');
    bindRealtimeValidation('tagInput', 'tagError', 'hashtag');

    // 위치 관리 (countries/cities)
    const locationsContainer = container.querySelector('#locationsContainer');

    function addLocation(locationText) {
        const cleanLocation = locationText.trim();
        const validation = validateInput(cleanLocation, 'location');

        if (!validation.valid) {
            updateErrorUI(locationInput, 'locationError', false, validation.msg);
            return;
        }

        if (locations.size >= 20) {
            updateErrorUI(locationInput, 'locationError', false, '최대 20개까지만 등록 가능합니다.');
            return;
        }

        if (cleanLocation && !locations.has(cleanLocation)) {
            locations.add(cleanLocation);
            updateErrorUI(locationInput, 'locationError', true); // Clear error on success
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
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            addLocation(locationInput.value);
        }
    });

    locationInput.addEventListener('blur', () => {
        if (locationInput.value.trim()) {
            addLocation(locationInput.value);
        }
    });

    // 기존 위치 삭제 버튼
    // ... (rest of the block if contiguous)
    // Actually I need to match context.
    // Let's modify just the listener block if possible.
    // But replace_file_content needs context.

    // The previous view showed:
    // 527:     locationInput.addEventListener('keydown', (e) => {
    // 528:         if (e.key === 'Enter') {
    // 529:             e.preventDefault();
    // 530:             addLocation(locationInput.value);
    // 531:         }
    // 532:     });

    // Wait, line 529 ALREADY has e.preventDefault(). 
    // Is it possible the user's issue persists despite this?
    // Mobile keyboards sometimes send keyCode 13 but maybe "Go" action?
    // Or maybe `keydown` is too late? `keypress`?
    // However, on mobile, sometimes 'Enter' is 'Go' which submits form.
    // e.preventDefault() should stop it.
    // Maybe checking `e.keyCode === 13` helps?
    // Or maybe the event is different on Samsung/iOS keyboard?
    // Let's explicitly check keyCode too.
    // Also, adding `inputmode="text"` or `enterkeyhint="done"` might help UX but logic needs to be robust.

    // I will replace both listeners (location and tag) to be robust.

    /* 
    Updated Plan:
    1. use `keypress` or handle `compositionend`. 
       Process 'Enter' robustly.
    2. Add `e.stopPropagation()` just in case.
    */


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

    // Member Management Logic

    const adultInput = container.querySelector('#adultInput');
    const adultsContainer = container.querySelector('#adultsContainer');
    const childInput = container.querySelector('#childInput');
    const childrenContainer = container.querySelector('#childrenContainer');

    function updateMemberUI(type) { // type: 'adult' or 'child'
        const isAdult = type === 'adult';
        const set = isAdult ? adultMembers : childMembers;
        const containerEl = isAdult ? adultsContainer : childrenContainer;
        const countLabel = isAdult ? container.querySelector(`#${type}CountLabel`) : container.querySelector(`#${type}CountLabel`);

        // Update Count
        countLabel.textContent = `(${set.size}명)`;

        // Render Tags
        containerEl.innerHTML = '';
        if (set.size > 0) {
            containerEl.style.display = 'flex';
            set.forEach(name => {
                const tag = document.createElement('span');
                tag.className = 'tag-item member-tag'; // reuse tag style
                tag.innerHTML = `${name} <button type="button" class="tag-remove">&times;</button>`;
                tag.querySelector('.tag-remove').addEventListener('click', () => {
                    set.delete(name);
                    updateMemberUI(type);
                    updateStatus();
                });
                containerEl.appendChild(tag);
            });
        } else {
            containerEl.style.display = 'none';
        }
    }

    function addMember(type, name) {
        const cleanName = name.trim();
        if (!cleanName) return;

        const validation = validateInput(cleanName, 'member');
        const errorId = type === 'adult' ? 'adultError' : 'childError';
        const inputEl = type === 'adult' ? adultInput : childInput;

        if (!validation.valid) {
            updateErrorUI(inputEl, errorId, false, validation.msg);
            return;
        }

        const set = type === 'adult' ? adultMembers : childMembers;

        if (set.size >= 20) {
            updateErrorUI(inputEl, errorId, false, '최대 20개까지만 등록 가능합니다.');
            return;
        }

        if (!set.has(cleanName)) {
            set.add(cleanName);
            updateErrorUI(inputEl, errorId, true);
            updateMemberUI(type);
            updateStatus();
        }

        // Clear Input
        if (type === 'adult') adultInput.value = '';
        else childInput.value = '';
    }

    // Initialize Member UI
    updateMemberUI('adult');
    updateMemberUI('child');

    // Event Listeners for Members
    [
        { input: adultInput, type: 'adult' },
        { input: childInput, type: 'child' }
    ].forEach(({ input, type }) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                e.stopPropagation();
                addMember(type, input.value);
            }
        });

        input.addEventListener('blur', () => {
            if (input.value.trim()) {
                addMember(type, input.value);
            }
        });
    });

    function addTag(tagText) {
        const cleanTag = tagText.replace(/^#/, '').trim();

        const validation = validateInput(cleanTag, 'hashtag');
        if (!validation.valid) {
            updateErrorUI(tagInput, 'tagError', false, validation.msg);
            return;
        }

        if (tags.size >= 20) {
            updateErrorUI(tagInput, 'tagError', false, '최대 20개까지만 등록 가능합니다.');
            return;
        }

        if (cleanTag && !tags.has(cleanTag)) {
            tags.add(cleanTag);
            updateErrorUI(tagInput, 'tagError', true);
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
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            e.stopPropagation();
            addTag(tagInput.value);
        }
    });

    tagInput.addEventListener('blur', () => {
        if (tagInput.value.trim() && tagInput.value.trim() !== '#') {
            addTag(tagInput.value);
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
        const daysData = collectDaysData(container, true); // Show warning when saving

        // If user cancelled due to empty events, don't save
        if (daysData === null) {
            return;
        }

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
                adults: adultMembers.size,
                children: childMembers.size,
                adultList: Array.from(adultMembers),
                childList: Array.from(childMembers)
            },
            days: daysData,
            accommodations: accommodationManager.getAccommodations(),
            checklists: checklistManager.getChecklists(),
            tips: tipManager.getTips()
        };

        const saved = saveSchedule(newSchedule);

        // Prevent navigation (stay on page)
        // onSave(saved); 

        // UI Feedback: Fade In "저장완료"
        const saveBtn = container.querySelector('#btnEditorSave');
        const originalContent = saveBtn.innerHTML;

        // 1. Fade Out Icon
        saveBtn.style.opacity = '0';

        setTimeout(() => {
            // 2. Change to Text (Hidden)
            saveBtn.innerHTML = '<span style="font-size: 14px; font-weight: bold;">저장완료</span>';
            saveBtn.classList.add('disabled');
            saveBtn.style.width = 'auto';
            saveBtn.style.padding = '0 12px';
            saveBtn.style.color = '#45B8AF';

            // 3. Fade In Text
            requestAnimationFrame(() => {
                saveBtn.style.opacity = '1';
            });

            // 4. Wait 3s then Restore
            setTimeout(() => {
                // 5. Fade Out Text
                saveBtn.style.opacity = '0';

                setTimeout(() => {
                    // 6. Restore Icon (Hidden)
                    saveBtn.innerHTML = originalContent;
                    saveBtn.style.width = '';
                    saveBtn.style.padding = '';
                    saveBtn.style.color = '';

                    if (saved) {
                        updateStatus(); // Handles disabled state
                    }

                    // 7. Fade In Icon
                    requestAnimationFrame(() => {
                        saveBtn.style.opacity = '1';
                    });
                }, 300); // Wait for fade out
            }, 3000);
        }, 300); // Wait for initial fade out
    });



    // Render Step 2 Helper Functions

    function collectDaysData(container, showWarning = false) {
        const daysContainer = container.querySelector('#daysContainer');
        const dayCards = daysContainer ? daysContainer.querySelectorAll(':scope > .day-card') : [];

        // CRITICAL FIX: If no day cards are found, it means Step 2 was likely never rendered 
        // in this editing session. In this case, we MUST return the existing schedule.days
        // to prevent data loss upon saving from other steps.
        if (dayCards.length === 0) {
            return schedule.days || [];
        }

        const days = [];
        let emptyEventCount = 0;

        dayCards.forEach(dayCard => {
            // CRITICAL: Only process cards with valid data-day attribute (Step 2 itinerary cards only)
            // This excludes accommodation and tip cards which also use .day-card class
            if (!dayCard.dataset.day || !dayCard.hasAttribute('data-day')) {
                return; // Skip this card - it's not a Step 2 day card
            }

            const dayNum = parseInt(dayCard.dataset.day);

            // Additional validation: day number must be a valid positive integer
            if (isNaN(dayNum) || dayNum < 1) {
                return; // Skip invalid day cards
            }

            const dayBadge = dayCard.querySelector('.day-badge')?.textContent;
            const dayDate = dayCard.querySelector('.day-date')?.textContent?.split(' ')[0]; // Get just the date part

            // Validate that we have the required elements
            if (!dayBadge || !dayDate) {
                return; // Skip malformed cards
            }

            const eventItems = dayCard.querySelectorAll('.event-item');
            const events = [];

            eventItems.forEach(eventItem => {
                // Get selected location from checkboxes
                const locationCheckbox = eventItem.querySelector('.location-checkboxes input[type="checkbox"]:checked');
                const location = locationCheckbox ? locationCheckbox.value : '';

                const place = eventItem.querySelector('.event-place').value.trim();
                const startTime = eventItem.querySelector('.event-start-time').value.trim();
                const endTime = eventItem.querySelector('.event-end-time').value.trim();
                const description = eventItem.querySelector('.event-description').value.trim();

                const lat = eventItem.querySelector('.event-lat')?.value;
                const lng = eventItem.querySelector('.event-lng')?.value;

                // Debug Log
                if (lat || lng) {
                    console.log(`[Debug] Found coords in DOM: ${lat}, ${lng}`);
                } else {
                    // console.log('[Debug] No coords in DOM for this item');
                }

                const coords = (lat && lng) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;

                // Only save events that have at least one of: location, place, description, start time, end time
                if (location || place || description || startTime || endTime) {
                    events.push({
                        location,
                        place,
                        startTime,
                        endTime,
                        description,
                        coords // Save Coords
                    });
                } else {
                    // Count empty events (absolutely nothing filled)
                    emptyEventCount++;
                }
            });

            days.push({
                day: dayNum,
                date: dayDate,
                events
            });
        });

        // Show warning if requested and there are empty events
        if (showWarning && emptyEventCount > 0) {
            const confirmed = confirm(`${emptyEventCount}개의 빈 일정이 있습니다.\n(위치, 내용이 모두 비어있음)\n\n이 일정들을 삭제하고 계속하시겠습니까?`);
            if (!confirmed) {
                return null; // User cancelled
            }
        }

        return days;
    }

    function renderStep2(days, locationsList, containerElement) {
        const daysContainer = containerElement.querySelector('#daysContainer');
        const timeOptions = stepManager.generateTimeOptions(); // Use shared helper

        daysContainer.innerHTML = days.map((day, dayIndex) => {
            // Ensure at least one event if day is empty
            const eventsToRender = day.events.length > 0 ? day.events : [{
                location: '',
                place: '',
                startTime: '',
                endTime: '',
                description: ''
            }];

            return `
            <div class="day-card" data-day="${day.day}">
                <div class="day-header" data-toggle="day">
                    <div class="day-info">
                        <span class="day-badge">Day ${day.day}</span>
                        <span class="day-date">${day.date} (${day.dayName})</span>
                    </div>
                    <svg class="collapse-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 10L8 6L12 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                
                <div class="day-actions-bar btn-toggle-all-details" data-day="${day.day}">
                     <svg class="toggle-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6 15l6-6 6 6"/>
                     </svg>
                </div>

                <div class="events-list" id="events-day-${day.day}">
                    ${eventsToRender.map((event, eventIndex) =>
                renderEventItem(event, eventIndex, locationsList, timeOptions, day.day)
            ).join('')}
                    <button type="button" class="btn-add-event-floating" data-day="${day.day}" title="일정 추가">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                            <path d="M8 3V13M3 8H13" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>

            </div>
        `}).join('');

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
                    if (addBtn) addBtn.style.display = 'none';
                    icon.innerHTML = '<path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
                } else {
                    eventsList.style.display = 'block';
                    if (addBtn) addBtn.style.display = 'block';
                    icon.innerHTML = '<path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
                }
            });
        });

        // Add collapse/expand all details toggle functionality
        daysContainer.querySelectorAll('.btn-toggle-all-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dayNum = btn.dataset.day;
                const eventsList = daysContainer.querySelector(`#events-day-${dayNum}`);
                const eventItems = eventsList.querySelectorAll('.event-item');
                const icon = btn.querySelector('svg');

                // Toggle state
                const isCollapsed = btn.classList.contains('all-collapsed');

                if (isCollapsed) {
                    // Expand All
                    eventItems.forEach(item => {
                        item.classList.remove('collapsed');
                        const content = item.querySelector('.event-content');
                        if (content) content.style.display = 'block';

                        // Sync Icon: UP (Expanded)
                        const itemIcon = item.querySelector('.collapse-icon');
                        if (itemIcon) itemIcon.innerHTML = '<path d="M4 10L8 6L12 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
                    });
                    btn.classList.remove('all-collapsed');
                    // Change icon to "Collapse" (Up Arrow/Chevron)
                    icon.innerHTML = '<path d="M6 15l6-6 6 6"/>';
                } else {
                    // Collapse All
                    eventItems.forEach(item => {
                        item.classList.add('collapsed');
                        const content = item.querySelector('.event-content');
                        if (content) content.style.display = 'none';

                        // Sync Icon: DOWN (Collapsed)
                        const itemIcon = item.querySelector('.collapse-icon');
                        if (itemIcon) itemIcon.innerHTML = '<path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
                    });
                    btn.classList.add('all-collapsed');
                    // Change icon to "Expand" (Down Arrow/Chevron)
                    icon.innerHTML = '<path d="M6 9l6 6 6-6"/>';
                }
            });
        });

        // Add event listeners for add/remove buttons
        daysContainer.querySelectorAll('.btn-add-event-floating').forEach(btn => {
            btn.addEventListener('click', () => {
                const dayNum = parseInt(btn.dataset.day);
                addEventToDay(dayNum, locationsList, timeOptions, containerElement);
            });
        });

        // Add event listeners for existing remove buttons
        daysContainer.querySelectorAll('.btn-remove-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent collapse toggle

                const dayNum = parseInt(btn.dataset.day);
                const eventsList = containerElement.querySelector(`#events-day-${dayNum}`);

                // Remove the event item first
                btn.closest('.event-item').remove();

                // Then renumber remaining events
                const remainingEvents = eventsList.querySelectorAll('.event-item');
                remainingEvents.forEach((eventItem, index) => {
                    const eventHeader = eventItem.querySelector('.event-header span');
                    if (eventHeader) {
                        eventHeader.textContent = `일정 ${index + 1}`;
                    }
                });

                // If no events left, show empty message
                if (remainingEvents.length === 0) {
                    const floatingBtn = eventsList.querySelector('.btn-add-event-floating');
                    eventsList.innerHTML = '<p class="no-events">일정을 추가해주세요</p>';
                    // Re-add floating button
                    if (floatingBtn) {
                        eventsList.appendChild(floatingBtn);
                    }
                }
            });
        });

        // NEW: Location Picker Delegation
        // NEW: Location Picker Delegation - Prevent Duplicate Listeners
        if (!daysContainer.dataset.hasLocationListener) {
            daysContainer.dataset.hasLocationListener = 'true';
            daysContainer.addEventListener('click', (e) => {
                const pickBtn = e.target.closest('.btn-pick-location');
                if (pickBtn) {
                    const eventItem = pickBtn.closest('.event-item');
                    const latInput = eventItem.querySelector('.event-lat');
                    const lngInput = eventItem.querySelector('.event-lng');
                    const placeInput = eventItem.querySelector('.event-place');

                    const currentLat = latInput.value ? parseFloat(latInput.value) : null;
                    const currentLng = lngInput.value ? parseFloat(lngInput.value) : null;

                    if (window.showLocationPicker) {
                        window.showLocationPicker(currentLat, currentLng, (coords) => {
                            latInput.value = coords.lat;
                            lngInput.value = coords.lng;

                            // Update visual state (Add red active class)
                            pickBtn.classList.add('active');

                            // Optional: if place is empty, maybe fill with something? 
                            // But we don't return address yet.
                        });
                    } else {
                        alert('지도 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
                    }
                }
            });
        }

        // NEW: Event Reorder Delegation
        if (!daysContainer.dataset.hasReorderListener) {
            daysContainer.dataset.hasReorderListener = 'true';
            daysContainer.addEventListener('click', (e) => {
                const upBtn = e.target.closest('.btn-move-event-up');
                const downBtn = e.target.closest('.btn-move-event-down');

                if (!upBtn && !downBtn) return;

                e.stopPropagation(); // Stop collapse toggle
                e.preventDefault();

                const btn = upBtn || downBtn;
                const currentItem = btn.closest('.event-item');
                const eventsList = currentItem.parentElement;

                if (upBtn) {
                    const prevItem = currentItem.previousElementSibling;
                    if (prevItem && prevItem.classList.contains('event-item')) {
                        eventsList.insertBefore(currentItem, prevItem);
                        renumberEvents(eventsList);
                    }
                } else if (downBtn) {
                    const nextItem = currentItem.nextElementSibling;
                    if (nextItem && nextItem.classList.contains('event-item')) {
                        // To move down, insert next item before current item
                        eventsList.insertBefore(nextItem, currentItem);
                        renumberEvents(eventsList);
                    }
                }
            });
        }

        function renumberEvents(listElement) {
            const items = listElement.querySelectorAll(':scope > .event-item');
            items.forEach((item, index) => {
                const headerSpan = item.querySelector('.event-header span');
                if (headerSpan) {
                    headerSpan.textContent = `일정 ${index + 1}`;
                }
            });
        }

        // Add collapse/expand functionality for event items
        daysContainer.querySelectorAll('[data-toggle="event"]').forEach(header => {
            header.addEventListener('click', () => {
                const eventItem = header.closest('.event-item');
                const eventContent = eventItem.querySelector('.event-content');
                const icon = header.querySelector('svg');

                eventItem.classList.toggle('collapsed');
                if (eventItem.classList.contains('collapsed')) {
                    eventContent.style.display = 'none';
                    if (icon) icon.innerHTML = '<path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'; // Down
                } else {
                    eventContent.style.display = 'block';
                    if (icon) icon.innerHTML = '<path d="M4 10L8 6L12 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'; // Up
                }
            });
        });
    }

    function renderEventItem(event, eventIndex, locationsList, timeOptions, dayNum) {
        return `
            <div class="event-item">
                <div class="event-header">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span>일정 ${eventIndex + 1}</span>
                        <button type="button" class="btn-toggle-collapse-icon" data-toggle="event" title="접기/펴기">
                            <svg class="collapse-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M4 10L8 6L12 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                    <div class="event-actions">
                        <div class="event-reorder-actions" style="display:flex; gap:4px; margin-right:6px;">
                             <button type="button" class="btn-move-event btn-move-event-up" title="위로 이동">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 15l-6-6-6 6"/>
                                </svg>
                             </button>
                             <button type="button" class="btn-move-event btn-move-event-down" title="아래로 이동">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M6 9l6 6 6-6"/>
                                </svg>
                             </button>
                        </div>
                        <button type="button" class="btn-remove-event" data-day="${dayNum}">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor">
                                <path d="M1 1L13 13M13 1L1 13" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="event-content">
                    <div class="form-group-compact">
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
                    
                    <div class="form-group-compact">
                        <label>위치</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="text" class="event-place" value="${(() => {
                // Data Mapping Logic
                if (event.place) return event.place;
                if (event.detail) return event.detail;
                if (event.location && !locationsList.includes(event.location)) return event.location;
                return '';
            })()}" placeholder="예: 프라하 공항" style="flex: 1;">
                            <button type="button" class="btn-pick-location ${event.coords ? 'active' : ''}" title="지도에서 선택">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                        <input type="hidden" class="event-lat" value="${event.coords?.lat || ''}">
                        <input type="hidden" class="event-lng" value="${event.coords?.lng || ''}">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-compact">
                            <label>시작 시간</label>
                            <input type="text" class="event-start-time" value="${event.startTime || event.time || ''}" 
                                   inputmode="numeric" maxlength="5" placeholder="00:00">
                        </div>
                        <div class="form-group-compact">
                            <label>종료 시간</label>
                            <input type="text" class="event-end-time" value="${event.endTime || ''}" 
                                   inputmode="numeric" maxlength="5" placeholder="00:00">
                        </div>
                    </div>
                    
                    <div class="form-group-compact">
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
            startTime: '',
            endTime: '',
            description: ''
        };

        const eventHTML = renderEventItem(newEvent, eventCount, locationsList, timeOptions, dayNum);

        // Insert before the floating button
        const floatingBtn = eventsList.querySelector('.btn-add-event-floating');
        if (floatingBtn) {
            floatingBtn.insertAdjacentHTML('beforebegin', eventHTML);
        } else {
            eventsList.insertAdjacentHTML('beforeend', eventHTML);
        }

        // Add remove event listener to new item
        const allEvents = eventsList.querySelectorAll('.event-item');
        const newEventItem = allEvents[allEvents.length - 1];
        const removeBtn = newEventItem.querySelector('.btn-remove-event');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            const dayNum = parseInt(removeBtn.dataset.day);
            const eventsList = containerElement.querySelector(`#events-day-${dayNum}`);

            // Remove the event item first
            newEventItem.remove();

            // Then renumber remaining events
            const remainingEvents = eventsList.querySelectorAll('.event-item');
            remainingEvents.forEach((eventItem, index) => {
                const eventHeader = eventItem.querySelector('.event-header span');
                if (eventHeader) {
                    eventHeader.textContent = `일정 ${index + 1}`;
                }
            });

            // If no events left, show empty message
            if (remainingEvents.length === 0) {
                const floatingBtn = eventsList.querySelector('.btn-add-event-floating');
                eventsList.innerHTML = '<p class="no-events">일정을 추가해주세요</p>';
                // Re-add floating button
                if (floatingBtn) {
                    eventsList.appendChild(floatingBtn);
                }
            }
        });
    }

}
