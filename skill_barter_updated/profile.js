window.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
  if (!user) return;

  document.getElementById('profileName').textContent = user.username;
  document.getElementById('profileEmail').textContent = user.email;
  document.getElementById('profileImage').src = user.profilePhoto
    ? `http://localhost:5000/uploads/${user.profilePhoto}`
    : 'profile-placeholder.png';

  fetchSkills(user.username);
  fetchSkillCount(user.username);
  fetchConnectionRequests(user.id);
  updateConnectionCount(user.id);

  window.addEventListener('skillPosted', () => {
    fetchSkills(user.username);
    fetchSkillCount(user.username);
  });
});

function fetchSkills(userName) {
  fetch('http://localhost:5000/api/skills')
    .then(res => res.json())
    .then(skills => {
      const container = document.getElementById('userSkills');
      container.innerHTML = '';
      skills
        .filter(skill => skill.yourName === userName)
        .forEach(skill => {
          const card = document.createElement('div');
          card.className = 'skill-card';
          card.innerHTML = `
            <h4>${skill.skillName}</h4>
            <p>${skill.description}</p>
            <button onclick="deleteSkill(${skill.id})">Delete</button>
            <button onclick="editSkill(${skill.id}, '${skill.skillName}', '${skill.description}')">Edit</button>
          `;
          container.appendChild(card);
        });
    });
}

function fetchSkillCount(username) {
  fetch(`http://localhost:5000/api/skill-count/${username}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('skillCounter').textContent = `${data.count}`;
    });
}

function deleteSkill(id) {
  if (confirm('Are you sure you want to delete this skill?')) {
    fetch(`http://localhost:5000/api/delete-skill/${id}`, {
      method: 'DELETE'
    }).then(res => {
      if (res.ok) {
        const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
        fetchSkills(user.username);
        fetchSkillCount(user.username);
      } else {
        alert('Failed to delete skill');
      }
    });
  }
}

function editSkill(id, oldName, oldDescription) {
  const newName = prompt('Edit skill name:', oldName);
  const newDesc = prompt('Edit description:', oldDescription);

  if (newName && newDesc) {
    fetch(`http://localhost:5000/api/update-skill/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillName: newName, description: newDesc })
    }).then(res => {
      if (res.ok) {
        const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
        fetchSkills(user.username);
        fetchSkillCount(user.username);
      } else {
        alert('Failed to update skill');
      }
    });
  }
}

// ✅ Connection Request Notification Logic

function fetchConnectionRequests(userId) {
  fetch(`http://localhost:5000/api/get-incoming-requests/${userId}`)
    .then(res => res.json())
    .then(requests => {
      const container = document.getElementById('notificationsContainer');
      if (!container) return;

      if (requests.length === 0) {
        container.innerHTML = "<p>No connection requests at the moment.</p>";
      } else {
        container.innerHTML = '';
        requests.forEach(request => {
          const requestElement = document.createElement('div');
          requestElement.classList.add('notification');
          requestElement.innerHTML = `
            <p>Connection request from <strong>${request.senderUsername}</strong></p>
            <button class="accept-btn" data-id="${request.id}">Accept</button>
            <button class="reject-btn" data-id="${request.id}">Delete</button>
          `;
          container.appendChild(requestElement);
        });

        addConnectionButtonsEventListeners();
      }
    })
    .catch(error => console.error('Error fetching connection requests:', error));
}

function addConnectionButtonsEventListeners() {
  document.querySelectorAll('.accept-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const requestId = e.target.getAttribute('data-id');
      await acceptConnection(requestId);
    });
  });

  document.querySelectorAll('.reject-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const requestId = e.target.getAttribute('data-id');
      await deleteConnectionRequest(requestId);
    });
  });
}

async function acceptConnection(requestId) {
  const response = await fetch(`http://localhost:5000/api/accept-connection/${requestId}`, {
    method: 'PUT',
  });

  const result = await response.json();
  if (response.ok) {
    alert('Connection accepted!');
    removeRequestFromUI(requestId);

    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    updateConnectionCount(user.id);
  } else {
    alert('Error accepting request');
  }
}

function updateConnectionCount(userId) {
  fetch(`http://localhost:5000/api/get-connections/${userId}`)
    .then(res => res.json())
    .then(data => {
      const count = data.count || 0;
      document.getElementById('connectionsMade').textContent = count;
    })
    .catch(err => console.error('Failed to fetch connection count:', err));
}

async function deleteConnectionRequest(requestId) {
  const response = await fetch(`http://localhost:5000/api/delete-connection-request/${requestId}`, {
    method: 'DELETE',
  });

  const result = await response.json();
  if (response.ok) {
    alert('Request deleted');
    removeRequestFromUI(requestId);
  } else {
    alert('Error deleting request');
  }
}

function removeRequestFromUI(requestId) {
  const requestElement = document.querySelector(`[data-id="${requestId}"]`).parentElement;
  if (requestElement) requestElement.remove();
}
