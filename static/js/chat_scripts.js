let chatSocket = null;
let selectedRecipientId = null;
let selectedRecipientName = ""; // Store the selected recipient's name

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}


// Fetch the list of users and display them as clickable items
async function fetchUsers() {
    try {
        const response = await fetch('/messaging/api/users/');
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const usersSection = document.getElementById("users-section"); // Target the main section
        const userList = document.getElementById("user-list");

        // Clear the user list before populating
        userList.innerHTML = '';

        // Create and add the search box at the top of the list if it doesn't exist
        let searchBox = document.getElementById("user-search-box");
        if (!searchBox) {
            searchBox = document.createElement("input");
            searchBox.type = "text";
            searchBox.placeholder = "Search users by name...";
            searchBox.id = "user-search-box";
            searchBox.classList.add("search-box"); // Optional: Add a CSS class for styling
            usersSection.insertBefore(searchBox, userList); // Add the search box above the list
        }

        // Populate the user list with clickable names
        data.users.forEach(user => {
            const listItem = document.createElement("li");

            // Create an i element for the profile icon using Material Icons
            const profileIcon = document.createElement("i");
            profileIcon.classList.add("material-icons", "profile-icon");
            profileIcon.textContent = "account_circle";
            
            // Capitalize first letters of first_name and last_name
            const firstName = capitalizeFirstLetter(user.first_name);
            const lastName = capitalizeFirstLetter(user.last_name);

            // Add the full name text
            const fullName = document.createElement("span");
            fullName.textContent = `${firstName} ${lastName}`;


            // Append icon and full name to the list item
            listItem.appendChild(profileIcon);
            listItem.appendChild(fullName);

            // Store user ID and full name (lowercase) for filtering
            listItem.dataset.userId = user.id;
            listItem.dataset.fullName = `${user.first_name.toLowerCase()} ${user.last_name.toLowerCase()}`;

            // Add click event listener to select user
            listItem.addEventListener("click", function() {
                selectUser(user.id, `${user.first_name} ${user.last_name}`);
            });

            userList.appendChild(listItem);
        });

        // Add event listener for the search box to filter users dynamically
        searchBox.addEventListener("input", function() {
            const filterText = searchBox.value.toLowerCase();
            const listItems = userList.querySelectorAll("li");
            listItems.forEach(item => {
                const fullName = item.dataset.fullName; // Get the stored lowercase full name
                if (fullName.includes(filterText)) {
                    item.style.display = ""; // Show the item if it matches
                } else {
                    item.style.display = "none"; // Hide the item if it doesn't match
                }
            });
        });
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

// Call the function to fetch and render the users
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