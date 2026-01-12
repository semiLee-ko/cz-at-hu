// Appintos SDK 기반 여행 일정 관리
import { SDK } from './utils/sdkUtils.js';

const STORAGE_KEY = 'travel_schedules';
const CURRENT_SCHEDULE_KEY = 'current_schedule_id';

// 모든 일정 가져오기
export function getAllSchedules() {
    const data = SDK.storage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// 특정 일정 가져오기
export function getSchedule(id) {
    const schedules = getAllSchedules();
    return schedules.find(s => s.id === id);
}

// 현재 선택된 일정 ID 가져오기
export function getCurrentScheduleId() {
    return SDK.storage.getItem(CURRENT_SCHEDULE_KEY);
}

// 현재 선택된 일정 가져오기
export function getCurrentSchedule() {
    const id = getCurrentScheduleId();
    return id ? getSchedule(id) : null;
}

// 일정 저장
export function saveSchedule(schedule) {
    const schedules = getAllSchedules();

    // ID가 없으면 새로 생성
    if (!schedule.id) {
        schedule.id = Date.now().toString();
        schedule.createdAt = new Date().toISOString();
    }

    schedule.updatedAt = new Date().toISOString();

    // 기존 일정 업데이트 또는 새 일정 추가
    const index = schedules.findIndex(s => s.id === schedule.id);
    if (index >= 0) {
        schedules[index] = schedule;
    } else {
        schedules.push(schedule);
    }

    SDK.storage.setItem(STORAGE_KEY, JSON.stringify(schedules));
    return schedule;
}

// 일정 삭제
export function deleteSchedule(id) {
    const schedules = getAllSchedules();
    const filtered = schedules.filter(s => s.id !== id);
    SDK.storage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    // 현재 일정이 삭제된 경우 초기화
    if (getCurrentScheduleId() === id) {
        SDK.storage.removeItem(CURRENT_SCHEDULE_KEY);
    }
}

// 현재 일정 설정
export function setCurrentSchedule(id) {
    SDK.storage.setItem(CURRENT_SCHEDULE_KEY, id);
}

// 템플릿 관련 기능
const TEMPLATE_KEY = 'checklist_templates';

export function getChecklistTemplates() {
    const data = SDK.storage.getItem(TEMPLATE_KEY);
    return data ? JSON.parse(data) : [];
}

export function saveChecklistTemplate(name, categories) {
    const templates = getChecklistTemplates();
    const newTemplate = {
        id: 'tpl_' + Date.now(),
        name,
        categories, // Should be a deep copy of the categories array
        createdAt: new Date().toISOString()
    };

    templates.push(newTemplate);
    SDK.storage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
    return newTemplate;
}

export function deleteChecklistTemplate(id) {
    const templates = getChecklistTemplates();
    const filtered = templates.filter(t => t.id !== id);
    SDK.storage.setItem(TEMPLATE_KEY, JSON.stringify(filtered));
}

// 기본 템플릿 일정 생성
export function createDefaultSchedule() {
    return {
        title: '동유럽 3국 가을 여행',
        tag: 'FAMILY TRIP',
        startDate: '2026-10-02',
        endDate: '2026-10-13',
        countries: ['🇨🇿', '🇦🇹', '🇭🇺'],
        members: {
            adults: 2,
            children: 1
        },
        days: [
            {
                day: 1,
                date: '10.02 (금)',
                location: '프라하 도착 🇨🇿',
                events: [
                    { time: '16:45', detail: '✈️ 프라하 공항 도착', tag: 'move' },
                    { time: '18:00', detail: '전용 차량으로 호텔 이동 및 체크인' },
                    { time: '19:00', detail: '팔라디움 몰 식사 및 휴식' }
                ],
                hotel: {
                    name: '이비스 프라하 올드 타운',
                    description: '올드타운/팔라디움 몰 바로 옆 위치 최적'
                }
            }
            // 나머지 일정은 필요시 추가
        ]
    };
}
