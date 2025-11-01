// AI Chatbot JavaScript
class AIChatbot {
    constructor() {
        this.apiUrl = '/api/posts/chatbot'; // Backend endpoint using same OpenRouterService as AI generation
        this.isOpen = false;
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
        this.createChatbotHTML();
        this.attachEventListeners();
        this.loadMessagesFromStorage();
    }

    createChatbotHTML() {
        const chatbotHTML = `
            <button class="chatbot-toggle" id="chatbot-toggle">
                <i class="fas fa-robot"></i>
            </button>

            <div class="chatbot-container" id="chatbot-container">
                <div class="chatbot-header">
                    <h3><i class="fas fa-robot"></i> AI Assistant</h3>
                    <div class="chatbot-header-buttons">
                        <button class="chatbot-expand" id="chatbot-expand" title="Open in new page">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        <button class="chatbot-close" id="chatbot-close">&times;</button>
                    </div>
                </div>

                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="chat-message bot">
                        <strong>🤖 AI Assistant:</strong> Hello! I'm your intelligent assistant for technology and science questions. I can help you understand AI, quantum computing, space exploration, programming, and scientific discoveries. What would you like to know?
                    </div>
                </div>

                <div class="chatbot-typing" id="chatbot-typing">
                    <span class="typing-dots">AI is typing</span>
                </div>

                <div class="chatbot-input-area">
                    <div class="chatbot-input-container">
                        <input type="text" class="chatbot-input" id="chatbot-input"
                               placeholder="Ask me anything..." maxlength="500">
                        <button class="chatbot-send" id="chatbot-send">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }

    attachEventListeners() {
        const toggle = document.getElementById('chatbot-toggle');
        const close = document.getElementById('chatbot-close');
        const expand = document.getElementById('chatbot-expand');
        const input = document.getElementById('chatbot-input');
        const send = document.getElementById('chatbot-send');

        toggle.addEventListener('click', () => this.toggleChat());
        close.addEventListener('click', () => this.closeChat());
        expand.addEventListener('click', () => this.expandChat());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        send.addEventListener('click', () => this.sendMessage());

        // Close chatbot when clicking outside
        document.addEventListener('click', (e) => {
            const container = document.getElementById('chatbot-container');
            const toggle = document.getElementById('chatbot-toggle');

            if (!container.contains(e.target) && !toggle.contains(e.target) && this.isOpen) {
                this.closeChat();
            }
        });
    }

    toggleChat() {
        const container = document.getElementById('chatbot-container');
        const toggle = document.getElementById('chatbot-toggle');

        if (this.isOpen) {
            this.closeChat();
        } else {
            container.style.display = 'flex';
            toggle.style.display = 'none';
            this.isOpen = true;
            this.scrollToBottom();

            // Focus on input
            setTimeout(() => {
                document.getElementById('chatbot-input').focus();
            }, 100);
        }
    }

    expandChat() {
        // Close the current popup chatbot
        this.closeChat();

        // Open chatbot in full-screen modal on same page
        this.openFullScreenModal();
    }

    openFullScreenModal() {
        // Create full-screen modal overlay
        const modalHTML = `
            <div id="chatbot-fullscreen-modal" class="chatbot-fullscreen-modal">
                <div class="chatbot-fullscreen-content">
                    <div class="chatbot-header">
                        <h3><i class="fas fa-robot"></i> AI Assistant - Full Screen</h3>
                        <div class="chatbot-header-buttons">
                            <button class="chatbot-close" id="fullscreen-close">&times;</button>
                        </div>
                    </div>

                    <div class="chatbot-messages" id="fullscreen-messages">
                        <div class="chat-message bot">
                            <strong>🤖 AI Assistant:</strong> Hello! I'm your intelligent assistant for technology and science questions. I can help you understand AI, quantum computing, space exploration, programming, and scientific discoveries. What would you like to know?
                        </div>
                    </div>

                    <div class="chatbot-typing" id="fullscreen-typing">
                        <span class="typing-dots">AI is typing</span>
                    </div>

                    <div class="chatbot-input-area">
                        <div class="chatbot-input-container">
                            <input type="text" class="chatbot-input" id="fullscreen-input"
                                   placeholder="Ask me anything about technology and science..." maxlength="500">
                            <button class="chatbot-send" id="fullscreen-send">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add fullscreen modal styles
        const style = document.createElement('style');
        style.textContent = `
            .chatbot-fullscreen-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(5px);
            }

            .chatbot-fullscreen-content {
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 12px;
                width: 90vw;
                max-width: 800px;
                height: 80vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            }

            .chatbot-fullscreen-content .chatbot-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px 12px 0 0;
            }

            .chatbot-fullscreen-content .chatbot-messages {
                flex: 1;
                background: #2a2a2a;
                padding: 20px;
                overflow-y: auto;
                border-radius: 0;
            }

            .chatbot-fullscreen-content .chatbot-input-area {
                background: #1a1a1a;
                border-top: 1px solid #333;
                padding: 20px;
                border-radius: 0 0 12px 12px;
            }

            .chatbot-fullscreen-modal .chat-message {
                margin-bottom: 15px;
                padding: 15px 20px;
                border-radius: 20px;
                max-width: 85%;
                word-wrap: break-word;
                line-height: 1.4;
            }

            @media (max-width: 768px) {
                .chatbot-fullscreen-content {
                    width: 95vw;
                    height: 90vh;
                }

                .chatbot-fullscreen-content .chatbot-messages {
                    padding: 15px;
                }

                .chatbot-fullscreen-content .chatbot-input-area {
                    padding: 15px;
                }
            }
        `;
        document.head.appendChild(style);

        // Setup event listeners for fullscreen modal
        document.getElementById('fullscreen-close').addEventListener('click', () => {
            document.getElementById('chatbot-fullscreen-modal').remove();
            style.remove();
        });

        document.getElementById('fullscreen-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendFullscreenMessage();
            }
        });

        document.getElementById('fullscreen-send').addEventListener('click', () => {
            this.sendFullscreenMessage();
        });

        // Focus on input
        setTimeout(() => {
            document.getElementById('fullscreen-input').focus();
        }, 100);

        // Close modal when clicking outside
        document.getElementById('chatbot-fullscreen-modal').addEventListener('click', (e) => {
            if (e.target.id === 'chatbot-fullscreen-modal') {
                document.getElementById('chatbot-fullscreen-modal').remove();
                style.remove();
            }
        });
    }

    async sendFullscreenMessage() {
        const input = document.getElementById('fullscreen-input');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addFullscreenMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showFullscreenTyping();

        try {
            const response = await this.callAI(message);
            this.hideFullscreenTyping();
            this.addFullscreenMessage(response, 'bot');
        } catch (error) {
            this.hideFullscreenTyping();
            console.error('Chatbot API Error:', error);

            // Try fallback response first
            const fallbackResponse = this.getFallbackResponse(message);
            if (fallbackResponse) {
                console.log('Using fallback response for:', message);
                this.addFullscreenMessage(fallbackResponse, 'bot');
                this.addFullscreenMessage('💡 Note: This response is from our fallback system. The AI API may be temporarily unavailable.', 'bot');
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
            this.addFullscreenMessage(errorMessage, 'bot');
        }
    }

    addFullscreenMessage(content, type) {
        const messagesContainer = document.getElementById('fullscreen-messages');
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
        this.scrollFullscreenToBottom();
    }

    showFullscreenTyping() {
        document.getElementById('fullscreen-typing').style.display = 'block';
        document.getElementById('fullscreen-send').disabled = true;
    }

    hideFullscreenTyping() {
        document.getElementById('fullscreen-typing').style.display = 'none';
        document.getElementById('fullscreen-send').disabled = false;
    }

    scrollFullscreenToBottom() {
        const messagesContainer = document.getElementById('fullscreen-messages');
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    closeChat() {
        const container = document.getElementById('chatbot-container');
        const toggle = document.getElementById('chatbot-toggle');

        container.style.display = 'none';
        toggle.style.display = 'flex';
        this.isOpen = false;
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
            console.log('Falling back to predefined responses...');

            // Try fallback response first
            const fallbackResponse = this.getFallbackResponse(message);
            if (fallbackResponse) {
                console.log('Using fallback response for:', message);
                this.addMessage(fallbackResponse, 'bot');
                // Add a note that this is from fallback
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
        console.log('Calling backend chatbot API (same as AI generation)...');

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

    addMessage(content, type) {
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
            localStorage.setItem('ai_chatbot_messages', JSON.stringify(this.messages));
        } catch (error) {
            console.warn('Could not save messages to localStorage:', error);
        }
    }

    loadMessagesFromStorage() {
        try {
            const saved = localStorage.getItem('ai_chatbot_messages');
            if (saved) {
                this.messages = JSON.parse(saved);
                // Load last 10 messages to avoid clutter
                const recentMessages = this.messages.slice(-10);
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

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AIChatbot();
});

// Debug function for testing API connectivity
window.testChatbotAPI = async function(message = "hi") {
    console.log('🧪 Testing Backend Chatbot API with message:', message);

    const apiUrl = '/api/posts/chatbot';

    try {
        console.log('📡 Making backend API call...');
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message
            })
        });

        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend Error:', errorText);
            return { success: false, error: `Status ${response.status}: ${errorText}` };
        }

        const data = await response.json();
        console.log('✅ Backend Success:', data);

        if (data.success && data.data) {
            return { success: true, response: data.data.trim() };
        } else {
            return { success: false, error: 'Invalid backend response structure' };
        }

    } catch (error) {
        console.error('❌ Network Error:', error);
        return { success: false, error: error.message };
    }
};

console.log('🤖 Chatbot Debug: Use testChatbotAPI("your message") in console to test backend API connectivity');
