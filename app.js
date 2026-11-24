const chat = document.querySelector('#chat');
const composer = document.querySelector('#composer');
const input = document.querySelector('#messageInput');
const memoryDialog = document.querySelector('#memoryDialog');
const memoryList = document.querySelector('#memoryList');
const memoriesKey = 'zoe_ai_memories_v1';
const historyKey = 'zoe_ai_chat_v1';

function read(key, fallback){try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback}}
function save(key, value){localStorage.setItem(key, JSON.stringify(value))}
function addMessage(text, who, persist=true){
  const el=document.createElement('div');
  el.className='message '+who;
  el.textContent=text;
  chat.append(el);
  chat.scrollTop=chat.scrollHeight;
  if(persist){
    const history=read(historyKey,[]);
    history.push({text,who,at:Date.now()});
    save(historyKey,history.slice(-80));
  }
}
function renderHistory(){
  const history=read(historyKey,[]);
  if(history.length){chat.innerHTML='';history.forEach(m=>addMessage(m.text,m.who,false));}
}
function localReply(text){
  const memories=read(memoriesKey,[]);
  const lower=text.toLowerCase();
  if(lower.includes('شنو تتذكر')||lower.includes('ماذا تتذكر')){
    return memories.length ? 'هذه المعلومات المحفوظة محلياً:\n• '+memories.join('\n• ') : 'لحد الآن ما عندي ذكريات محفوظة. افتح زر «الذاكرة» وأضف معلومة تحب أحفظها.';
  }
  if(lower.includes('مرحبا')||lower.includes('هلا')||lower.includes('السلام')){
    return 'هلا بيك! 💜 النسخة الأولى جاهزة للتجربة. بعدين نربطها بنموذج ذكاء اصطناعي حتى تصير الإجابات حوارية فعلاً.';
  }
  return 'وصلت رسالتك 💜 حالياً هذه نسخة أولية للواجهة والذاكرة المحلية، وليست مرتبطة بعد بنموذج ذكاء اصطناعي. الخطوة التالية هي ربط واجهة آمنة بخدمة نموذج لغوي.';
}
composer.addEventListener('submit',e=>{
  e.preventDefault();
  const text=input.value.trim();
  if(!text)return;
  addMessage(text,'user');
  input.value='';
  setTimeout(()=>addMessage(localReply(text),'zoe'),250);
});
input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,120)+'px';});
document.querySelector('#memoryBtn').addEventListener('click',()=>{renderMemories();memoryDialog.showModal();});
function renderMemories(){
  memoryList.innerHTML='';
  read(memoriesKey,[]).forEach((m,i)=>{
    const li=document.createElement('li');li.textContent=m+' ';
    const del=document.createElement('button');del.textContent='حذف';del.className='ghost';del.type='button';
    del.addEventListener('click',()=>{const arr=read(memoriesKey,[]);arr.splice(i,1);save(memoriesKey,arr);renderMemories();});
    li.append(del);memoryList.append(li);
  });
}
document.querySelector('#memoryForm').addEventListener('submit',e=>{
  e.preventDefault();const field=document.querySelector('#memoryInput');const value=field.value.trim();if(!value)return;
  const arr=read(memoriesKey,[]);arr.push(value);save(memoriesKey,arr);field.value='';renderMemories();
});
document.querySelector('#clearMemory').addEventListener('click',()=>{
  if(confirm('متأكد تريد حذف كل الذكريات المحفوظة على هذا الجهاز؟')){localStorage.removeItem(memoriesKey);renderMemories();}
});
renderHistory();
if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
