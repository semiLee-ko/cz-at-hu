// 브라우저 콘솔에서 실행할 디버그 스크립트
// 개발자 도구(F12) → Console 탭에서 이 코드를 복사해서 붙여넣으세요

const data = localStorage.getItem('travel_schedules');
if (data) {
    const schedules = JSON.parse(data);
    console.log('=== 전체 일정 데이터 ===');
    console.log(JSON.stringify(schedules, null, 2));

    // 첫 번째 일정의 days 배열 상세 분석
    if (schedules.length > 0) {
        console.log('\n=== 첫 번째 일정의 days 배열 ===');
        console.log(JSON.stringify(schedules[0].days, null, 2));

        console.log('\n=== days 배열 각 항목 분석 ===');
        schedules[0].days?.forEach((day, index) => {
            console.log(`\n[${index}] day 객체:`, day);
            console.log(`  - day 번호: ${day.day}`);
            console.log(`  - date: ${day.date}`);
            console.log(`  - events 개수: ${day.events?.length || 0}`);
            console.log(`  - 기타 속성들:`, Object.keys(day));
        });
    }
} else {
    console.log('localStorage에 데이터가 없습니다.');
}
