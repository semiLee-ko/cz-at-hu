
import { showCustomAlert, showCustomConfirm } from '../../utils/modalUtils.js';

export function createTipManager(container, schedule) {
    // Scope selectors to this specific step to avoid conflicts with other steps sharing same classes
    const stepRoot = container.querySelector('.form-step[data-step="5"]');

    let tips = schedule.tips || [];
    let editingTipId = null;
    let draggedItem = null;
    let globalDragListenersAttached = false;

    function attachTipEventListeners() {
        if (!stepRoot) return;
        const tipsContainer = stepRoot.querySelector('#tipsContainer');
        const formSection = stepRoot.querySelector('.tip-form-section');

        tipsContainer.querySelectorAll('.day-header').forEach(header => {
            if (!header.dataset.listenerAttached) {
                header.addEventListener('click', (e) => {
                    if (e.target.closest('.drag-handle')) return;
                    header.closest('.day-card').classList.toggle('collapsed');
                });
                header.dataset.listenerAttached = 'true';
            }
        });

        tipsContainer.querySelectorAll('.btn-delete-tip-icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tipId = btn.dataset.tipId || btn.closest('.btn-delete-tip-icon').dataset.tipId;
                deleteTip(tipId);
            });
        });

        // 1. Attach Item Drag Listeners (Handles)
        attachItemDragListeners(tipsContainer, formSection);

        // 2. Attach Global Drag Listeners (Container & Form) - Once
        if (!globalDragListenersAttached) {
            attachGlobalDragListeners(tipsContainer, formSection);
            globalDragListenersAttached = true;
        }
    }

    function attachItemDragListeners(tipsContainer, formSection) {
        tipsContainer.querySelectorAll('.drag-handle').forEach(handle => {
            handle.addEventListener('dragstart', (e) => {
                const item = handle.closest('.day-card');
                draggedItem = item;
                e.dataTransfer.setData('text/plain', item.dataset.tipId);
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => item.classList.add('dragging'), 0);
                item.classList.add('collapsed');
            });
            handle.addEventListener('dragend', () => resetDragState(formSection));

            // Touch events
            handle.addEventListener('touchstart', (e) => {
                if (e.cancelable) e.preventDefault();
                const item = handle.closest('.day-card');
                draggedItem = item;
                item.classList.add('dragging');
                item.classList.add('collapsed');
            }, { passive: false });
        });
    }

    function attachGlobalDragListeners(tipsContainer, formSection) {
        tipsContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedItem) handleDragOverList(tipsContainer, e.clientY);
        });

        tipsContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedItem) handleDropList(tipsContainer);
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

        tipsContainer.addEventListener('touchmove', (e) => {
            if (!draggedItem) return;
            if (e.cancelable) e.preventDefault();
            const touch = e.touches[0];
            const fingerEl = document.elementFromPoint(touch.clientX, touch.clientY);

            if (formSection && (formSection === fingerEl || formSection.contains(fingerEl))) {
                formSection.classList.add('drag-over');
                if (placeholder?.parentNode) placeholder.parentNode.removeChild(placeholder);
            } else {
                if (formSection) formSection.classList.remove('drag-over');
                handleDragOverList(tipsContainer, touch.clientY);
            }
        }, { passive: false });

        tipsContainer.addEventListener('touchend', (e) => {
            if (!draggedItem) return;
            if (formSection?.classList.contains('drag-over')) {
                handleDropForm(formSection, draggedItem.dataset.tipId);
            } else {
                handleDropList(tipsContainer);
            }
            resetDragState(formSection);
        });
    }
    // Real-time validation for tip form
    function validateTipForm() {
        if (!stepRoot) return;
        const titleInput = stepRoot.querySelector('#tipTitle');
        const contentInput = stepRoot.querySelector('#tipContent');
        const btnAdd = stepRoot.querySelector('#btnAddTip');
        const btnContainer = stepRoot.querySelector('.tip-add-button-container');
        const validationMsg = stepRoot.querySelector('#tipValidationMsg');

        if (!titleInput || !contentInput || !btnAdd) return;

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        // Allowed: Korean, English, Numbers, Space and ~!%^&*()-_+=:"',.[]
        const allowedRegex = /^[가-힣a-zA-Z0-9~!%^&*()\-=_+=\:"',.\[\]\s]*$/;

        let error = '';

        if (title.length > 0 || content.length > 0) {
            if (!allowedRegex.test(title)) {
                error = '제목에 허용되지 않는 문자가 포함되어 있습니다.';
            } else if (!allowedRegex.test(content)) {
                error = '내용에 허용되지 않는 문자가 포함되어 있습니다.';
            } else if (title.length > 50) {
                error = '제목은 50자 이내로 입력해주세요.';
            } else if (content.length > 200) {
                error = '내용은 200자 이내로 입력해주세요.';
            } else if (title.length < 2 || content.length < 2) {
                // Keep the "at least 2 chars" rule but don't show error yet if it's just partially typed
                // Just keep button hidden
            }
        }

        if (validationMsg) {
            validationMsg.textContent = error;
        }

        const isValid = !error && title.length >= 2 && content.length >= 2;
        btnAdd.disabled = !isValid;

        if (btnContainer) {
            btnContainer.classList.toggle('hidden', !isValid || !!error);
        }
    }

    function renderTips() {
        if (!stepRoot) return;
        const tipsContainer = stepRoot.querySelector('#tipsContainer');

        if (tips.length === 0) {
            tipsContainer.innerHTML = '<p class="no-events">등록된 내용이 없습니다.</p>';
        } else {
            tipsContainer.innerHTML = tips.map(tip => `
                <div class="day-card tip-card collapsed" data-tip-id="${tip.id}">
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
                            <span class="day-badge">TIP</span>
                            <span class="day-date">${tip.title}</span>
                        </div>
                        <svg class="collapse-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                    <div class="events-list tip-content-wrapper">
                        <div class="tip-content-inner">
                            <div class="tip-body">
                                <p>${tip.content}</p>
                            </div>
                            <button type="button" class="btn-delete-tip-icon" data-tip-id="${tip.id}" title="삭제">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // 2. Render Guide separately at the bottom
        const guideContainer = stepRoot.querySelector('#tipGuide');
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
                목록의 왼쪽 이동버튼을 끌어서 순서변경이 가능하고, 새 팁 작성 영역에 끌어다 놓으면 수정이 가능합니다.
            `;
        }

        attachTipEventListeners();
        clearTipForm();
        validateTipForm();
    }

    function attachTipEventListeners() {
        if (!stepRoot) return;
        const tipsContainer = stepRoot.querySelector('#tipsContainer');
        const formSection = stepRoot.querySelector('.tip-form-section');

        tipsContainer.querySelectorAll('.day-header').forEach(header => {
            if (!header.dataset.listenerAttached) {
                header.addEventListener('click', (e) => {
                    if (e.target.closest('.drag-handle')) return;
                    header.closest('.day-card').classList.toggle('collapsed');
                });
                header.dataset.listenerAttached = 'true';
            }
        });

        tipsContainer.querySelectorAll('.btn-delete-tip-icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tipId = btn.dataset.tipId || btn.closest('.btn-delete-tip-icon').dataset.tipId;
                deleteTip(tipId);
            });
        });

        // 1. Attach Item Drag Listeners (Handles)
        attachItemDragListeners(tipsContainer, formSection);

        // 2. Attach Global Drag Listeners (Container & Form) - Once
        if (!globalDragListenersAttached) {
            attachGlobalDragListeners(tipsContainer, formSection);
            globalDragListenersAttached = true;
        }
    }

    function attachItemDragListeners(tipsContainer, formSection) {
        tipsContainer.querySelectorAll('.drag-handle').forEach(handle => {
            handle.addEventListener('dragstart', (e) => {
                const item = handle.closest('.day-card');
                draggedItem = item;
                e.dataTransfer.setData('text/plain', item.dataset.tipId);
                e.dataTransfer.effectAllowed = 'copyMove';
                setTimeout(() => item.classList.add('dragging'), 0);
                item.classList.add('collapsed');
            });
            handle.addEventListener('dragend', () => resetDragState(formSection));

            // Touch events
            handle.addEventListener('touchstart', (e) => {
                if (e.cancelable) e.preventDefault();
                const item = handle.closest('.day-card');
                draggedItem = item;
                item.classList.add('dragging');
                item.classList.add('collapsed');
            }, { passive: false });
        });
    }

    function attachGlobalDragListeners(tipsContainer, formSection) {
        tipsContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedItem) handleDragOverList(tipsContainer, e.clientY);
        });

        tipsContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedItem) handleDropList(tipsContainer);
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

        tipsContainer.addEventListener('touchmove', (e) => {
            if (!draggedItem) return;
            if (e.cancelable) e.preventDefault();
            const touch = e.touches[0];
            const fingerEl = document.elementFromPoint(touch.clientX, touch.clientY);

            if (formSection && (formSection === fingerEl || formSection.contains(fingerEl))) {
                formSection.classList.add('drag-over');
                if (placeholder?.parentNode) placeholder.parentNode.removeChild(placeholder);
            } else {
                if (formSection) formSection.classList.remove('drag-over');
                handleDragOverList(tipsContainer, touch.clientY);
            }
        }, { passive: false });

        tipsContainer.addEventListener('touchend', (e) => {
            if (!draggedItem) return;
            if (formSection?.classList.contains('drag-over')) {
                handleDropForm(formSection, draggedItem.dataset.tipId);
            } else {
                handleDropList(tipsContainer);
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
        const newTips = Array.from(container.querySelectorAll('.day-card'))
            .map(el => tips.find(t => t.id === el.dataset.tipId))
            .filter(Boolean);
        tips.length = 0;
        tips.push(...newTips);
        renderTips();
    }

    function handleDropForm(formSection, tipId) {
        formSection.classList.remove('drag-over');
        if (tipId) {
            editTip(tipId);
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

    function addOrUpdateTip() {
        if (!stepRoot) return;
        const titleInput = stepRoot.querySelector('#tipTitle');
        const contentInput = stepRoot.querySelector('#tipContent');
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title) return showCustomAlert('제목을 입력해주세요.');
        if (!content) return showCustomAlert('내용을 입력해주세요.');

        if (editingTipId) {
            const index = tips.findIndex(t => t.id === editingTipId);
            if (index !== -1) tips[index] = { ...tips[index], title, content };
        } else {
            tips.push({ id: generateTipId(), title, content });
        }
        renderTips();
    }

    function editTip(tipId) {
        if (!stepRoot) return;
        const tip = tips.find(t => t.id === tipId);
        if (!tip) return;

        editingTipId = tipId;
        stepRoot.querySelector('#tipTitle').value = tip.title;
        stepRoot.querySelector('#tipContent').value = tip.content;
        if (stepRoot.querySelector('#tipFormTitle')) stepRoot.querySelector('#tipFormTitle').textContent = '팁 수정';

        if (!stepRoot.querySelector('.btn-close-edit')) {
            const btnClose = document.createElement('button');
            btnClose.className = 'btn-close-edit';
            btnClose.type = 'button';
            btnClose.title = '편집 취소';
            btnClose.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            btnClose.addEventListener('click', clearTipForm);
            stepRoot.querySelector('.tip-form-section')?.appendChild(btnClose);
        }
        stepRoot.querySelector('.tip-form-section').scrollIntoView({ behavior: 'smooth' });
        validateTipForm();
    }

    function deleteTip(tipId) {
        showCustomConfirm('이 팁을 삭제하시겠습니까?', () => {
            tips = tips.filter(t => t.id !== tipId);
            renderTips();
        });
    }

    function clearTipForm() {
        if (!stepRoot) return;
        if (stepRoot.querySelector('#tipTitle')) stepRoot.querySelector('#tipTitle').value = '';
        if (stepRoot.querySelector('#tipContent')) stepRoot.querySelector('#tipContent').value = '';
        if (stepRoot.querySelector('#btnAddTip')) stepRoot.querySelector('#btnAddTip').disabled = true;
        stepRoot.querySelector('.tip-add-button-container')?.classList.add('hidden');
        editingTipId = null;
        if (stepRoot.querySelector('#tipFormTitle')) stepRoot.querySelector('#tipFormTitle').textContent = '새 팁 작성';
        if (stepRoot.querySelector('#tipValidationMsg')) stepRoot.querySelector('#tipValidationMsg').textContent = '';
        stepRoot.querySelector('.btn-close-edit')?.remove();
    }

    // Direct event assignment scoped to stepRoot
    if (stepRoot) {
        stepRoot.querySelector('#tipTitle')?.addEventListener('input', validateTipForm);
        stepRoot.querySelector('#tipContent')?.addEventListener('input', validateTipForm);
        stepRoot.querySelector('#btnAddTip')?.addEventListener('click', addOrUpdateTip);
    }

    return {
        renderTips,
        getTips: () => tips
    };
}
