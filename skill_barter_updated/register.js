document.getElementById("registerForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
      const response = await fetch("http://localhost:5000/api/register", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
          alert("🎉 Successfully registered in our website!");
          window.location.href = "login.html";  // redirect to login page
      } else {
          alert(`❌ Registration failed: ${data.error}`);
      }
  } catch (error) {
      console.error("Error:", error);
      alert("❌ An error occurred. Please try again later.");
  }
});
