// Full Page Chatbot JavaScript
class FullPageChatbot {
    constructor() {
        this.apiUrl = '/api/posts/chatbot';
        this.messages = [];

        // Fallback responses for when API fails
        this.fallbackResponses = {
            'hi': 'Hello! Welcome to our Technology & Science blog. How can I help you today?',
            'hello': 'Hi there! I\'m your AI assistant for tech and science questions. What would you like to know?',
            'what is ai': 'AI, or Artificial Intelligence, refers to machines performing tasks that typically require human intelligence. It includes machine learning, natural language processing, computer vision, and more.',
            'tell me about quantum computing': 'Quantum computing uses quantum mechanics principles to process information. Unlike classical computers that use bits (0s and 1s), quantum computers use quantum bits or qubits that can exist in multiple states simultaneously.',
            'what is machine learning': 'Machine learning is a subset of AI where algorithms learn patterns from data without being explicitly programmed. It includes supervised learning, unsupervised learning, and reinforcement learning.',
            'space exploration': 'Space exploration involves the discovery and exploration of celestial structures using aerospace technology. NASA, SpaceX, and other organizations are actively working on missions to Mars, the Moon, and beyond.',
            'which model are you': 'I\'m an AI assistant specialized in technology and science topics. I provide accurate, helpful information about AI, programming, quantum computing, space exploration, and scientific discoveries!',
            'please say something': 'I\'m here and ready to help! Ask me anything about technology, science, AI, programming, or space exploration. What interests you most?',
            'default': 'I\'m here to help you with questions about technology and science. Feel free to ask me anything about AI, quantum computing, space exploration, programming, or scientific discoveries!'
        };

        this.init();
    }

    init() {
        this.attachEventListeners();
        this.loadMessagesFromStorage();

        // Focus on input when page loads
        setTimeout(() => {
            document.getElementById('chatbot-input').focus();
        }, 500);
    }

    attachEventListeners() {
        const input = document.getElementById('chatbot-input');
        const send = document.getElementById('chatbot-send');

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        send.addEventListener('click', () => this.sendMessage());
    }

    async sendMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTyping();

        try {
            const response = await this.callAI(message);
            this.hideTyping();
            this.addMessage(response, 'bot');
        } catch (error) {
            this.hideTyping();
            console.error('Chatbot API Error:', error);

            // Try fallback response first
            const fallbackResponse = this.getFallbackResponse(message);
            if (fallbackResponse) {
                console.log('Using fallback response for:', message);
                this.addMessage(fallbackResponse, 'bot');
                this.addMessage('💡 Note: This response is from our fallback system. The AI API may be temporarily unavailable.', 'bot');
                return;
            }

            // If no fallback, show specific error
            let errorMessage = '❌ Sorry, I encountered an error connecting to the AI service. Please try again later.';
            if (error.message.includes('401')) {
                errorMessage = '❌ Authentication error with AI service. Please check the API key configuration.';
            } else if (error.message.includes('429')) {
                errorMessage = '❌ AI service is rate-limited. Please wait a moment and try again.';
            } else if (error.message.includes('500')) {
                errorMessage = '❌ AI service server error. Please try again in a few minutes.';
            } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                errorMessage = '❌ Network connection error. Please check your internet connection.';
            }

            console.error('Chatbot Error Details:', error.message);
            this.addMessage(errorMessage, 'bot');
        }
    }

    getFallbackResponse(message) {
        const lowerMessage = message.toLowerCase().trim();

        // Check for exact matches first
        if (this.fallbackResponses[lowerMessage]) {
            return this.fallbackResponses[lowerMessage];
        }

        // Check for partial matches
        for (const [key, response] of Object.entries(this.fallbackResponses)) {
            if (key !== 'default' && lowerMessage.includes(key)) {
                return response;
            }
        }

        // Return default response if no matches found
        return null;
    }

    async callAI(message) {
        console.log('Calling backend chatbot API (full page)...');

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message
                })
            });

            console.log('Backend response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Backend Error Response:', errorText);
                throw new Error(`Backend request failed with status ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Backend response data:', data);

            if (!data.success || !data.data) {
                console.error('Invalid backend response structure:', data);
                throw new Error('Invalid backend response structure');
            }

            return data.data.trim();
        } catch (networkError) {
            console.error('Network error with backend:', networkError);
            throw networkError;
        }
    }

    addFullscreenMessage(content, type) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;

        // Convert blog post links to clickable HTML
        let processedContent = content;

        // Convert [Title](URL) format to clickable links
        processedContent = processedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" style="color: #007bff; text-decoration: underline;">$1</a>');

        // Convert 👉 links to clickable format
        processedContent = processedContent.replace(/👉 \[([^\]]+)\]\(([^)]+)\)/g,
            '👉 <a href="$2" target="_blank" style="color: #007bff; text-decoration: underline;">$1</a>');

        if (type === 'bot') {
            messageDiv.innerHTML = `<strong>🤖 AI Assistant:</strong> ${processedContent}`;
        } else {
            messageDiv.innerHTML = `<strong>👤 You:</strong> ${processedContent}`;
        }

        messagesContainer.appendChild(messageDiv);
        this.messages.push({ content, type, timestamp: Date.now() });

        this.saveMessagesToStorage();
        this.scrollToBottom();
    }

    showTyping() {
        document.getElementById('chatbot-typing').style.display = 'block';
        document.getElementById('chatbot-send').disabled = true;
    }

    hideTyping() {
        document.getElementById('chatbot-typing').style.display = 'none';
        document.getElementById('chatbot-send').disabled = false;
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatbot-messages');
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    saveMessagesToStorage() {
        try {
            localStorage.setItem('ai_chatbot_fullpage_messages', JSON.stringify(this.messages));
        } catch (error) {
            console.warn('Could not save messages to localStorage:', error);
        }
    }

    loadMessagesFromStorage() {
        try {
            const saved = localStorage.getItem('ai_chatbot_fullpage_messages');
            if (saved) {
                this.messages = JSON.parse(saved);
                // Load last 20 messages for full page view
                const recentMessages = this.messages.slice(-20);
                const messagesContainer = document.getElementById('chatbot-messages');

                recentMessages.forEach(msg => {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `chat-message ${msg.type}`;

                    // Convert blog post links to clickable HTML for loaded messages
                    let processedContent = msg.content;

                    // Convert [Title](URL) format to clickable links
                    processedContent = processedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
                        '<a href="$2" target="_blank" style="color: #007bff; text-decoration: underline;">$1</a>');

                    // Convert 👉 links to clickable format
                    processedContent = processedContent.replace(/👉 \[([^\]]+)\]\(([^)]+)\)/g,
                        '👉 <a href="$2" target="_blank" style="color: #007bff; text-decoration: underline;">$1</a>');

                    if (msg.type === 'bot') {
                        messageDiv.innerHTML = `<strong>🤖 AI Assistant:</strong> ${processedContent}`;
                    } else {
                        messageDiv.innerHTML = `<strong>👤 You:</strong> ${processedContent}`;
                    }

                    messagesContainer.appendChild(messageDiv);
                });

                this.scrollToBottom();
            }
        } catch (error) {
            console.warn('Could not load messages from localStorage:', error);
        }
    }
}

function goBack() {
    // Try to go back in history, fallback to home page
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = '/';
    }
}

// Theme Management
let currentTheme = 'light';

// Notification System for Chatbot Fullpage
let fullpageNotificationPermission = 'default';
let fullpageNotificationEnabled = false;

function initializeFullpageNotifications() {
    if (!('Notification' in window)) {
        console.log('Notifications not supported in chatbot fullpage');
        return;
    }

    fullpageNotificationEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    fullpageNotificationPermission = Notification.permission;

    updateFullpageNotificationUI();
}

function toggleFullpageNotifications() {
    if (fullpageNotificationPermission === 'default') {
        Notification.requestPermission().then(permission => {
            fullpageNotificationPermission = permission;
            if (permission === 'granted') {
                fullpageNotificationEnabled = true;
                localStorage.setItem('notificationsEnabled', 'true');
                console.log('Notifications enabled in chatbot fullpage!');
            } else {
                fullpageNotificationEnabled = false;
                localStorage.setItem('notificationsEnabled', 'false');
                console.log('Notifications disabled in chatbot fullpage.');
            }
            updateFullpageNotificationUI();
        });
    } else if (fullpageNotificationPermission === 'denied') {
        console.log('Notifications are blocked in browser settings.');
    } else {
        fullpageNotificationEnabled = !fullpageNotificationEnabled;
        localStorage.setItem('notificationsEnabled', fullpageNotificationEnabled.toString());

        if (fullpageNotificationEnabled) {
            console.log('Notifications enabled in chatbot fullpage!');
        } else {
            console.log('Notifications disabled in chatbot fullpage.');
        }

        updateFullpageNotificationUI();
    }
}

function updateFullpageNotificationUI() {
    // Add notification toggle to the top-right corner
    const container = document.querySelector('.chatbot-fullscreen-modal');
    if (container) {
        let notificationBtn = document.getElementById('fullpage-notification-toggle');
        if (!notificationBtn) {
            notificationBtn = document.createElement('button');
            notificationBtn.id = 'fullpage-notification-toggle';
            notificationBtn.className = 'btn btn-outline';
            notificationBtn.onclick = toggleFullpageNotifications;
            notificationBtn.title = 'Toggle post notifications';
            notificationBtn.style.position = 'fixed';
            notificationBtn.style.top = '20px';
            notificationBtn.style.right = '100px';
            notificationBtn.style.zIndex = '1001';

            document.body.appendChild(notificationBtn);
        }

        const icon = notificationBtn.querySelector('i') || document.createElement('i');
        if (fullpageNotificationPermission === 'granted' && fullpageNotificationEnabled) {
            icon.className = 'fas fa-bell';
            notificationBtn.classList.add('active');
        } else if (fullpageNotificationPermission === 'denied') {
            icon.className = 'fas fa-bell-slash';
        } else {
            icon.className = 'fas fa-bell';
            notificationBtn.classList.remove('active');
        }

        if (!notificationBtn.contains(icon)) {
            notificationBtn.appendChild(icon);
        }
    }
}

// Theme toggle function
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeToggleIcon();
}

// Apply theme to document
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

// Update theme toggle button icon
function updateThemeToggleIcon() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        const icon = toggleBtn.querySelector('i');
        if (currentTheme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }
}

console.log('🤖 Full Page Chatbot: Ready to chat!');

// Initialize chatbot and theme
document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        currentTheme = savedTheme;
        applyTheme(savedTheme);
    } else {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            currentTheme = 'dark';
            applyTheme('dark');
        }
    }

    // Update toggle button icon
    updateThemeToggleIcon();

    // Initialize notifications
    initializeFullpageNotifications();

    new FullPageChatbot();
});
