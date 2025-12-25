// Checklist Management Module
// Handles categories and items in an accordion style

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

        if (categories.length === 0) {
            checklistsContainer.innerHTML = '<p class="no-events">카테고리를 추가하여 여행 준비를 시작해보세요.</p>';
        } else {
            checklistsContainer.innerHTML = categories.map(cat => {
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
        if (confirm('이 카테고리를 삭제하시겠습니까?')) {
            const index = categories.findIndex(c => c.id === catId);
            if (index !== -1) {
                categories.splice(index, 1);
                renderChecklists();
            }
        }
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

    return {
        renderChecklists,
        getChecklists: () => categories
    };
}
