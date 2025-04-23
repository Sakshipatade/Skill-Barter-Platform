document.getElementById('postSkillForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const skillName = document.getElementById('skillName').value.trim();
    const yourName = document.getElementById('yourName').value.trim();
    const description = document.getElementById('description').value.trim();
    const courseDuration = document.getElementById('courseDuration').value.trim(); // New field for course duration
    const feedback = document.getElementById('formFeedback');

    // Check if required fields are filled out, including course duration
    if (!skillName || !yourName || !description || !courseDuration) {
        feedback.style.display = 'block';
    } else {
        feedback.style.display = 'none';

        // Include courseDuration in the skill object
        const skill = { skillName, yourName, description, courseDuration };

        try {
            const response = await fetch('http://localhost:5000/api/post-skill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(skill)
            });

            if (response.ok) {
                const data = await response.json();
                alert('Skill posted successfully!');

                // ✅ Custom event dispatched
                window.dispatchEvent(new Event('skillPosted'));

                this.reset();
                window.location.href = 'find-skills.html';
            } else {
                alert('Error posting skill.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Server error. Please try again.');
        }
    }
});
