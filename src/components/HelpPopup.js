import { SDK } from '../utils/sdkUtils.js';

/**
 * Help Popup Component
 * Explains key features of the application.
 */
export function showHelpPopup() {
    const existing = document.querySelector('.bottom-sheet-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'bottom-sheet-overlay';

    overlay.innerHTML = `
        <div class="bottom-sheet-content">
            <div class="bottom-sheet-header">
                <h3>Little Trip 사용 가이드</h3>
                <button class="btn-close" aria-label="닫기">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="help-body">
                <div class="help-section">
                    <h4>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        스마트하게 즐기는 Little Trip
                    </h4>
                    <p>로그인 없이도 모든 기능을 자유롭게 이용할 수 있습니다. Little Trip의 특별한 핵심 기능들을 확인해보세요.</p>
                </div>

                <div class="help-feature-list" style="grid-template-columns: 1fr;">
                    <div class="help-feature-item">
                        <div class="feature-icon" style="color: #3b82f6;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-14 8.38 8.38 0 0 1 3.8.9L21 3.5z"></path>
                            </svg>
                        </div>
                        <div class="feature-title">똑똑한 AI 가이드</div>
                        <div class="feature-desc">나의 여행 일정을 바탕으로, 등록된 여행정보에 한하여 AI 가이드가 요약해서 답변해 드려요.(예-'이 여행에서 사용한 총 지출비용은 얼마야?')
                            <br><br>
                            <span style="color: var(--primary); font-weight: 600;">💡 </span> 등록되지 않은 정보는 AI가 답변하지 않아요.
                        </div>
                    </div>

                    <div class="help-feature-item">
                        <div class="feature-icon" style="color: #10b981;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                                <polyline points="16 6 12 2 8 6"></polyline>
                                <line x1="12" y1="2" x2="12" y2="15"></line>
                            </svg>
                        </div>
                        <div class="feature-title">비로그인 공유 & 가져오기</div>
                        <div class="feature-desc">
                            별도의 가입 없이 *URL 링크*로 일정을 즉시 공유할 수 있어요. 
                            <br><br>
                            <span style="color: var(--primary); font-weight: 600;">💡 꿀팁:</span> 일정이 너무 길어 URL 공유 시 오류가 발생한다면, *JSON 파일*로 내보내고 가져오기를 통해 안전하게 일정을 주고받을 수 있어요.
                        </div>
                    </div>

                    <div class="help-feature-item">
                        <div class="feature-icon" style="color: #f59e0b;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="10" r="3"></circle>
                                <path d="M22 10c0 5.843-10 12-10 12S2 15.843 2 10a10 10 0 1 1 20 0z"></path>
                            </svg>
                        </div>
                        <div class="feature-title">간편한 여행지 등록</div>
                        <div class="feature-desc">가고 싶은 목적지를 빠르게 검색하고 등록하여 나만의 완벽한 동선을 설계해보세요.</div>
                    </div>
                </div>
            </div>
            <div class="bottom-sheet-footer">
                <button class="btn-close-help">이해했어요</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Event Listeners
    const closeBtn = overlay.querySelector('.btn-close');
    const closeBtnFooter = overlay.querySelector('.btn-close-help');

    const closePopup = () => {
        SDK.haptic('impactLight');
        overlay.style.animation = 'fadeOut 0.3s ease forwards';
        overlay.querySelector('.bottom-sheet-content').style.animation = 'slideDownBottomOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        setTimeout(() => overlay.remove(), 300);
    };

    closeBtn.onclick = closePopup;
    closeBtnFooter.onclick = closePopup;
    overlay.onclick = (e) => {
        if (e.target === overlay) closePopup();
    };

    // Add close animation to CSS dynamically if not present
    if (!document.getElementById('help-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'help-animation-styles';
        style.textContent = `
            @keyframes slideDownBottomOut {
                from { transform: translateY(0); }
                to { transform: translateY(100%); }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}
