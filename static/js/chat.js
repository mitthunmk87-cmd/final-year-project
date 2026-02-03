// DOM Elements
const messagesContainer = document.getElementById('messages-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const suggestionsContainer = document.getElementById('suggestions');
const clearChatButton = document.getElementById('clear-chat');

// Load suggestions from API
async function loadSuggestions() {
    try {
        const response = await fetch('/api/suggestions');
        const data = await response.json();
        
        suggestionsContainer.innerHTML = '';
        
        data.suggestions.forEach(suggestion => {
            const button = document.createElement('button');
            button.className = 'bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm px-3 py-2 rounded-full transition duration-300';
            button.textContent = suggestion;
            button.onclick = () => useSuggestion(suggestion);
            suggestionsContainer.appendChild(button);
        });
    } catch (error) {
        console.error('Error loading suggestions:', error);
    }
}

// Use suggestion as question
function useSuggestion(question) {
    userInput.value = question;
    userInput.focus();
}

// Send message to backend
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) {
        return;
    }
    
    // Clear input
    userInput.value = '';
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Send to backend
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add bot response
        addMessage(data.response, 'bot');
        
        // Scroll to bottom
        scrollToBottom();
        
        // Reload suggestions
        loadSuggestions();
        
    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator();
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
    }
}

// Add message to chat UI
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = sender === 'user' ? 'user-message mb-4' : 'bot-message mb-4';
    
    const alignClass = sender === 'user' ? 'justify-end' : 'justify-start';
    const bgColor = sender === 'user' ? 'bg-blue-500 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none shadow';
    
    const messageHTML = `
        <div class="flex ${alignClass}">
            ${sender === 'bot' ? `
                <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <i class="fas fa-robot text-sm"></i>
                </div>
            ` : ''}
            
            <div class="${bgColor} p-4 rounded-2xl max-w-[80%] ${sender === 'user' ? 'rounded-tl-2xl' : 'rounded-tr-2xl'}">
                <p>${escapeHtml(text)}</p>
                <div class="text-xs ${sender === 'user' ? 'text-blue-200' : 'text-gray-500'} mt-2 text-right">
                    ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
            
            ${sender === 'user' ? `
                <div class="w-8 h-8 bg-gray-300 text-gray-700 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                    <i class="fas fa-user text-sm"></i>
                </div>
            ` : ''}
        </div>
    `;
    
    messageDiv.innerHTML = messageHTML;
    messagesContainer.appendChild(messageDiv);
    
    scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'bot-message mb-4';
    
    typingDiv.innerHTML = `
        <div class="flex items-start">
            <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <i class="fas fa-robot text-sm"></i>
            </div>
            <div class="bg-white p-4 rounded-2xl rounded-tl-none shadow max-w-[80%]">
                <div class="flex space-x-1">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
                </div>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Scroll to bottom of messages
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Clear chat history
async function clearChat() {
    try {
        await fetch('/api/clear_history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        // Clear UI messages except welcome
        const messages = messagesContainer.querySelectorAll('.user-message, .bot-message');
        messages.forEach(msg => {
            if (!msg.innerHTML.includes("Hello! I'm your College Admission Assistant")) {
                msg.remove();
            }
        });
        
        // Reload suggestions
        loadSuggestions();
        
    } catch (error) {
        console.error('Error clearing chat:', error);
    }
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

clearChatButton.addEventListener('click', clearChat);

// Load suggestions on page load
document.addEventListener('DOMContentLoaded', loadSuggestions);