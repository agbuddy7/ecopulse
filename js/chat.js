/**
 * @fileoverview EcoBot chat panel: message rendering, the welcome message, and
 * wiring for sending/clearing messages.
 */

import { store } from './state.js';
import { dom } from './dom.js';
import { processAssistantMessage } from './assistant.js';
import { sanitizeText, announceToScreenReader } from './utils.js';
import { CHAT_REPLY_DELAY_MS } from './constants.js';

/**
 * Converts a chat message's lightweight markdown (bold/italic/bullets) into safe HTML.
 * @param {string} text - Raw assistant or user message text.
 * @returns {string} Sanitized HTML.
 */
function formatMessageHtml(text) {
  return text
    .split('\n\n')
    .map((paragraph) => {
      if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
        const items = paragraph.split(/\n[-*]\s+/).map((item) => {
          const cleanItem = sanitizeText(item.replace(/^[-*]\s+/, ''))
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
          return `<li>${cleanItem}</li>`;
        });
        return `<ul>${items.join('')}</ul>`;
      }

      const cleanParagraph = sanitizeText(paragraph)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      return `<p>${cleanParagraph}</p>`;
    })
    .join('');
}

/**
 * Appends a chat message bubble to the EcoBot conversation.
 * @param {'user'|'assistant'} sender
 * @param {string} text - Message content (markdown-lite, sanitized internally).
 */
function appendChatMessage(sender, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message chat-message-${sender}`;

  const time = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  messageDiv.innerHTML = `
    <div class="chat-message-content">${formatMessageHtml(text)}</div>
    <span class="chat-message-time">${time}</span>
  `;

  dom.chatMessages.appendChild(messageDiv);
  dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
}

/**
 * Injects EcoBot's initial greeting/instructions into an empty chat panel.
 */
export function welcomeEcoBot() {
  appendChatMessage(
    'assistant',
    `Hello! I am **EcoBot**, your sustainability advisor. 🤖

I can help you understand and track your carbon emissions. Try typing commands like:
- *'I drove 15 km today'*
- *'I ate a vegetarian lunch'*
- *'Give me household energy tips'*

What would you like to log or learn today?`
  );
}

/**
 * Wires up chat message submission and the "clear chat" button.
 */
export function setupChat() {
  dom.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const rawMsg = dom.chatUserMessage.value;
    if (!rawMsg.trim()) return;

    appendChatMessage('user', rawMsg);
    dom.chatUserMessage.value = '';

    // Small delay so EcoBot's reply feels conversational rather than instant.
    setTimeout(() => {
      const reply = processAssistantMessage(rawMsg, store);
      appendChatMessage('assistant', reply.text);
      announceToScreenReader('EcoBot replied.');
    }, CHAT_REPLY_DELAY_MS);
  });

  dom.btnClearChat.addEventListener('click', () => {
    dom.chatMessages.innerHTML = '';
    welcomeEcoBot();
  });
}
