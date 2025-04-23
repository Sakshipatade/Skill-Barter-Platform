document.addEventListener("DOMContentLoaded", function() {
    const chatBox = document.getElementById("chat-box");
    const messageInput = document.getElementById("message-input");

    function sendMessage() {
        const message = messageInput.value.trim();
        if (message === "") return;

        const messageElement = document.createElement("div");
        messageElement.classList.add("message");
        messageElement.textContent = message;
        chatBox.appendChild(messageElement);

        messageInput.value = "";
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    document.querySelector(".message-footer button").addEventListener("click", sendMessage);

    messageInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });
});