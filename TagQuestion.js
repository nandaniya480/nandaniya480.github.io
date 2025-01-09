const Question = [
    {
        Designation: "Associate Human Resource Generalist",
        ReviewTypes: ['Self', 'Reviewer'],
        Questions: [
            'How effectively do you manage and implement HR policies to meet organizational goals?',
            'Rate your effectiveness in building and maintaining a positive work culture within the team.',
            'How well do you coordinate for employee concerns?',
            'How efficiently do you manage recruitment to ensure hiring aligns with business needs and client expectations?',
            'How skilled are you at ensuring compliance with company policies?',
            'How well do you contribute to employee retention efforts?',
            'How successful are you in fostering cross-departmental collaboration within the HR team?',
            'Rate your capability to implement HR training and development programs.',
            'Rate your effectiveness in communicating HR policies and updates to the team.',
            'How well do you handle workload prioritization to meet deadlines?',
            'How proficient are you at adapting HR strategies to respond to the evolving needs of the organization?',
            'How effectively do you lead or support HR initiatives that align with the agency\'s long-term growth objectives?'
        ]
    }
];

async function executeTasks() {
    for (const item of Question) {
        const { Designation, ReviewTypes, Questions } = item;

        // Task 1: Select Designation
        const designationSelect = document.getElementById('desDepRoleselect-input');
        if (designationSelect) {
            designationSelect.focus();
            designationSelect.value = Designation;
            designationSelect.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 500));

            const listItem = Array.from(document.querySelectorAll('li[role="option"]'))
                .find(item => item.textContent.trim().toLowerCase() === Designation.trim().toLowerCase());

            if (listItem) {
                ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(eventType => {
                    listItem.dispatchEvent(new MouseEvent(eventType, { bubbles: true }));
                });
            } else {
                console.error(`Option '${Designation}' not found in the dropdown`);
            }
        } else {
            console.error("Designation dropdown element not found");
        }

        // Task 2: Select Review Types
        for (const ReviewType of ReviewTypes) {
            const reviewTypeSelect = document.getElementById('reviewTypeselect-input');
            if (reviewTypeSelect) {
                reviewTypeSelect.focus();
                reviewTypeSelect.value = ReviewType;
                reviewTypeSelect.dispatchEvent(new Event('input', { bubbles: true }));
                await new Promise(resolve => setTimeout(resolve, 500));

                const listItem2 = Array.from(document.querySelectorAll('li[role="option"]'))
                    .find(item => item.textContent.trim().toLowerCase() === ReviewType.trim().toLowerCase());

                if (listItem2) {
                    ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(eventType => {
                        listItem2.dispatchEvent(new MouseEvent(eventType, { bubbles: true }));
                    });
                    console.log(`Successfully selected '${ReviewType}'`);
                } else {
                    console.error(`Option '${ReviewType}' not found in the dropdown`);
                }
            } else {
                console.error("Review type dropdown element not found");
            }
        }

        // Task 3: Process Questions
        for (const questionText of Questions) {
            const questionLabel = Array.from(document.querySelectorAll('.zcheckbox__label'))
                .find(label => label.textContent.trim() === questionText);

            if (questionLabel) {
                const checkbox = questionLabel.previousElementSibling;
                if (checkbox) checkbox.click();
            } else {
                await submitQuestion(questionText);
                await new Promise(resolve => setTimeout(resolve, 200));

                const addedQuestionLabel = Array.from(document.querySelectorAll('.zcheckbox__label'))
                    .find(label => label.textContent.trim() === questionText);

                if (addedQuestionLabel) {
                    const addedCheckbox = addedQuestionLabel.previousElementSibling;
                    if (addedCheckbox) addedCheckbox.click();
                }
            }
        }

        // Task 4: Submit the form
        const submitButton = document.querySelector('#taboprmoduletagslider #sliderSbt');
        if (submitButton) {
            submitButton.click();
        } else {
            console.error("Submit button not found");
        }
    }
}

async function submitQuestion(questionText) {
    const addButton = document.querySelector('a[data-popup-open="AddKeyAccountabilityform"] b');
    if (addButton) addButton.click();

    const questionInput = document.getElementById('revques_name');
    if (questionInput) questionInput.value = questionText;

    const submitButton = document.querySelector('#modalFooter #sliderSbt');
    if (submitButton) submitButton.click();
}

// Execute tasks
executeTasks();
