// Tip Management Module
// Handles adding, editing, and deleting tips in an accordion style

export function createTipManager(container, schedule) {
    let tips = schedule.tips || [];
    let editingTipId = null;

    function generateTipId() {
        return 'tip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function renderTips() {
        const tipsContainer = container.querySelector('#tipsContainer');

        if (tips.length === 0) {
            tipsContainer.innerHTML = '<p class="no-events">작성된 팁이 없습니다. 새로운 팁을 추가해보세요.</p>';
        } else {
            tipsContainer.innerHTML = tips.map(tip => `
                <div class="tip-item accordion-item" data-tip-id="${tip.id}">
                    <div class="tip-header accordion-header">
                        <span class="tip-title">${tip.title}</span>
                        <div class="tip-actions">
                            <span class="accordion-icon">Checking...</span>
                        </div>
                    </div>
                    <div class="tip-content accordion-content">
                        <div class="tip-body">
                            <p>${tip.content.replace(/\n/g, '<br>')}</p>
                        </div>
                        <div class="tip-footer">
                            <button type="button" class="btn-edit-tip" data-tip-id="${tip.id}">수정</button>
                            <button type="button" class="btn-delete-tip" data-tip-id="${tip.id}">삭제</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Add event listeners (Accordion toggle, Edit, Delete)
        attachTipEventListeners();

        // Reset form
        clearTipForm();
    }

    function attachTipEventListeners() {
        const tipsContainer = container.querySelector('#tipsContainer');

        // Accordion Toggle
        tipsContainer.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const item = header.closest('.accordion-item');
                const wasActive = item.classList.contains('active');

                // Close all other items (optional, but good for focus) - disabled for now to allow multiple open
                // tipsContainer.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));

                item.classList.toggle('active');
                const icon = header.querySelector('.accordion-icon');
                // Icon updates via CSS usually, but we can do text change if needed
            });
        });

        // Edit Tip
        tipsContainer.querySelectorAll('.btn-edit-tip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent accordion toggle
                const tipId = btn.dataset.tipId;
                editTip(tipId);
            });
        });

        // Delete Tip
        tipsContainer.querySelectorAll('.btn-delete-tip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent accordion toggle
                const tipId = btn.dataset.tipId;
                deleteTip(tipId);
            });
        });
    }

    function addOrUpdateTip() {
        const titleInput = container.querySelector('#tipTitle');
        const contentInput = container.querySelector('#tipContent');
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title) {
            alert('제목을 입력해주세요.');
            return;
        }
        if (!content) {
            alert('내용을 입력해주세요.');
            return;
        }

        if (editingTipId) {
            // Update existing
            const index = tips.findIndex(t => t.id === editingTipId);
            if (index !== -1) {
                tips[index] = { ...tips[index], title, content };
            }
        } else {
            // Add new
            tips.push({
                id: generateTipId(),
                title,
                content
            });
        }

        renderTips();
    }

    function editTip(tipId) {
        const tip = tips.find(t => t.id === tipId);
        if (!tip) return;

        editingTipId = tipId;

        const titleInput = container.querySelector('#tipTitle');
        const contentInput = container.querySelector('#tipContent');
        const btnAdd = container.querySelector('#btnAddTip');
        const formTitle = container.querySelector('#tipFormTitle');

        titleInput.value = tip.title;
        contentInput.value = tip.content;
        btnAdd.textContent = '수정 완료';

        // Change form title and add cancel button if needed
        if (formTitle) formTitle.textContent = '팁 수정';

        // Show cancel button logic could be added here
        let btnCancel = container.querySelector('#btnCancelTipEdit');
        if (!btnCancel) {
            btnCancel = document.createElement('button');
            btnCancel.id = 'btnCancelTipEdit';
            btnCancel.type = 'button';
            btnCancel.className = 'btn-secondary';
            btnCancel.textContent = '취소';
            btnCancel.style.marginLeft = '10px';
            btnCancel.addEventListener('click', clearTipForm);
            btnAdd.parentNode.appendChild(btnCancel);
        }

        // Scroll to form
        container.querySelector('.tip-form-section').scrollIntoView({ behavior: 'smooth' });
    }

    function deleteTip(tipId) {
        if (!confirm('이 팁을 삭제하시겠습니까?')) return;
        tips = tips.filter(t => t.id !== tipId);
        renderTips();
    }

    function clearTipForm() {
        const titleInput = container.querySelector('#tipTitle');
        const contentInput = container.querySelector('#tipContent');
        const btnAdd = container.querySelector('#btnAddTip');
        const formTitle = container.querySelector('#tipFormTitle');
        const btnCancel = container.querySelector('#btnCancelTipEdit');

        titleInput.value = '';
        contentInput.value = '';
        btnAdd.textContent = '+ 팁 추가';
        editingTipId = null;

        if (formTitle) formTitle.textContent = '새 팁 작성';
        if (btnCancel) btnCancel.remove();
    }

    // Initialize Add Button
    const btnAddTip = container.querySelector('#btnAddTip');
    // Note: The button might not exist if HTML isn't rendered yet when this runs
    // But we usually attach this after HTML render in ScheduleEditor.js
    // We'll provide a init function or just attaching it if it exists

    // Actually, following other managers, we usually attach events in the render loop or expose methods
    // But since the form is static in the step, we can attach listener if the element exists.
    if (btnAddTip) {
        btnAddTip.addEventListener('click', addOrUpdateTip);
    }

    // Also export setup function to be called after innerHTML update
    function setupEventListeners() {
        const btn = container.querySelector('#btnAddTip');
        if (btn) {
            // Remove old listener to prevent duplicates if called multiple times? 
            // Better to use a clean initialization
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', addOrUpdateTip);
        }
    }

    return {
        renderTips,
        getTips: () => tips,
        setupEventListeners
    };
}
