// URL 해시 기반 공유 및 JSON 파일 관리

import { saveSchedule } from './storage.js';

// 데이터를 Base64로 인코딩하여 URL 생성
export function generateShareUrl(schedule) {
    try {
        const jsonString = JSON.stringify(schedule);
        const encoded = btoa(encodeURIComponent(jsonString));
        return `${window.location.origin}${window.location.pathname}#share=${encoded}`;
    } catch (error) {
        console.error('URL 생성 실패:', error);
        return null;
    }
}

// URL 문자열에서 데이터 추출
export function parseScheduleFromUrlString(urlString) {
    try {
        const url = new URL(urlString);
        const hash = url.hash;
        if (!hash.startsWith('#share=')) {
            return null;
        }

        const encoded = hash.substring(7); // '#share=' 제거
        const jsonString = decodeURIComponent(atob(encoded));
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('URL 파싱 실패:', error);
        return null; // 유효하지 않은 URL이거나 데이터 없음
    }
}

// 현재 페이지 URL 해시에서 데이터 추출
export function parseShareUrl() {
    const hash = window.location.hash;
    if (!hash.startsWith('#share=')) {
        return null;
    }

    try {
        const encoded = hash.substring(7); // '#share=' 제거
        const jsonString = decodeURIComponent(atob(encoded));
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('URL 파싱 실패:', error);
        return null;
    }
}

// 공유 링크에서 데이터 로드 및 저장
export function loadFromShareUrl() {
    const schedule = parseShareUrl();
    if (schedule) {
        // 공유받은 일정은 새로운 ID로 저장
        delete schedule.id;
        const saved = saveSchedule(schedule);

        // URL 해시 제거
        window.history.replaceState(null, '', window.location.pathname);

        return saved;
    }
    return null;
}

// JSON 파일로 다운로드
export function downloadAsJson(schedule) {
    const jsonString = JSON.stringify(schedule, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${schedule.title || 'schedule'}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// JSON 파일에서 가져오기
export function uploadFromJson(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const schedule = JSON.parse(e.target.result);
                delete schedule.id; // 새로운 ID로 저장
                const saved = saveSchedule(schedule);
                resolve(saved);
            } catch (error) {
                reject(new Error('JSON 파일 파싱 실패'));
            }
        };

        reader.onerror = () => reject(new Error('파일 읽기 실패'));
        reader.readAsText(file);
    });
}

// 클립보드에 URL 복사
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        // 폴백: 임시 textarea 사용
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        } catch (err) {
            document.body.removeChild(textarea);
            return false;
        }
    }
}
