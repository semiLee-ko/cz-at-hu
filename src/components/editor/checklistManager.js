// Checklist Management Module
// Handles checklist tabs, categories, and items

export function createChecklistManager(container, schedule) {
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

        attachChecklistEventListeners(tabName);
    }

    function attachChecklistEventListeners(tabName) {
        const containerId = tabName === 'packing' ? 'packingCategories' : 'todoCategories';
        const categoriesContainer = container.querySelector(`#${containerId}`);

        categoriesContainer.querySelectorAll('.btn-delete-category').forEach(btn => {
            btn.addEventListener('click', () => deleteCategory(tabName, btn.dataset.categoryId));
        });

        categoriesContainer.querySelectorAll('.btn-add-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = categoriesContainer.querySelector(`.item-input[data-category-id="${btn.dataset.categoryId}"]`);
                if (input.value.trim()) {
                    addItem(tabName, btn.dataset.categoryId, input.value.trim());
                    input.value = '';
                }
            });
        });

        categoriesContainer.querySelectorAll('.item-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && input.value.trim()) {
                    addItem(tabName, input.dataset.categoryId, input.value.trim());
                    input.value = '';
                }
            });
        });

        categoriesContainer.querySelectorAll('.checklist-item input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => toggleItem(tabName, cb.dataset.itemId, cb.checked));
        });

        categoriesContainer.querySelectorAll('.priority-select').forEach(select => {
            select.addEventListener('change', () => updatePriority(tabName, select.dataset.itemId, select.value));
        });

        categoriesContainer.querySelectorAll('.btn-delete-item').forEach(btn => {
            btn.addEventListener('click', () => deleteItem(tabName, btn.dataset.itemId));
        });

        categoriesContainer.querySelectorAll('.btn-move-up').forEach(btn => {
            btn.addEventListener('click', () => moveItem(tabName, btn.dataset.itemId, 'up'));
        });

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

            [category.items[itemIndex], category.items[newIndex]] =
                [category.items[newIndex], category.items[itemIndex]];
        });
        renderChecklists(tabName);
    }

    // Initialize tab switching
    container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Initialize add category buttons
    container.querySelectorAll('.btn-add-category').forEach(btn => {
        btn.addEventListener('click', () => addCategory(btn.dataset.tab));
    });

    return {
        renderChecklists,
        switchTab,
        getChecklists: () => checklists
    };
}
