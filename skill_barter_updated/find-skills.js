document.addEventListener('DOMContentLoaded', async () => {
    const skillsContainer = document.getElementById('skillsContainer');
    const searchBox = document.getElementById('searchBox');
    let allSkills = [];

    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    // Fetch skills from backend
    async function fetchSkills() {
        try {
            const response = await fetch('http://localhost:5000/api/skills');
            allSkills = await response.json();
            renderSkills(allSkills);
        } catch (error) {
            console.error('Error fetching skills:', error);
            skillsContainer.innerHTML = '<p>Failed to load skills.</p>';
        }
    }

    // Render skills into the container
    function renderSkills(skills) {
        skillsContainer.innerHTML = '';

        if (skills.length === 0) {
            skillsContainer.innerHTML = '<p>No skills found.</p>';
            return;
        }

        skills.forEach(skill => {
            const card = document.createElement('div');
            card.className = 'skill-card';
            card.innerHTML = `
                <h3>${skill.skillName}</h3>
                <p><strong>By:</strong> ${skill.yourName}</p>
                <p>${skill.description}</p>
                <p><strong>Course Duration:</strong> ${skill.courseDuration}</p>
            `;

            // Show "Connect" button only if the skill doesn't belong to the logged-in user
            if (loggedInUser && skill.yourName !== loggedInUser.username) {
                const connectButton = document.createElement('button');
                connectButton.className = 'connect-btn';
                connectButton.textContent = 'Connect';
                connectButton.onclick = () => sendConnectionRequest(loggedInUser.username, skill.yourName);
                card.appendChild(connectButton);
            }

            skillsContainer.appendChild(card);
        });
    }

    // Send connection request using usernames
    async function sendConnectionRequest(senderUsername, receiverUsername) {
        try {
            const response = await fetch('http://localhost:5000/api/send-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    senderUsername: senderUsername,
                    receiverUsername: receiverUsername
                })
            });

            const result = await response.json();
            alert(result.message);
        } catch (error) {
            console.error('Error sending connection request:', error);
        }
    }

    // Live search filter
    searchBox.addEventListener('input', () => {
        const searchTerm = searchBox.value.toLowerCase();
        const filtered = allSkills.filter(skill =>
            skill.skillName.toLowerCase().includes(searchTerm) ||
            skill.description.toLowerCase().includes(searchTerm) ||
            skill.yourName.toLowerCase().includes(searchTerm)
        );
        renderSkills(filtered);
    });

    fetchSkills();
});
