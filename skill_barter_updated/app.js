document.addEventListener('DOMContentLoaded', () => {
    const skillForm = document.getElementById('skillForm');

    skillForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const skillName = document.getElementById('skillName').value.trim();
        const yourName = document.getElementById('yourName').value.trim();
        const description = document.getElementById('description').value.trim();

        if (skillName && yourName && description) {
            try {
                const response = await fetch('http://localhost:5000/api/post-skill', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ skillName, yourName, description })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message || 'Skill posted successfully!');
                    window.location.href = 'find-skills.html';
                } else {
                    alert(data.error || 'Failed to post skill.');
                }

            } catch (error) {
                console.error('❌ Error posting skill:', error);
                alert('Something went wrong while posting the skill.');
            }
        } else {
            alert('Please fill out all fields.');
        }
    });
});
