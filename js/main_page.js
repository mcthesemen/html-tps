document.addEventListener('DOMContentLoaded', function() {
    const DOM = {
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
        chatArea: document.querySelector('.chat-area'),
        exitBtn: document.getElementById('exitBtn')
    };

    const MAX_MESSAGE_LENGTH = 1000;
    const PREVIEW_LENGTH = 35;
    const ERROR_DISPLAY_TIME = 3000;

    let chatData = {
        'Note': {
            messages: ['Welcome to Note Chat!'],
            path: 'C:\\Note\\Messages',
            unread: 0
        }
    };

    let inChatListView = window.innerWidth > 768;

    function init() {
        setInitialAssets();
        setupEventListeners();
        loadSavedTheme();
        renderMessages();
        updateAddChatButtonVisibility();
    }

    function setupEventListeners() {
        DOM.settingsBtn.addEventListener('click', handleSettingsToggle);
        DOM.overlay.addEventListener('click', closeAllModals);
        DOM.chatList.addEventListener('click', handleChatListClick);
        DOM.darkModeToggle.addEventListener('change', toggleDarkMode);
        DOM.backBtn.addEventListener('click', toggleSidebar);
        DOM.sendBtn.addEventListener('click', sendMessage);
        DOM.messageInput.addEventListener('input', handleInput);
        DOM.messageInput.addEventListener('keydown', handleKeyPress);
        DOM.exitBtn.addEventListener('click', exitApp);
        window.addEventListener('resize', handleResize);
        
        DOM.addChatBtn.addEventListener('click', showNewChatModal);
        DOM.createChatBtn.addEventListener('click', createNewChat);
        DOM.closeModalBtn.addEventListener('click', closeNewChatModal);
        DOM.cancelChatBtn.addEventListener('click', closeNewChatModal);
    }

    function setInitialAssets() {
        const isDarkMode = DOM.body.classList.contains('dark-mode');
        const assets = {
            searchIcon: document.querySelector('.search-icon'),
            settingsIcon: document.querySelector('.settings-btn'),
            messagesBg: document.querySelector('.messages')
        };

        assets.searchIcon.style.backgroundImage = `url('${isDarkMode ? 'img/search_white.png' : 'img/search.png'}')`;
        assets.settingsIcon.style.backgroundImage = `url('${isDarkMode ? 'img/settings_white.png' : 'img/settings.png'}')`;
        assets.messagesBg.style.backgroundImage = `url('${isDarkMode ? 'img/background.jpg' : 'img/background_white.jpg'}')`;
        
        DOM.chatPath.textContent = `${chatData.Note.path} #${isDarkMode ? 'dark' : 'light'}`;
    }

    function toggleDarkMode() {
        DOM.body.classList.toggle('dark-mode');
        const isDarkMode = DOM.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        setInitialAssets();
        updateAddChatButtonVisibility();
    }

    function loadSavedTheme() {
        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme === 'false') {
            DOM.body.classList.remove('dark-mode');
            DOM.darkModeToggle.checked = false;
        }
    }

    function showError(message) {
        DOM.errorNotification.querySelector('span').textContent = message;
        DOM.errorNotification.classList.add('active');
        
        setTimeout(() => {
            DOM.errorNotification.classList.remove('active');
        }, ERROR_DISPLAY_TIME);
    }

    function handleChatListClick(e) {
        const chatItem = e.target.closest('.chat-item');
        if (!chatItem) return;
        
        if (window.innerWidth <= 768) {
            DOM.sidebar.classList.remove('open');
            DOM.overlay.classList.remove('active');
            DOM.settingsPanel.classList.remove('open');
            inChatListView = false;
        }
        
        document.querySelectorAll('.chat-item').forEach(i => 
            i.classList.remove('active-chat'));
        chatItem.classList.add('active-chat');
        
        updateAddChatButtonVisibility();
    }

    function handleInput() {
        autoResizeTextarea(this);
        enforceMaxLength(this);
    }

    function handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }

    function enforceMaxLength(field) {
        if (field.value.length > MAX_MESSAGE_LENGTH) {
            const overflow = field.value.length - MAX_MESSAGE_LENGTH;
            field.value = field.value.substring(0, MAX_MESSAGE_LENGTH);
            showError(`Character limit exceeded by ${overflow} symbols`);
        }
    }

    function renderMessages() {
        DOM.messagesContainer.innerHTML = chatData.Note.messages
            .map(msg => `<div class="message ${msg === 'Welcome to Note Chat!' ? 
                'message-in' : 'message-out'}">${msg}</div>`)
            .join('');
    }

    function sendMessage() {
        const messageText = DOM.messageInput.value.trim();
        
        if (messageText.length > MAX_MESSAGE_LENGTH) {
            showError(`Message limit exceeded by ${messageText.length - MAX_MESSAGE_LENGTH} symbols`);
            return;
        }
        
        if (!messageText) return;

        chatData.Note.messages.push(messageText);
        renderMessages();
        updateChatPreview(messageText);
        resetInputField();
        scrollToBottom();
    }

    function updateChatPreview(text) {
        DOM.chatPreview.textContent = text.length > PREVIEW_LENGTH ? 
            `${text.substring(0, PREVIEW_LENGTH)}...` : text;
    }

    function resetInputField() {
        DOM.messageInput.value = '';
        DOM.messageInput.style.height = '40px';
    }

    function scrollToBottom() {
        DOM.messagesContainer.scrollTop = DOM.messagesContainer.scrollHeight;
    }

    function handleSettingsToggle(e) {
        e.stopPropagation();
        DOM.settingsPanel.classList.toggle('open');
        DOM.overlay.classList.toggle('active');
        updateAddChatButtonVisibility();
    }

    function closeAllModals() {
        DOM.newChatModal.classList.remove('active');
        DOM.settingsPanel.classList.remove('open');
        DOM.overlay.classList.remove('active');
        DOM.sidebar.classList.remove('open');
        inChatListView = window.innerWidth > 768;
        updateAddChatButtonVisibility();
    }

    function toggleSidebar() {
        DOM.sidebar.classList.toggle('open');
        inChatListView = DOM.sidebar.classList.contains('open');
        updateAddChatButtonVisibility();
    }

    function updateAddChatButtonVisibility() {
        const isMobile = window.innerWidth <= 768;
        const isSettingsPanelOpen = DOM.settingsPanel.classList.contains('open');
        
        if ((isMobile && DOM.sidebar.classList.contains('open') && !isSettingsPanelOpen) || 
            (!isMobile && !isSettingsPanelOpen)) {
            DOM.addChatBtn.style.display = 'flex';
        } else {
            DOM.addChatBtn.style.display = 'none';
        }
    }

    function showNewChatModal() {
        DOM.newChatModal.classList.add('active');
        DOM.overlay.classList.add('active');
        DOM.newChatName.focus();
    }

    function closeNewChatModal() {
        DOM.newChatModal.classList.remove('active');
        DOM.overlay.classList.remove('active');
    }

    function createNewChat() {
        const chatName = DOM.newChatName.value.trim();
        
        if (!chatName) {
            showError('Please enter chat name');
            return;
        }
        
        if (chatData[chatName]) {
            showError('Chat with this name already exists');
            return;
        }
        
        const newChat = {
            messages: [],
            path: `C:\\Note\\${chatName}`,
            unread: 0
        };
        
        chatData[chatName] = newChat;
        
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.innerHTML = `
            <div class="chat-item-avatar">${chatName[0].toUpperCase()}</div>
            <div class="chat-item-info">
                <div class="chat-item-name">${chatName}</div>
                <div class="chat-item-preview">No messages yet</div>
                <div class="chat-item-path">${newChat.path} #${DOM.body.classList.contains('dark-mode') ? 'dark' : 'light'}</div>
            </div>
        `;
        
        DOM.chatList.appendChild(chatItem);
        DOM.newChatName.value = '';
        closeNewChatModal();
    }

    function exitApp() {
        window.location.href = 'login_page.html';
    }

    function handleResize() {
        const shouldBeOpen = window.innerWidth > 768;
        inChatListView = shouldBeOpen || DOM.sidebar.classList.contains('open');
        updateAddChatButtonVisibility();
    }

    init();
});