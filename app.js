
const chat = document.querySelector('#chat');
const composer = document.querySelector('#composer');
const input = document.querySelector('#messageInput');
const memoryDialog = document.querySelector('#memoryDialog');
const memoryList = document.querySelector('#memoryList');

const memoriesKey = 'zoe_ai_memories_v1';
const historyKey = 'zoe_ai_chat_v1';

const WORKER_URL =
  'https://hidden-snowflake-f1c6.alnzocolin139.workers.dev/';

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

  return el;
}

function renderHistory() {
  const history = read(historyKey, []);
  if (history.length) {
    chat.innerHTML = '';
    history.forEach(m => addMessage(m.text, m.who, false));
  }
}

async function askZoe(message) {
  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Gemini API error');
  }

  if (typeof data.reply !== 'string' || !data.reply.trim()) {
    throw new Error('لم يصل رد صالح من زوي.');
  }

  return data.reply;
}

composer.addEventListener('submit', async e => {
  e.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  input.value = '';
  input.style.height = 'auto';

  const loading = addMessage('زوي تكتب لك... 💜', 'zoe', false);

  try {
    const reply = await askZoe(text);
    loading.textContent = reply;

    const history = read(historyKey, []);
    history.push({
      text: reply,
      who: 'zoe',
      at: Date.now()
    });
    save(historyKey, history.slice(-80));

  } catch (error) {
    loading.textContent =
      'آسفة، صار عندي خلل بالاتصال: ' + error.message;
  }

  chat.scrollTop = chat.scrollHeight;
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
