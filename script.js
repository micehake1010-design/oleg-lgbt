// script.js - ИСПРАВЛЕННАЯ ВЕРСИЯ ДЛЯ GITHUB PAGES
let tg = window.Telegram.WebApp;
tg.expand();

let currentModel = 'funny';
let thinkingMode = false;
let memoryMode = false;

const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

// ТВОЙ ЛОКАЛЬНЫЙ СЕРВЕР (замени на свой IP)
const LOCAL_SERVER = 'http://192.168.1.11:5000';

async function sendMessage() {
    let text = messageInput.value.trim();
    if (!text) return;

    addMessage('user', text);
    messageInput.value = '';

    try {
        // Пытаемся отправить на локальный сервер
        const response = await fetch(`${LOCAL_SERVER}/api/chat`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                message: text,
                model: currentModel,
                thinking: thinkingMode
            })
        });

        const data = await response.json();
        addMessage('bot', data.response || 'Ответ получен');
        
    } catch (error) {
        console.error('Ошибка:', error);
        addMessage('bot', '❌ Локальный сервер не запущен. Запусти mini_server.py');
    }
}

// Добавление сообщения
function addMessage(role, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.innerHTML = `
        <div class="avatar">${role === 'user' ? '👤' : '🤖'}</div>
        <div class="bubble">${text}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
