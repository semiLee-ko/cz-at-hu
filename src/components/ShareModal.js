// 공유 모달 컴포넌트

import { getSchedule, saveSchedule } from '../storage.js';
import { generateShareUrl, downloadAsJson, copyToClipboard, parseScheduleFromUrlString, uploadFromJson } from '../share.js';

export function showShareModal(scheduleId) {
    const schedule = getSchedule(scheduleId);
    if (!schedule) return;

    const shareUrl = generateShareUrl(schedule);

    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>일정 공유하기</h3>
                <button class="btn-close" id="btnCloseModal">✕</button>
            </div>
            
            <div class="modal-body">
                <div class="share-section">
                    <h4>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        링크로 공유
                    </h4>
                    <p class="hint">이 링크를 카톡이나 메신저로 보내세요!</p>
                    <div class="url-box">
                        <input type="text" readonly value="${shareUrl}" id="shareUrlInput">
                        <button class="btn-primary" id="btnCopyUrl" title="링크 복사">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </div>
                    <div id="copyStatus" class="status-message"></div>
                </div>
                
                <div class="share-section">
                    <h4>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        JSON 파일로 저장
                    </h4>
                    <p class="hint">파일을 다운로드해서 공유할 수도 있어요</p>
                    <button class="btn-secondary" id="btnDownloadJson">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        JSON 다운로드
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // URL 복사
    modal.querySelector('#btnCopyUrl').addEventListener('click', async () => {
        const success = await copyToClipboard(shareUrl);
        const status = modal.querySelector('#copyStatus');
        if (success) {
            status.textContent = '링크가 복사되었습니다!';
            status.className = 'status-message success';
        } else {
            status.textContent = '복사 실패. 직접 선택해서 복사해주세요.';
            status.className = 'status-message error';
        }
        setTimeout(() => status.textContent = '', 3000);
    });

    // JSON 다운로드
    modal.querySelector('#btnDownloadJson').addEventListener('click', () => {
        downloadAsJson(schedule);
    });

    // 모달 닫기
    const closeModal = () => modal.remove();
    modal.querySelector('#btnCloseModal').addEventListener('click', closeModal);
    modal.querySelector('#btnCloseModalFooter').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// JSON 파일 및 URL 가져오기 모달
export function showImportModal(onImport) { // onImport handles file object, we need to adapt it or handle schedule object directly
    // Ideally onImport should accept a schedule OBJECT, not just a file. 
    // But main.js passes a callback that expects a file: async (file) => uploadFromJson(file)
    // We need to refactor main.js logic slightly or handle the divergence here.
    // The previous implementation in main.js: 
    // showImportModal(async (file) => { const schedule = await uploadFromJson(file); ... })

    // To support both, we'll change showImportModal to take `importCallback` which simply receives the SCHEDULE object.
    // We will do the parsing (JSON file or URL) inside this modal logic or helpers, then pass standard schedule object to main.js.

    // But since I cannot change main.js in this single step easily without breaking, 
    // let's look at how main.js uses it: 
    // showImportModal(async (file) => { ... uploadFromJson(file) ... })
    // It expects a file. 

    // So if we have a URL, we parse it to object. 
    // We should probably change the callback signature in main.js to accept (schedule) object instead of file.

    // Wait, let's keep it simple. We can handle the parsing HERE, and pass the RESULTING schedule object to a new callback.
    // But the existing callback expects a file.
    // Let's assume we will update main.js next. OR we can handle it here and if the callback expects a file... that's tricky.

    // Let's redefine showImportModal to take (onScheduleLoaded).
    // And in the next step, I will update main.js to pass a callback that takes a Schedule Object, not a File.

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>일정 가져오기</h3>
                <button class="btn-close" id="btnCloseModal">✕</button>
            </div>
            
            <div class="modal-body">
                <!-- URL Section -->
                <div class="share-section">
                    <h4>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        링크로 가져오기
                    </h4>
                    <p class="hint">공유받은 링크를 붙여넣으세요</p>
                    <div class="url-box">
                        <input type="text" placeholder="https://..." id="importUrlInput">
                        <button class="btn-primary" id="btnImportUrl" title="가져오기">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="divider" style="margin: 20px 0; border-top: 1px dashed #eee;"></div>

                <!-- File Section -->
                <div class="share-section">
                    <h4>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                        JSON 파일 선택
                    </h4>
                    <p class="hint">공유받은 JSON 파일을 선택하세요</p>
                    <input type="file" accept=".json" id="fileInput" style="display: none;">
                    <button class="btn-secondary" id="btnSelectFile" style="width: 100%;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                        파일 선택
                    </button>
                    <div id="fileName" class="file-name"></div>
                </div>
                
                <div id="importStatus" class="status-message"></div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const fileInput = modal.querySelector('#fileInput');
    const fileName = modal.querySelector('#fileName');
    const status = modal.querySelector('#importStatus');
    const urlInput = modal.querySelector('#importUrlInput');
    const btnImportUrl = modal.querySelector('#btnImportUrl');

    // 핸들러 내부 함수
    const handleSuccess = (schedule) => {
        status.textContent = '일정을 가져왔습니다!';
        status.className = 'status-message success';
        setTimeout(() => {
            modal.remove();
            if (onImport) onImport(schedule);
        }, 1000);
    };

    const handleError = (msg) => {
        status.textContent = `오류: ${msg}`;
        status.className = 'status-message error';
    };

    // 1. URL 가져오기
    btnImportUrl.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (!url) {
            handleError('URL을 입력해주세요.');
            return;
        }

        const schedule = parseScheduleFromUrlString(url);
        if (schedule) {
            // 가져온 일정 저장 (새로운 ID 부여)
            delete schedule.id;
            const saved = saveSchedule(schedule);
            handleSuccess(saved);
        } else {
            handleError('유효하지 않은 링크이거나 데이터가 없습니다.');
        }
    });

    // 2. 파일 선택
    modal.querySelector('#btnSelectFile').addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        fileName.textContent = `선택된 파일: ${file.name}`;

        try {
            // Import uploadFromJson dynamically or assume it's imported at top
            const schedule = await uploadFromJson(file);
            handleSuccess(schedule);
        } catch (error) {
            handleError(error.message);
        }
    });

    // 닫기
    const closeModal = () => modal.remove();
    modal.querySelector('#btnCloseModal').addEventListener('click', closeModal);
    modal.querySelector('#btnCloseModalFooter').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}
