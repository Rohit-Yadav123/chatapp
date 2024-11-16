let chatSocket = null;
let selectedRecipientId = null;
let selectedRecipientName = ""; // Store the selected recipient's name

// Fetch the list of users and display them as clickable items
async function fetchUsers() {
    const response = await fetch('/messaging/api/users/');
    const data = await response.json();
    const userList = document.getElementById("user-list");
    document.getElementById("message-form").style.display = "none"; // Ensure the message form is hidden at page load
    // Clear the user list first
    userList.innerHTML = '';

    // Populate the user list with clickable names
    data.users.forEach(user => {
        const listItem = document.createElement("li");
        // Create an i element for the profile icon using Material Icons
        const profileIcon = document.createElement("i");
        profileIcon.classList.add("material-icons", "profile-icon");
        profileIcon.textContent = "account_circle"; // Set the Material Icon

        // Add the username text
        const usernameText = document.createElement("span");
        usernameText.textContent = user.username;

        // Append icon and username to list item
        listItem.appendChild(profileIcon);
        listItem.appendChild(usernameText);

        listItem.dataset.userId = user.id; // Store the user ID as a data attribute
        listItem.addEventListener("click", function() {
            selectUser(user.id, user.username); // When a user is clicked, select it
        });
        userList.appendChild(listItem);
    });
}

fetchUsers();

// Function to handle user selection and fetch messages
async function selectUser(recipientId, recipientName) {
    selectedRecipientId = recipientId; // Store the selected user ID
    selectedRecipientName = recipientName; // Store the selected user's name
    document.getElementById("chat-header").style.display = "block"; // Show the chat header
    document.getElementById("selected-user-name").textContent = recipientName; // Display recipient's name in chat header
    document.getElementById("start-chatting").style.display = "none"; // Hide "Start Chatting" text
    document.getElementById("message-form").style.display = "flex"; // Show the message input form
    document.getElementById("loading").style.display = "block"; // Show loading indicator

    // Fetch previous messages for the selected user
    const response = await fetch(`/messaging/api/messages/${recipientId}/`);
    const data = await response.json();
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = ''; // Clear previous messages

    //Display messages from the API
    if (data.messages) {
        data.messages.forEach(message => {
            const sender = message.sender === currentUser ? "You" : message.sender;
            const messageElem = document.createElement("div");
            messageElem.classList.add('message', message.sender === currentUser ? 'sent' : 'received');
            messageElem.innerHTML = `
                <strong>${sender}</strong>
                <p>${message.content}</p>
                <span class="timestamp">${new Date(message.timestamp).toLocaleString()}</span>
            `;
            messagesDiv.appendChild(messageElem);
        });
    }

    
    
    scrollToBottom();

    document.getElementById("loading").style.display = "none"; // Hide loading indicator

    // Open WebSocket connection to send new messages
    if (chatSocket) {
        chatSocket.close();  // Close any existing connection
    }

    chatSocket = new WebSocket(`ws://${window.location.host}/ws/chat/${recipientId}/`);

    // Handle incoming messages via WebSocket
    chatSocket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        const messageElem = document.createElement("div");
        const sender = data.sender === currentUser ? "You" : data.sender;
        messageElem.classList.add('message', data.sender === currentUser ? 'sent' : 'received');
        messageElem.innerHTML = `
            <strong>${sender}</strong>
            <p>${data.message}</p>
            <span class="timestamp">${new Date().toLocaleString()}</span>
        `;
        document.getElementById("messages").appendChild(messageElem);
        scrollToBottom();
    };

    chatSocket.onclose = function() {
        console.log("Chat connection closed");
    };
}

// Send message via WebSocket when the form is submitted
document.getElementById("message-form").onsubmit = function(e) {
    e.preventDefault();
    const message = document.getElementById("message-input").value;

    if (chatSocket && message && selectedRecipientId) {
        chatSocket.send(JSON.stringify({
            message: message,
            recipient_id: selectedRecipientId
        }));

        document.getElementById("message-input").value = '';
        scrollToBottom();  // Scroll to the bottom to show the latest message
    }
};

// Scroll to the bottom of the messages container
function scrollToBottom() {
    const messagesDiv = document.getElementById("messages");
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}