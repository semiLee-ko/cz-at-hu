
export function showCustomAlert(message) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-content" style="max-width:320px; text-align:center;">
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn-primary-modal" style="width:100%;">확인</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('button').addEventListener('click', () => overlay.remove());
}

export function showCustomConfirm(message, onConfirm, options = {}) {
    // defaults
    const confirmText = options.confirmText || '삭제';
    const confirmColor = options.confirmColor || '#ef4444';
    const onCancel = options.onCancel;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-content" style="max-width:320px; text-align:center;">
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn-cancel">취소</button>
                <button class="btn-confirm" style="background:${confirmColor};">${confirmText}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const closeWithCancel = () => {
        overlay.remove();
        if (onCancel) onCancel();
    };

    overlay.querySelector('.btn-cancel').addEventListener('click', closeWithCancel);
    overlay.querySelector('.btn-confirm').addEventListener('click', () => {
        overlay.remove();
        onConfirm();
    });
}

export function showCustomPrompt(message, defaultValue, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-content" style="max-width:350px;">
            <div class="modal-header">
                <h3>${message}</h3>
            </div>
            <div class="modal-body" style="padding-top:0;">
                <div class="url-box">
                    <input type="text" value="${defaultValue}" style="text-align:left;">
                </div>
            </div>
            <div class="modal-footer" style="justify-content:flex-end;">
                <button class="btn-cancel" style="flex:none; width:auto;">취소</button>
                <button class="btn-confirm" style="flex:none; width:auto; background:var(--secondary);">저장</button>
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
