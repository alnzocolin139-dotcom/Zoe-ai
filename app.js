
const chat = document.querySelector('#chat');
const composer = document.querySelector('#composer');
const input = document.querySelector('#messageInput');
const memoryDialog = document.querySelector('#memoryDialog');
const memoryList = document.querySelector('#memoryList');

const memoriesKey = 'zoe_ai_memories_v1';
const historyKey = 'zoe_ai_chat_v1';

const API_URL =
  'https://hidden-snowflake-f1c6.workers.dev';

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function addMessage(text, who, persist = true) {
  const el = document.createElement('div');
  el.className = 'message ' + who;
  el.textContent = text;
  chat.append(el);
  chat.scrollTop = chat.scrollHeight;

  if (persist) {
    const history = read(historyKey, []);
    history.push({ text, who, at: Date.now() });
    save(historyKey, history.slice(-80));
  }
}

function renderHistory() {
  const history = read(historyKey, []);
  if (history.length) {
    chat.innerHTML = '';
    history.forEach(m => addMessage(m.text, m.who, false));
  }
}

async function askZoe(message, previousHistory) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      memories: read(memoriesKey, []),
      history: previousHistory
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'حدث خطأ في الاتصال');
  }

  if (!data.reply) {
    throw new Error('لم يصل رد من زوي');
  }

  return data.reply;
}

composer.addEventListener('submit', async e => {
  e.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  const previousHistory = read(historyKey, []).slice(-16);

  addMessage(text, 'user');
  input.value = '';
  input.style.height = 'auto';

  const loading = document.createElement('div');
  loading.className = 'message zoe';
  loading.textContent = 'زوي تفكر... 💜';
  chat.append(loading);
  chat.scrollTop = chat.scrollHeight;

  try {
    const reply = await askZoe(text, previousHistory);
    loading.remove();
    addMessage(reply, 'zoe');
  } catch (error) {
    loading.remove();
    addMessage(
      'صار عندي خطأ بالاتصال بالخادم: ' + error.message,
      'zoe'
    );
  }
});

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 120) + 'px';
});

document.querySelector('#memoryBtn').addEventListener('click', () => {
  renderMemories();
  memoryDialog.showModal();
});

function renderMemories() {
  memoryList.innerHTML = '';

  read(memoriesKey, []).forEach((m, i) => {
    const li = document.createElement('li');
    li.textContent = m + ' ';

    const del = document.createElement('button');
    del.textContent = 'حذف';
    del.className = 'ghost';
    del.type = 'button';

    del.addEventListener('click', () => {
      const arr = read(memoriesKey, []);
      arr.splice(i, 1);
      save(memoriesKey, arr);
      renderMemories();
    });

    li.append(del);
    memoryList.append(li);
  });
}

document.querySelector('#memoryForm').addEventListener('submit', e => {
  e.preventDefault();

  const field = document.querySelector('#memoryInput');
  const value = field.value.trim();
  if (!value) return;

  const arr = read(memoriesKey, []);
  arr.push(value);
  save(memoriesKey, arr);

  field.value = '';
  renderMemories();
});

document.querySelector('#clearMemory').addEventListener('click', () => {
  if (confirm('متأكد تريد حذف كل الذكريات المحفوظة على هذا الجهاز؟')) {
    localStorage.removeItem(memoriesKey);
    renderMemories();
  }
});

renderHistory();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
