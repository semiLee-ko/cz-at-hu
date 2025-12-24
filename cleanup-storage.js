// 잘못된 days 데이터 정리 스크립트
// 브라우저 콘솔(F12 → Console)에서 실행하세요

const data = localStorage.getItem('travel_schedules');
if (data) {
    const schedules = JSON.parse(data);
    schedules.forEach(schedule => {
        // days 배열에서 data-day가 없는 잘못된 항목 제거
        if (schedule.days) {
            schedule.days = schedule.days.filter(day =>
                day.day !== null &&
                typeof day.day === 'number' &&
                day.day > 0
            );
        }
    });
    localStorage.setItem('travel_schedules', JSON.stringify(schedules));
    console.log('✅ 데이터 정리 완료!');
    console.log('정리된 데이터:', schedules);
    location.reload(); // 페이지 자동 새로고침
} else {
    console.log('❌ localStorage에 데이터가 없습니다.');
}
