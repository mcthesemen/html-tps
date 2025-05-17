document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        sidebar: document.getElementById('sidebar'),
        settingsBtn: document.getElementById('settingsBtn'),
        settingsPanel: document.getElementById('settingsPanel'),
        darkModeToggle: document.getElementById('darkModeToggle'),
        backBtn: document.getElementById('backBtn'),
        messageInput: document.getElementById('messageInput'),
        sendBtn: document.getElementById('sendBtn'),
        messagesContainer: document.getElementById('messages'),
        chatList: document.getElementById('chatList'),
        overlay: document.getElementById('overlay'),
        body: document.body,
        activeChat: document.querySelector('.chat-item'),
        chatPreview: document.querySelector('.chat-item-preview'),
        chatPath: document.querySelector('.chat-item-path'),
        errorNotification: document.getElementById('errorNotification'),
        addChatBtn: document.getElementById('addChatBtn'),
        newChatModal: document.getElementById('newChatModal'),
        newChatName: document.getElementById('newChatName'),
        createChatBtn: document.getElementById('createChatBtn'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        cancelChatBtn: document.getElementById('cancelChatBtn'),
        exitBtn: document.getElementById('exitBtn')
    };

    const constants = {
        MAX_MESSAGE_LENGTH: 1000,
        PREVIEW_LENGTH: 35,
        ERROR_DISPLAY_TIME: 3000
    };

    const state = {
        chatData: {
            'Note': {
                messages: ['Welcome to Note Chat!'],
                path: 'C:\\Note\\Messages',
                unread: 0
            }
        },
        inChatListView: window.innerWidth > 768,
        currentChat: 'Note',
        speechSynthesis: window.speechSynthesis || null,
        voices: []
    };

    function init() {
        setInitialAssets();
        setupEventListeners();
        loadSavedTheme();
        renderMessages();
        updateAddChatButtonVisibility();
        loadVoices();
    }

    function setupEventListeners() {

        elements.settingsBtn.addEventListener('click', toggleSettings);
        elements.overlay.addEventListener('click', closeAllModals);
        elements.darkModeToggle.addEventListener('change', toggleDarkMode);
        elements.backBtn.addEventListener('click', toggleSidebar);
        elements.sendBtn.addEventListener('click', sendMessage);
        elements.exitBtn.addEventListener('click', exitApp);
 
        elements.messageInput.addEventListener('input', handleInput);
        elements.messageInput.addEventListener('keydown', handleKeyPress);
        
        elements.chatList.addEventListener('click', handleChatListClick);
        
        elements.addChatBtn.addEventListener('click', showNewChatModal);
        elements.createChatBtn.addEventListener('click', createNewChat);
        elements.closeModalBtn.addEventListener('click', closeNewChatModal);
        elements.cancelChatBtn.addEventListener('click', closeNewChatModal);
        
        window.addEventListener('resize', handleResize);
    }

    function setInitialAssets() {
        const isDarkMode = elements.body.classList.contains('dark-mode');
        
        document.querySelector('.search-icon').style.backgroundImage = 
            `url('${isDarkMode ? 'img/search_white.png' : 'img/search.png'}')`;
        document.querySelector('.settings-btn').style.backgroundImage = 
            `url('${isDarkMode ? 'img/settings_white.png' : 'img/settings.png'}')`;
        
        // Фон сообщений
        document.querySelector('.messages').style.backgroundImage = 
            `url('${isDarkMode ? 'img/background.jpg' : 'img/background_white.jpg'}')`;
        
        // Путь текущего чата
        elements.chatPath.textContent = 
            `${state.chatData[state.currentChat].path} #${isDarkMode ? 'dark' : 'light'}`;
    }

    function toggleDarkMode() {
        elements.body.classList.toggle('dark-mode');
        const isDarkMode = elements.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        setInitialAssets();
        updateAddChatButtonVisibility();
    }

    function loadSavedTheme() {
        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme === 'false') {
            elements.body.classList.remove('dark-mode');
            elements.darkModeToggle.checked = false;
        }
    }

    function renderMessages() {
        const messages = state.chatData[state.currentChat].messages;
        
        elements.messagesContainer.innerHTML = messages.map(msg => {
            const isIncoming = msg === 'Welcome to Note Chat!';
            return `
                <div class="message ${isIncoming ? 'message-in' : 'message-out'}">
                    <div class="message-text">${msg}</div>
                    <button class="voice-over-btn" title="Озвучить сообщение" data-text="${escapeHtml(msg)}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 1C14.2091 1 16 2.79086 16 5V12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12V5C8 2.79086 9.79086 1 12 1Z" fill="currentColor"/>
                            <path d="M4 9C4 8.44772 4.44772 8 5 8C5.55228 8 6 8.44772 6 9V12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12V9C18 8.44772 18.4477 8 19 8C19.5523 8 20 8.44772 20 9V12C20 16.0796 16.9463 19.446 13 19.9381V21H17C17.5523 21 18 21.4477 18 22C18 22.5523 17.5523 23 17 23H7C6.44772 23 6 22.5523 6 22C6 21.4477 6.44772 21 7 21H11V19.9381C7.05369 19.446 4 16.0796 4 12V9Z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');
        
        document.querySelectorAll('.voice-over-btn').forEach(btn => {
            btn.addEventListener('click', speakMessage);
        });
        
        scrollToBottom();
    }

    function speakMessage(e) {
        const text = e.currentTarget.getAttribute('data-text');
        if (!text || !state.speechSynthesis) {
            showError('Voice over is not available');
            return;
        }
        
        state.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        if (state.voices.length > 0) {
            utterance.voice = state.voices.find(v => v.default) || state.voices[0];
        }
        
        state.speechSynthesis.speak(utterance);
    }

    function loadVoices() {
        if (!state.speechSynthesis) return;
        
        state.speechSynthesis.onvoiceschanged = () => {
            state.voices = state.speechSynthesis.getVoices();
        };
        
        state.voices = state.speechSynthesis.getVoices();
    }

    function sendMessage() {
        const messageText = elements.messageInput.value.trim();
        
        if (messageText.length > constants.MAX_MESSAGE_LENGTH) {
            showError(`Message limit exceeded by ${messageText.length - constants.MAX_MESSAGE_LENGTH} symbols`);
            return;
        }
        
        if (!messageText) return;

        state.chatData[state.currentChat].messages.push(messageText);
        renderMessages();
        updateChatPreview(messageText);
        resetInputField();
    }

    function updateChatPreview(text) {
        elements.chatPreview.textContent = text.length > constants.PREVIEW_LENGTH ? 
            `${text.substring(0, constants.PREVIEW_LENGTH)}...` : text;
    }

    function resetInputField() {
        elements.messageInput.value = '';
        elements.messageInput.style.height = '40px';
    }

    function scrollToBottom() {
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    }

    function handleInput() {
        autoResizeTextarea(this);
        enforceMaxLength(this);
    }

    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }

    function enforceMaxLength(field) {
        if (field.value.length > constants.MAX_MESSAGE_LENGTH) {
            const overflow = field.value.length - constants.MAX_MESSAGE_LENGTH;
            field.value = field.value.substring(0, constants.MAX_MESSAGE_LENGTH);
            showError(`Character limit exceeded by ${overflow} symbols`);
        }
    }

    function handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    function showError(message) {
        elements.errorNotification.querySelector('span').textContent = message;
        elements.errorNotification.classList.add('active');
        
        setTimeout(() => {
            elements.errorNotification.classList.remove('active');
        }, constants.ERROR_DISPLAY_TIME);
    }

    function handleChatListClick(e) {
        if (elements.settingsPanel.classList.contains('open')) {
            toggleSettings();
            return;
        }
        
        const chatItem = e.target.closest('.chat-item');
        if (!chatItem) return;
        
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
        
        document.querySelectorAll('.chat-item').forEach(i => 
            i.classList.remove('active-chat'));
        chatItem.classList.add('active-chat');
        
        updateAddChatButtonVisibility();
    }

    function toggleSettings() {
        elements.settingsPanel.classList.toggle('open');
        elements.overlay.classList.toggle('active');
        updateAddChatButtonVisibility();
    }

    function toggleSidebar() {
        elements.sidebar.classList.toggle('open');
        state.inChatListView = elements.sidebar.classList.contains('open');
        updateAddChatButtonVisibility();
    }

    function closeAllModals() {
        elements.newChatModal.classList.remove('active');
        elements.settingsPanel.classList.remove('open');
        elements.overlay.classList.remove('active');
        elements.sidebar.classList.remove('open');
        state.inChatListView = window.innerWidth > 768;
        updateAddChatButtonVisibility();
    }

    function updateAddChatButtonVisibility() {
        const isMobile = window.innerWidth <= 768;
        const isSettingsPanelOpen = elements.settingsPanel.classList.contains('open');
        
        if ((isMobile && elements.sidebar.classList.contains('open') && !isSettingsPanelOpen) || 
            (!isMobile && !isSettingsPanelOpen)) {
            elements.addChatBtn.style.display = 'flex';
        } else {
            elements.addChatBtn.style.display = 'none';
        }
    }

    function showNewChatModal() {
        elements.newChatModal.classList.add('active');
        elements.overlay.classList.add('active');
        elements.newChatName.focus();
    }

    function closeNewChatModal() {
        elements.newChatModal.classList.remove('active');
        elements.overlay.classList.remove('active');
        elements.newChatName.value = '';
    }

    function createNewChat() {
        const chatName = elements.newChatName.value.trim();
        
        if (!chatName) {
            showError('Please enter chat name');
            return;
        }
        
        if (state.chatData[chatName]) {
            showError('Chat with this name already exists');
            return;
        }
        
        state.chatData[chatName] = {
            messages: [],
            path: `C:\\Note\\${chatName}`,
            unread: 0
        };
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.innerHTML = `
            <div class="chat-item-avatar">${chatName[0].toUpperCase()}</div>
            <div class="chat-item-info">
                <div class="chat-item-name">${chatName}</div>
                <div class="chat-item-preview">No messages yet</div>
                <div class="chat-item-path">${state.chatData[chatName].path} #${elements.body.classList.contains('dark-mode') ? 'dark' : 'light'}</div>
            </div>
        `;
        
        elements.chatList.appendChild(chatItem);
        closeNewChatModal();
    }

    function exitApp() {
        window.location.href = 'login_page.html';
    }

    function handleResize() {
        const shouldBeOpen = window.innerWidth > 768;
        state.inChatListView = shouldBeOpen || elements.sidebar.classList.contains('open');
        updateAddChatButtonVisibility();
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    init();
});