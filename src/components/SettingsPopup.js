// 설정 팝업 컴포넌트

const SETTINGS_KEY = 'app_settings';

// 기본 설정
const defaultSettings = {
    fontScale: 0, // 0 to 3
    theme: 'light' // 'light' or 'dark'
};

// 설정 가져오기
function getSettings() {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch (e) {
        return defaultSettings;
    }
}

// 설정 저장하기
function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    applySettings(settings);
}

// 설정 적용하기 (DOM 조작)
export function applySettings(settings = null) {
    if (!settings) settings = getSettings();

    // Font Scale
    const scale = parseInt(settings.fontScale) || 0;
    document.documentElement.style.setProperty('--font-scale', `${scale}px`);
    document.documentElement.style.setProperty('--font-scale-factor', scale);

    // Theme
    document.documentElement.setAttribute('data-theme', settings.theme);
    console.log('Applied Settings:', settings, 'Font Scale Factor:', document.documentElement.style.getPropertyValue('--font-scale-factor'));
}

// 팝업 표시
export function showSettingsPopup() {
    const settings = getSettings();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
        <div class="modal-content settings-popup">
            <div class="modal-header">
                <h3>앱 설정</h3>
                <button class="btn-close" aria-label="닫기">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <!-- Font Size -->
                <div class="settings-group">
                    <label class="settings-label">글자 크기</label>
                    <div class="font-size-control">
                        <span style="font-size: 0.8rem">가</span>
                        <input type="range" class="font-size-slider" min="0" max="3" step="1" value="${settings.fontScale}">
                        <span style="font-size: 1.2rem; font-weight: bold;">가</span>
                        <span class="font-size-value" style="min-width: 30px; text-align: center; margin-left: 10px; font-weight: bold; color: #FF6B6B;">+${settings.fontScale}px</span>
                    </div>
                </div>

                <div class="divider"></div>

                <!-- Theme -->
                <div class="settings-group">
                    <label class="settings-label">테마 설정</label>
                    <div class="theme-options">
                        <label class="theme-option">
                            <input type="radio" name="theme" value="light" ${settings.theme === 'light' ? 'checked' : ''}>
                            <div class="theme-card">
                                <span class="theme-preview-white"></span>
                                <span class="theme-name">화이트</span>
                            </div>
                        </label>
                        <label class="theme-option">
                            <input type="radio" name="theme" value="dark" ${settings.theme === 'dark' ? 'checked' : ''}>
                            <div class="theme-card">
                                <span class="theme-preview-black"></span>
                                <span class="theme-name">다크</span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Event Listeners
    const closeBtn = overlay.querySelector('.btn-close');
    const close = () => {
        overlay.classList.add('fade-out'); // Optional animation class if defined, or just remove
        overlay.remove();
    };

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    // Font Size Slider Logic
    const slider = overlay.querySelector('.font-size-slider');
    const valueDisplay = overlay.querySelector('.font-size-value');
    const labelDisplay = overlay.querySelector('.settings-label');

    slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        valueDisplay.textContent = `+${val}px`;
        labelDisplay.textContent = `글자 크기 (기본 + ${val}px)`;

        // Apply immediately
        const current = getSettings();
        current.fontScale = val;
        saveSettings(current);
    });

    // Theme Logic
    const themeInputs = overlay.querySelectorAll('input[name="theme"]');
    themeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const val = e.target.value;
            const current = getSettings();
            current.theme = val;
            saveSettings(current);
        });
    });
}
