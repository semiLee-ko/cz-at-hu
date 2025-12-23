// Step Management Module
// Handles step navigation, UI updates, and helper functions

export function createStepManager(container, schedule, locations) {
    let currentStep = 1;
    const totalSteps = 5;

    function updateStepUI(stepStatuses = {}) {
        // Update step indicator
        container.querySelectorAll('.step-item').forEach(item => {
            const step = parseInt(item.dataset.step);

            // Clear existing status classes
            item.classList.remove('active', 'completed', 'step-invalid', 'step-valid', 'step-empty');

            // Set active state
            if (step === currentStep) {
                item.classList.add('active');
            }

            // Set status color (Red/Mint/Gray)
            // Default to 'empty' if not specified
            const status = stepStatuses[step] || 'empty';
            item.classList.add(`step-${status}`);
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

        if (btnPrev) btnPrev.style.display = currentStep > 1 ? 'inline-block' : 'none';
        if (btnNext) btnNext.style.display = currentStep < totalSteps ? 'inline-block' : 'none';
        if (btnSubmit) btnSubmit.style.display = currentStep === totalSteps ? 'inline-block' : 'none';
    }

    function goToStep(targetStep, callbacks = {}) {
        if (targetStep < 1 || targetStep > totalSteps || targetStep === currentStep) return;

        // Execute logic when leaving explicit steps (e.g. generating days when leaving step 1)
        // We do this regardless of direction now, because we want data ready if we jump from 1 to 3
        if (currentStep === 1 || targetStep >= 2) {
            if (callbacks.onLeaveStep1) callbacks.onLeaveStep1();
        }

        // Trigger render callbacks based on destination
        if (targetStep === 2 && callbacks.renderStep2) callbacks.renderStep2();
        if (targetStep === 3 && callbacks.renderAccommodations) callbacks.renderAccommodations();
        if (targetStep === 4 && callbacks.renderChecklists) {
            callbacks.renderChecklists('packing');
            callbacks.renderChecklists('todo');
        }
        if (targetStep === 5 && callbacks.renderTips) callbacks.renderTips();

        currentStep = targetStep;
        // UI update is handled by the caller (ScheduleEditor) usually, or we can call it here if we had statuses
        // But statuses are dynamic. We will let ScheduleEditor call updateStepUI with latest statuses.
        // For now, we scroll.
        container.querySelector('.step-indicator').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            container.querySelector('.step-indicator').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
            updateStepUI();
            container.querySelector('.step-indicator').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        goToStep,
        generateDaysFromDateRange,
        generateTimeOptions
    };
}
