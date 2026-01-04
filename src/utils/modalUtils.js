
export function showCustomAlert(message) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    overlay.style.zIndex = '2000';
    overlay.innerHTML = `
        <div class="modal-content" style="max-width:350px; text-align:center; padding: 0; overflow:hidden;">
            <div class="modal-body" style="padding:24px 20px;">
                <p style="margin:0; font-size:1rem; color:#334155; line-height:1.5;">${message}</p>
            </div>
            <div class="modal-footer" style="padding:12px; justify-content:center; border-top:1px solid #f1f5f9; background: #f8fafc;">
                <button class="btn-primary-modal" style="width:100%; padding: 10px; border-radius: 6px; cursor: pointer; border:none; background:#3b82f6; color:white; font-weight:600;">확인</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('button').addEventListener('click', () => overlay.remove());
}

export function showCustomConfirm(message, onConfirm, options = {}) {
    // defaults
    const confirmText = options.confirmText || '삭제';
    const confirmColor = options.confirmColor || '#ef4444'; // default red for consistency with current usage
    const onCancel = options.onCancel;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    overlay.style.zIndex = '2000';
    overlay.innerHTML = `
        <div class="modal-content" style="max-width:350px; text-align:center; padding: 0; overflow:hidden;">
            <div class="modal-body" style="padding:24px 20px;">
                <p style="margin:0; font-size:1rem; color:#334155; line-height:1.5;">${message}</p>
            </div>
            <div class="modal-footer" style="padding:12px; display:flex; gap:10px; justify-content:center; border-top:1px solid #f1f5f9; background: #f8fafc;">
                <button class="btn-cancel" style="flex:1; padding: 10px; border:1px solid #cbd5e1; background:white; border-radius:6px; cursor:pointer; color:#64748b;">취소</button>
                <button class="btn-confirm" style="flex:1; padding: 10px; border:none; background:${confirmColor}; border-radius:6px; cursor:pointer; color:white; font-weight:600;">${confirmText}</button>
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
