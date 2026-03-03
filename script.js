// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Состояние приложения
let currentModel = 'funny';
let thinkingMode = false;
let memoryMode = false;
let timerEnabled = true;
let messages = [];

// Элементы DOM
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const thinkingBtn = document.getElementById('thinkingBtn');
const memoryBtn = document.getElementById('memoryBtn');
const clearBtn = document.getElementById('clearBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const timerToggle = document.getElementById('timerToggle');
const memoryToggle = document.getElementById('memoryToggle');
const themeSelect = document.getElementById('themeSelect');

// Переключение моделей
document.querySelectorAll('.model-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentModel = this.dataset.model;

        // Отправляем на сервер
        fetch('/api/switch_model', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({model: currentModel})
        });

        // Добавляем системное сообщение
        addSystemMessage(`Переключено на ${this.textContent}`);
    });
});

// Отправка сообщения
async function sendMessage() {
    let text = messageInput.value.trim();
    if (!text) return;

    // Добавляем ! или : если включены режимы
    if (memoryMode && !text.startsWith('!')) {
        text = '! ' + text;
    } else if (thinkingMode && !text.startsWith(':')) {
        text = ': ' + text;
    }

    // Показываем сообщение пользователя
    addMessage('user', text);
    messageInput.value = '';

    // Показываем индикатор печатания
    showTypingIndicator();

    try {
        // Отправляем запрос
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                message: text,
                model: currentModel,
                thinking: thinkingMode
            })
        });

        const data = await response.json();
        hideTypingIndicator();

        // Если это размышление
        if (data.thinking) {
            showThinking(data.thinking, data.response);
        } else {
            addMessage('bot', data.response);
        }

    } catch (error) {
        hideTypingIndicator();
        addMessage('bot', '❌ Ошибка связи с сервером');
    }
}

// Добавление сообщения
function addMessage(role, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = role === 'user' ? '👤' : '🤖';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(bubble);
    messagesContainer.appendChild(messageDiv);

    // Скролл вниз
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Добавление системного сообщения
function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = '⚙️';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    bubble.style.background = 'var(--tg-theme-hint-color)';

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(bubble);
    messagesContainer.appendChild(messageDiv);
}

// Показать размышление
function showThinking(thinking, response) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = '🧠';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    // Анимация печатания
    let i = 0;
    bubble.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(bubble);
    messagesContainer.appendChild(messageDiv);

    // Эффект печатания
    const interval = setInterval(() => {
        if (i < thinking.length) {
            bubble.innerHTML = thinking.substring(0, i + 1);
            i++;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                // Удаляем размышление и показываем ответ
                messageDiv.remove();
                addMessage('bot', response);
            }, 1000);
        }
    }, 50);
}

// Индикатор печатания
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message bot';
    indicator.id = 'typingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = '🤖';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

    indicator.appendChild(avatar);
    indicator.appendChild(bubble);
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

// Переключение режима размышления
thinkingBtn.addEventListener('click', function() {
    thinkingMode = !thinkingMode;
    this.classList.toggle('active');
    if (thinkingMode) {
        memoryMode = false;
        memoryBtn.style.opacity = '0.5';
    } else {
        memoryBtn.style.opacity = '1';
    }
});

// Переключение памяти
memoryBtn.addEventListener('click', function() {
    memoryMode = !memoryMode;
    if (memoryMode) {
        thinkingMode = false;
        thinkingBtn.classList.remove('active');
    }
});

// Очистка чата
clearBtn.addEventListener('click', function() {
    messagesContainer.innerHTML = '';
    addSystemMessage('Чат очищен');
});

// Открытие настроек
settingsBtn.addEventListener('click', function() {
    settingsModal.classList.add('show');
});

// Закрытие настроек
closeSettings.addEventListener('click', function() {
    settingsModal.classList.remove('show');
});

// Отправка по Enter
messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
});

sendBtn.addEventListener('click', sendMessage);

// Закрытие модалки по клику вне
settingsModal.addEventListener('click', function(e) {
    if (e.target === settingsModal) {
        settingsModal.classList.remove('show');
    }
});

// Сохранение настроек
timerToggle.addEventListener('change', function() {
    timerEnabled = this.checked;
});

memoryToggle.addEventListener('change', function() {
    memoryMode = this.checked;
});

themeSelect.addEventListener('change', function() {
    if (this.value === 'light') {
        document.body.classList.add('light-theme');
    } else if (this.value === 'dark') {
        document.body.classList.remove('light-theme');
    } else {
        // Авто - убираем принудительную тему
        document.body.classList.remove('light-theme');
    }
});

// Инициализация
tg.ready();
tg.setHeaderColor('#2a2a2a');

// Добавляем приветственное сообщение
addSystemMessage('Добро пожаловать! Используй 🧠 для размышлений, 💭 для памяти');