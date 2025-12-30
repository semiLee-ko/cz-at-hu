// Checklist Management Module
// Handles categories and items in an accordion style

import {
    getAllSchedules,
    getChecklistTemplates,
    saveChecklistTemplate,
    deleteChecklistTemplate
} from '../../storage.js';
import { showCustomAlert, showCustomConfirm, showCustomPrompt } from '../../utils/modalUtils.js';

const CHECKLIST_THEMES = {
    domestic: {
        name: '국내 여행',
        categories: [
            { name: '필수 준비물', type: 'packing', items: ['신분증', '지갑/카드', '휴대폰 충전기'] },
            { name: '의류', type: 'packing', items: ['속옷/양말', '잠옷', '여벌 옷', '외투'] },
            { name: '세면도구', type: 'packing', items: ['칫솔/치약', '샴푸/컨디셔너', '바디워시', '클렌징폼'] },
            { name: '상비약', type: 'packing', items: ['소화제', '진통제', '밴드/연고', '종합감기약', '모기기피제', '멀미약'] },
            { name: '미용', type: 'packing', items: ['스킨/로션/팩', '선크림', '빗', '머리끈', '손톱깎이'] },
            { name: '기타', type: 'packing', items: ['휴지/물티슈', '비닐봉지/지퍼백'] }
        ]
    },
    overseas: {
        name: '해외 여행',
        categories: [
            { name: '필수 서류', type: 'packing', items: ['여권', 'E-티켓', '바우처(숙소/투어)', '환전한 현금/카드', '여행자보험'] },
            { name: '기내 용품', type: 'packing', items: ['목베개', '안대/귀마개', '보조배터리', '볼펜'] },
            { name: '전자기기', type: 'packing', items: ['멀티어댑터', '충전기/케이블', '유심/포켓와이파이'] },
            { name: '세면도구', type: 'packing', items: ['칫솔/치약', '샴푸/컨디셔너', '바디워시', '클렌징폼'] },
            { name: '비상약', type: 'packing', items: ['소화제', '종합감기약', '지사제', '해열진통제', '밴드/연고', '영양제'] },
            { name: '미용', type: 'packing', items: ['스킨/로션/팩', '선크림', '빗', '머리끈', '손톱깎이'] },
            { name: '기타', type: 'packing', items: ['휴지/물티슈', '비닐봉지/지퍼백', '압축팩', '비상식량(고추장, 라면 등)', '우산/우비', '샤워필터'] }
        ]
    },
    waterplay: {
        name: '물놀이/여름',
        categories: [
            { name: '물놀이 용품', type: 'packing', items: ['수영복/래쉬가드', '아쿠아슈즈', '방수팩', '물안경/튜브', '비치타월'] },
            { name: '피부 보호', type: 'packing', items: ['선크림(워터프루프)', '모자', '선글라스', '알로에 젤'] }
        ]
    },
    camping: {
        name: '캠핑/글램핑',
        categories: [
            { name: '숙박 용품', type: 'packing', items: ['텐트/타프', '그라운드시트', '펙/망치/장갑', '침낭/매트', '베개', '랜턴/조명', '난로'] },
            { name: '주방 용품', type: 'packing', items: ['코펠/버너', '수저/컵', '아이스박스', '키친타월', '쓰레기봉투', '테이블', '의자', '부탄/이소가스', '그릇/접시', '칼/가위/집게'] },
            { name: '음식', type: 'packing', items: ['바비큐 고기', '라면/햇반', '물/음료', '양념류'] },
            { name: '화로', type: 'packing', items: ['화로대', '장작', '토치/가스', '숯집게', '장갑'] },
            { name: '기타', type: 'packing', items: ['아이스박스', '쓰레기봉투', '휴지/물티슈', '일산화탄소감지기'] }
        ]
    }
};

export function createChecklistManager(container, schedule) {
    // Scope selectors to Step 4
    const stepRoot = container.querySelector('.form-step[data-step="4"]');

    // Migrate data if it's in the old tabbed format
    let categories = [];
    if (Array.isArray(schedule.checklists)) {
        categories = schedule.checklists;
    } else if (schedule.checklists && (schedule.checklists.packing || schedule.checklists.todo)) {
        // Merge old formats
        const packing = schedule.checklists.packing || [];
        const todo = schedule.checklists.todo || [];
        categories = [...packing, ...todo];
    }
    // Update schedule object to use the new flat array format
    schedule.checklists = categories;

    let editingCategoryId = null;
    let draggedItem = null;
    let placeholder = null;
    let selectedType = 'packing'; // Default type
    let expandedCategories = new Set(); // Track expanded category IDs

    function generateCategoryId() {
        return 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function generateItemId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Real-time validation for category form
    function validateCategoryForm() {
        if (!stepRoot) return;
        const nameInput = stepRoot.querySelector('#categoryName');
        const btnAdd = stepRoot.querySelector('#btnAddCategory');
        const btnContainer = stepRoot.querySelector('.category-add-button-container');

        if (!nameInput || !btnAdd) return;

        const name = nameInput.value.trim();

        // Simple validation: 2-20 characters
        const isValid = name.length >= 2 && name.length <= 20;

        btnAdd.disabled = !isValid;
        if (btnContainer) {
            btnContainer.classList.toggle('hidden', !isValid);
        }
    }

    function renderChecklists() {
        if (!stepRoot) return;
        const checklistsContainer = stepRoot.querySelector('#checklistsContainer');
        if (!checklistsContainer) return;

        // Checklist Toolbar (Import / Save Template)
        // Checklist Toolbar (Import / Save Template)
        const toolbarHtml = `
            <div class="checklist-toolbar">
                <button type="button" id="btnSaveTemplate" class="btn-checklist-action secondary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <span>템플릿 저장</span>
                </button>
                <button type="button" id="btnImportChecklist" class="btn-checklist-action primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="16 16 12 12 8 16"></polyline>
                        <line x1="12" y1="12" x2="12" y2="21"></line>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
                        <polyline points="16 16 12 12 8 16"></polyline>
                    </svg>
                    <span>불러오기</span>
                </button>
            </div>
        `;

        if (categories.length === 0) {
            checklistsContainer.innerHTML = toolbarHtml + '<p class="no-events">등록된 내용이 없습니다.</p>';
        } else {
            checklistsContainer.innerHTML = toolbarHtml + categories.map(cat => {
                const isExpanded = expandedCategories.has(cat.id);
                return `
                <div class="day-card tip-card ${isExpanded ? '' : 'collapsed'}" data-category-id="${cat.id}">
                    <div class="day-header">
                        <div class="drag-handle" draggable="true">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="5 9 2 12 5 15"></polyline>
                                <polyline points="9 5 12 2 15 5"></polyline>
                                <polyline points="19 9 22 12 19 15"></polyline>
                                <polyline points="9 19 12 22 15 19"></polyline>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <line x1="12" y1="2" x2="12" y2="22"></line>
                            </svg>
                        </div>
                        <div class="day-info">
                            <span class="day-badge">${cat.type === 'todo' ? '할 일' : '준비물'}</span>
                            <span class="day-date">${cat.name} (${cat.items.length})</span>
                        </div>
                        <svg class="collapse-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                    <div class="events-list tip-content-wrapper">
                        <div class="tip-content-inner">
                            <div class="checklist-items-container">
                                ${cat.items.length === 0 ? '<p class="no-items">항목이 없습니다.</p>' : ''}
                                ${cat.items.map(item => `
                                    <div class="checklist-item-row" data-item-id="${item.id}">
                                        <div class="item-content-wrapper" style="display: flex; align-items: center; gap: 8px;">
                                            <span style="color: #45B8AF; font-size: 1.2rem; line-height: 1;">•</span>
                                            <span class="item-text text-truncate">${item.text}</span>
                                        </div>
                                        <div class="item-actions">
                                            <select class="priority-dropdown priority-${item.priority}" data-category-id="${cat.id}" data-item-id="${item.id}">
                                                <option value="high" ${item.priority === 'high' ? 'selected' : ''}>상</option>
                                                <option value="medium" ${item.priority === 'medium' ? 'selected' : ''}>중</option>
                                                <option value="low" ${item.priority === 'low' ? 'selected' : ''}>하</option>
                                            </select>
                                            <button type="button" class="btn-delete-item-small" data-category-id="${cat.id}" data-item-id="${item.id}">×</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div class="add-item-inner-form">
                                <input type="text" class="inner-item-input" placeholder="새 항목 입력..." data-category-id="${cat.id}">
                                <button type="button" class="btn-add-item-small" data-category-id="${cat.id}">추가</button>
                            </div>

                            <button type="button" class="btn-delete-tip-icon" data-category-id="${cat.id}" title="카테고리 삭제">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            }).join('');
        }

        // Render Guide
        const guideContainer = stepRoot.querySelector('#checklistGuide');
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
                카테고리 왼쪽 핸들을 끌어 순서를 변경하고, 펼쳐서 상세 항목을 관리하세요.
            `;
        }

        attachChecklistEventListeners();
        clearCategoryForm();
        validateCategoryForm();
    }

    function attachChecklistEventListeners() {
        if (!stepRoot) return;
        const checklistsContainer = stepRoot.querySelector('#checklistsContainer');

        // Accordion Toggle
        checklistsContainer.querySelectorAll('.day-header').forEach(header => {
            if (!header.dataset.listenerAttached) {
                header.addEventListener('click', (e) => {
                    if (e.target.closest('.drag-handle')) return;
                    const card = header.closest('.day-card');
                    const catId = card.dataset.categoryId;

                    const isClosing = !card.classList.contains('collapsed');
                    if (isClosing) {
                        expandedCategories.delete(catId);
                        card.classList.add('collapsed');
                    } else {
                        expandedCategories.add(catId);
                        card.classList.remove('collapsed');
                    }
                });
                header.dataset.listenerAttached = 'true';
            }
        });

        // Delete Category
        checklistsContainer.querySelectorAll('.btn-delete-tip-icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteCategory(btn.dataset.categoryId);
            });
        });

        // Add Item
        checklistsContainer.querySelectorAll('.btn-add-item-small').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.previousElementSibling;
                const text = input.value.trim();
                if (text) {
                    addItem(btn.dataset.categoryId, text);
                    input.value = '';
                }
            });
        });

        checklistsContainer.querySelectorAll('.inner-item-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const text = input.value.trim();
                    if (text) {
                        addItem(input.dataset.categoryId, text);
                        input.value = '';
                    }
                }
            });
        });


        // Delete Item
        checklistsContainer.querySelectorAll('.btn-delete-item-small').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteItem(btn.dataset.categoryId, btn.dataset.itemId);
            });
        });

        // Priority Change
        checklistsContainer.querySelectorAll('.priority-dropdown').forEach(select => {
            select.addEventListener('change', () => {
                updatePriority(select.dataset.categoryId, select.dataset.itemId, select.value);
            });
        });

        // Drag & Drop for Categories
        attachDragEventListeners(checklistsContainer);

        // Toolbar Buttons
        const btnSaveTemplate = stepRoot.querySelector('#btnSaveTemplate');
        if (btnSaveTemplate) {
            btnSaveTemplate.addEventListener('click', handleSaveTemplate);
        }

        const btnImportChecklist = stepRoot.querySelector('#btnImportChecklist');
        if (btnImportChecklist) {
            btnImportChecklist.addEventListener('click', createImportModal);
        }
    }

    function attachDragEventListeners(checklistsContainer) {
        checklistsContainer.querySelectorAll('.drag-handle').forEach(handle => {
            if (handle.dataset.dragAttached) return;

            handle.addEventListener('dragstart', (e) => {
                const item = handle.closest('.day-card');
                draggedItem = item;
                e.dataTransfer.setData('text/plain', item.dataset.categoryId);
                setTimeout(() => item.classList.add('dragging'), 0);
                item.classList.add('collapsed');
            });
            handle.addEventListener('dragend', () => resetDragState());

            // Touch events
            handle.addEventListener('touchstart', (e) => {
                if (e.cancelable) e.preventDefault();
                const item = handle.closest('.day-card');
                draggedItem = item;
                item.classList.add('dragging');
                item.classList.add('collapsed');
            }, { passive: false });

            handle.dataset.dragAttached = 'true';
        });

        if (!checklistsContainer.dataset.dragContainerAttached) {
            checklistsContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (draggedItem) handleDragOverList(checklistsContainer, e.clientY);
            });

            checklistsContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedItem) handleDropList(checklistsContainer);
            });

            // Touch support for reordering
            checklistsContainer.addEventListener('touchmove', (e) => {
                if (!draggedItem) return;
                if (e.cancelable) e.preventDefault();
                const touch = e.touches[0];
                handleDragOverList(checklistsContainer, touch.clientY);
            }, { passive: false });

            checklistsContainer.addEventListener('touchend', (e) => {
                if (!draggedItem) return;
                handleDropList(checklistsContainer);
                resetDragState();
            });

            checklistsContainer.dataset.dragContainerAttached = 'true';
        }
    }

    function resetDragState() {
        draggedItem?.classList.remove('dragging');
        draggedItem = null;
        if (placeholder?.parentNode) placeholder.parentNode.removeChild(placeholder);
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
        const newCats = Array.from(container.querySelectorAll('.day-card'))
            .map(el => categories.find(c => c.id === el.dataset.categoryId))
            .filter(Boolean);
        categories.length = 0;
        categories.push(...newCats);
        renderChecklists();
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

    function addCategory() {
        if (!stepRoot) return;
        const nameInput = stepRoot.querySelector('#categoryName');
        const name = nameInput.value.trim();
        if (!name) return;

        const newCat = {
            id: generateCategoryId(),
            name,
            type: selectedType,
            items: []
        };
        categories.push(newCat);
        expandedCategories.add(newCat.id); // Auto-expand new category
        renderChecklists();
    }

    function deleteCategory(catId) {
        showCustomConfirm('이 카테고리를 삭제하시겠습니까?', () => {
            const index = categories.findIndex(c => c.id === catId);
            if (index !== -1) {
                categories.splice(index, 1);
                renderChecklists();
            }
        });
    }

    function addItem(catId, text) {
        const cat = categories.find(c => c.id === catId);
        if (!cat) return;

        cat.items.push({
            id: generateItemId(),
            text,
            checked: false,
            priority: 'medium'
        });
        renderChecklists();
    }

    function deleteItem(catId, itemId) {
        const cat = categories.find(c => c.id === catId);
        if (!cat) return;
        cat.items = cat.items.filter(i => i.id !== itemId);
        renderChecklists();
    }


    function updatePriority(catId, itemId, priority) {
        const cat = categories.find(c => c.id === catId);
        if (!cat) return;
        const item = cat.items.find(i => i.id === itemId);
        if (item) item.priority = priority;
        renderChecklists(); // Re-render to update color class
    }

    function clearCategoryForm() {
        if (!stepRoot) return;
        const nameInput = stepRoot.querySelector('#categoryName');
        if (nameInput) nameInput.value = '';
        const btnAdd = stepRoot.querySelector('#btnAddCategory');
        if (btnAdd) btnAdd.disabled = true;
        stepRoot.querySelector('.category-add-button-container')?.classList.add('hidden');

        // Reset type selection
        selectedType = 'packing';
        stepRoot.querySelectorAll('.btn-type-select').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === 'packing');
        });
    }

    // Direct event assignment scoped to stepRoot
    if (stepRoot) {
        stepRoot.querySelector('#categoryName')?.addEventListener('input', validateCategoryForm);
        stepRoot.querySelector('#btnAddCategory')?.addEventListener('click', addCategory);

        // Type selection events
        stepRoot.querySelectorAll('.btn-type-select').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedType = btn.dataset.type;
                stepRoot.querySelectorAll('.btn-type-select').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    // --- Template & Import Functions ---

    function handleSaveTemplate() {
        if (categories.length === 0) {
            showCustomAlert('저장할 항목이 없습니다.');
            return;
        }
        showCustomPrompt('템플릿 이름을 입력하세요:', '나만의 체크리스트', (name) => {
            saveChecklistTemplate(name, JSON.parse(JSON.stringify(categories))); // Save deep copy
            showCustomAlert('템플릿이 저장되었습니다.');
        });
    }

    function importChecklist(sourceCategories) {
        if (!sourceCategories || sourceCategories.length === 0) return;

        const executeImport = () => {
            // Clear existing categories
            categories.length = 0;

            let addedCount = 0;
            sourceCategories.forEach(srcCat => {
                // Deep copy to create new IDs
                const newCat = {
                    id: generateCategoryId(),
                    name: srcCat.name,
                    type: srcCat.type || 'packing',
                    items: (srcCat.items || []).map(item => ({
                        id: generateItemId(),
                        text: typeof item === 'string' ? item : item.text,
                        checked: false,
                        priority: (typeof item === 'object' && item.priority) ? item.priority : 'medium'
                    }))
                };
                categories.push(newCat);
                addedCount++;
            });

            renderChecklists();
            showCustomAlert(`${addedCount}개 카테고리를 불러왔습니다.`);
        };

        if (categories.length > 0) {
            showCustomConfirm('템플릿을 불러오면 작성 중인 내용이 초기화됩니다.<br>그래도 불러오시겠습니까?', executeImport);
        } else {
            executeImport();
        }
    }

    function createImportModal() {
        // Create Modal Overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.display = 'flex';
        overlay.style.zIndex = '1000'; // High z-index

        // Modal Content
        overlay.innerHTML = `
            <div class="modal-content" style="width: 100%; max-width: 600px; height: 80vh; max-height: 700px; display: flex; flex-direction: column; padding: 0; border-radius: 12px; overflow: hidden;">
                <div class="modal-header" style="padding: 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: white;">
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700;">체크리스트 불러오기</h3>
                    <button type="button" class="btn-close-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #94a3b8;">&times;</button>
                </div>
                
                <div class="modal-body" style="flex: 1; display: flex; overflow: hidden; background: #f8fafc;">
                    <!-- Sidebar Tabs -->
                    <div class="import-tabs" style="width: 140px; background: white; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column;">
                        <button class="tab-btn active" data-tab="themes" style="padding: 12px; text-align: left; border: none; background: none; cursor: pointer; border-left: 3px solid transparent; color: #64748b; font-weight: 600;">추천 테마</button>
                        <button class="tab-btn" data-tab="templates" style="padding: 12px; text-align: left; border: none; background: none; cursor: pointer; border-left: 3px solid transparent; color: #64748b; font-weight: 600;">나만의 템플릿</button>
                        <button class="tab-btn" data-tab="history" style="padding: 12px; text-align: left; border: none; background: none; cursor: pointer; border-left: 3px solid transparent; color: #64748b; font-weight: 600;">지난 여행</button>
                    </div>

                    <!-- Content Area -->
                    <div class="import-content" style="flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column;">
                        <div id="tabContent" style="flex: 1; overflow-y: auto;">
                            <!-- List will be rendered here -->
                        </div>
                        
                        <!-- Preview Section -->
                        <div id="previewSection" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: none;">
                            <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #475569;">미리보기</h4>
                            <div id="previewList" style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; max-height: 150px; overflow-y: auto; font-size: 0.85rem; color: #64748b;">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer" style="padding: 16px; border-top: 1px solid #e2e8f0; background: white; display: flex; justify-content: flex-end; gap: 8px;">
                    <button type="button" class="btn-cancel-modal" style="padding: 8px 16px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer;">취소</button>
                    <button type="button" class="btn-confirm-import" disabled style="padding: 8px 16px; border: none; background: #64748b; color: white; border-radius: 6px; cursor: not-allowed;">불러오기</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        let selectedData = null;

        // Styles for active tab
        const updateTabs = (activeTab) => {
            overlay.querySelectorAll('.tab-btn').forEach(btn => {
                if (btn.dataset.tab === activeTab) {
                    btn.classList.add('active');
                    btn.style.color = '#3b82f6';
                    btn.style.background = '#eff6ff';
                    btn.style.borderLeftColor = '#3b82f6';
                } else {
                    btn.classList.remove('active');
                    btn.style.color = '#64748b';
                    btn.style.background = 'none';
                    btn.style.borderLeftColor = 'transparent';
                }
            });
            renderTabContent(activeTab);
            // Reset selection
            selectedData = null;
            updatePreview();
        };

        const renderTabContent = (tab) => {
            const container = overlay.querySelector('#tabContent');
            container.innerHTML = '';

            if (tab === 'themes') {
                Object.entries(CHECKLIST_THEMES).forEach(([key, theme]) => {
                    const card = createListCard(theme.name, `${theme.categories.length}개 카테고리`, () => selectItem(theme.categories));
                    container.appendChild(card);
                });
            } else if (tab === 'templates') {
                const templates = getChecklistTemplates();
                if (templates.length === 0) {
                    container.innerHTML = '<p style="color:#94a3b8; text-align:center; margin-top: 20px;">저장된 템플릿이 없습니다.</p>';
                } else {
                    templates.forEach(tpl => {
                        const card = createListCard(tpl.name, `${new Date(tpl.createdAt).toLocaleDateString()} 저장`, () => selectItem(tpl.categories), true, tpl.id);
                        container.appendChild(card);
                    });
                }
            } else if (tab === 'history') {
                const schedules = getAllSchedules();
                const validSchedules = schedules.filter(s => s.checklists && s.checklists.length > 0);

                if (validSchedules.length === 0) {
                    container.innerHTML = '<p style="color:#94a3b8; text-align:center; margin-top: 20px;">불러올 지난 여행기록이 없습니다.</p>';
                } else {
                    validSchedules.forEach(sch => {
                        const card = createListCard(sch.title, `${sch.startDate} 출발`, () => selectItem(sch.checklists));
                        container.appendChild(card);
                    });
                }
            }
        };

        const createListCard = (title, sub, onClick, isTemplate = false, id = null) => {
            const div = document.createElement('div');
            div.style.padding = '12px';
            div.style.border = '1px solid #e2e8f0';
            div.style.borderRadius = '6px';
            div.style.marginBottom = '8px';
            div.style.cursor = 'pointer';
            div.style.background = 'white';
            div.style.transition = 'all 0.2s';

            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:600; color:#334155;">${title}</div>
                    ${isTemplate ? '<button class="btn-del-tmpl" style="padding:2px 6px; font-size:0.7rem; color:#ef4444; border:1px solid #ef4444; border-radius:4px; background:white; cursor:pointer;">삭제</button>' : ''}
                </div>
                <div style="font-size:0.8rem; color:#94a3b8;">${sub}</div>
            `;

            div.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-del-tmpl')) {
                    e.stopPropagation();
                    showCustomConfirm('이 템플릿을 삭제하시겠습니까?', () => {
                        deleteChecklistTemplate(id);
                        renderTabContent('templates');
                    });
                    return;
                }

                overlay.querySelectorAll('#tabContent > div').forEach(d => {
                    d.style.borderColor = '#e2e8f0';
                    d.style.background = 'white';
                });
                div.style.borderColor = '#3b82f6';
                div.style.background = '#eff6ff';

                onClick();
            });
            return div;
        };

        const selectItem = (categories) => {
            selectedData = categories;
            updatePreview();
        };

        const updatePreview = () => {
            const previewSection = overlay.querySelector('#previewSection');
            const previewList = overlay.querySelector('#previewList');
            const btnImport = overlay.querySelector('.btn-confirm-import');

            if (!selectedData) {
                previewSection.style.display = 'none';
                btnImport.disabled = true;
                btnImport.style.background = '#cbd5e1';
                btnImport.style.cursor = 'not-allowed';
                return;
            }

            previewSection.style.display = 'block';
            btnImport.disabled = false;
            btnImport.style.background = '#3b82f6';
            btnImport.style.cursor = 'pointer';

            previewList.innerHTML = selectedData.map(cat => `
                <div style="margin-bottom:8px;">
                    <div style="font-weight:600;">• ${cat.name}</div>
                    <div style="padding-left:12px; font-size:0.8rem;">
                        ${(cat.items || []).map(i => (typeof i === 'string' ? i : i.text)).join(', ')}
                    </div>
                </div>
            `).join('');
        };

        overlay.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => updateTabs(btn.dataset.tab));
        });

        overlay.querySelector('.btn-close-modal').addEventListener('click', () => overlay.remove());
        overlay.querySelector('.btn-cancel-modal').addEventListener('click', () => overlay.remove());

        overlay.querySelector('.btn-confirm-import').addEventListener('click', () => {
            if (selectedData) {
                importChecklist(selectedData);
                overlay.remove();
            }
        });

        updateTabs('themes');
    }





    function showCustomPrompt(message, defaultValue, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.display = 'flex';
        overlay.style.zIndex = '2000';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:350px; padding: 0; overflow:hidden;">
                <div class="modal-header" style="padding:16px; border-bottom:1px solid #f1f5f9; background:white;">
                    <h3 style="margin:0; font-size:1.1rem; color:#1e293b;">${message}</h3>
                </div>
                <div class="modal-body" style="padding:20px 16px;">
                    <input type="text" value="${defaultValue}" style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:6px; font-size:1rem; outline:none;">
                </div>
                <div class="modal-footer" style="padding:12px; display:flex; gap:10px; justify-content:flex-end; border-top:1px solid #f1f5f9; background:#f8fafc;">
                    <button class="btn-cancel" style="padding: 8px 16px; border:1px solid #cbd5e1; background:white; border-radius:6px; cursor:pointer; color:#64748b;">취소</button>
                    <button class="btn-confirm" style="padding: 8px 16px; border:none; background:#3b82f6; border-radius:6px; cursor:pointer; color:white; font-weight:600;">저장</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        const input = overlay.querySelector('input');
        input.focus();
        input.setSelectionRange(0, input.value.length);

        // Handle Enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const val = input.value.trim();
                if (val) {
                    overlay.remove();
                    onConfirm(val);
                }
            }
        });

        overlay.querySelector('.btn-cancel').addEventListener('click', () => overlay.remove());
        overlay.querySelector('.btn-confirm').addEventListener('click', () => {
            const val = input.value.trim();
            if (val) {
                overlay.remove();
                onConfirm(val);
            }
        });
    }

    return {
        renderChecklists,
        getChecklists: () => categories
    };
}
