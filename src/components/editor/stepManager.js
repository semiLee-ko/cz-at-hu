// Step Management Module
// Handles step navigation, UI updates, and helper functions

export function createStepManager(container, schedule, locations) {
    let currentStep = 1;
    const totalSteps = 5;

    function updateStepUI() {
        // Update step indicator
        container.querySelectorAll('.step-item').forEach(item => {
            const step = parseInt(item.dataset.step);
            if (step < currentStep) {
                item.classList.add('completed');
                item.classList.remove('active');
            } else if (step === currentStep) {
                item.classList.add('active');
                item.classList.remove('completed');
            } else {
                item.classList.remove('active', 'completed');
            }
        });

        // Show/hide form steps
        container.querySelectorAll('.form-step').forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.style.display = stepNum === currentStep ? 'block' : 'none';
        });

        // Update navigation buttons
        const btnPrev = container.querySelector('#btnPrev');
        const btnNext = container.querySelector('#btnNext');
        const btnSubmit = container.querySelector('#btnSubmit');

        btnPrev.style.display = currentStep > 1 ? 'inline-block' : 'none';
        btnNext.style.display = currentStep < totalSteps ? 'inline-block' : 'none';
        btnSubmit.style.display = currentStep === totalSteps ? 'inline-block' : 'none';
    }

    function nextStep(renderStep2Callback, renderAccommodationsCallback, renderChecklistsCallback, renderTipsCallback) {
        if (currentStep < totalSteps) {
            // Moving to Step 2 - generate days from date range
            if (currentStep === 1) {
                const form = container.querySelector('#scheduleForm');
                const formData = new FormData(form);
                const startDate = formData.get('startDate');
                const endDate = formData.get('endDate');

                // Generate days and render Step 2
                const generatedDays = generateDaysFromDateRange(startDate, endDate, schedule.days || []);
                renderStep2Callback(generatedDays, Array.from(locations), container);
            }

            // Moving to Step 3 - render accommodations
            if (currentStep === 2) {
                renderAccommodationsCallback();
            }

            // Moving to Step 4 - render checklists
            if (currentStep === 3) {
                renderChecklistsCallback('packing');
                renderChecklistsCallback('todo');
            }

            // Moving to Step 5 - render tips
            if (currentStep === 4) {
                renderTipsCallback();
            }

            currentStep++;
            updateStepUI();
            container.querySelector('.schedule-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
            updateStepUI();
            container.querySelector('.schedule-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function generateDaysFromDateRange(startDate, endDate, existingDays = []) {
        if (!startDate || !endDate) return [];

        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = [];

        let currentDate = new Date(start);
        let dayNum = 1;

        while (currentDate <= end) {
            const dateString = currentDate.toISOString().split('T')[0];
            const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
            const dayName = dayNames[currentDate.getDay()];

            // Find existing day data
            const existingDay = existingDays.find(d => d.date === dateString);

            days.push({
                day: dayNum,
                date: dateString,
                dayName: dayName,
                events: existingDay?.events || []
            });

            currentDate.setDate(currentDate.getDate() + 1);
            dayNum++;
        }

        return days;
    }

    function generateTimeOptions() {
        const options = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                options.push(timeString);
            }
        }
        return options;
    }

    // Initialize
    updateStepUI();

    return {
        get currentStep() { return currentStep; },
        get totalSteps() { return totalSteps; },
        nextStep,
        prevStep,
        updateStepUI,
        generateDaysFromDateRange,
        generateTimeOptions
    };
}
