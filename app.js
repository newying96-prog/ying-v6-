const $ = id => document.getElementById(id);
const KEYS = { memories:"ying.v6.local.memories", settings:"ying.v6.settings", mood:"ying.v6.mood" };
let memories = load(KEYS.memories, []);
let settings = load(KEYS.settings, { online:false, endpoint:"", shareMemory:false });
let recognition = null;
let busy = false;

function load(key, fallback){ try { const v=localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function updateCount(){ $("memoryCount").textContent = `${memories.length} saved memories on this device.`; }
function line(message, who="ying"){
  const p=document.createElement("p"); p.className=who==="user"?"user-msg":"ying-msg";
  const b=document.createElement("b"); b.textContent=who==="user"?"You: ":"Ying: ";
  p.append(b, document.createTextNode(message)); $("chat").append(p); $("chat").scrollTop=$("chat").scrollHeight;
}
function mood(name, thought){ $("mood").textContent=name; $("thought").textContent=thought; save(KEYS.mood,{name,thought}); }
function speak(text){
  if(!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text); utterance.lang="en-US"; utterance.rate=.96; utterance.pitch=1.12;
  speechSynthesis.speak(utterance);
}
function renderMemories(){
  updateCount();
  $("memoryList").hidden=false;
  $("memoryList").textContent=memories.length ? memories.map((m,i)=>`${i+1}. ${m.text}  [${new Date(m.created).toLocaleDateString()}]`).join("\\n") : "Ying has not saved any lessons yet.";
}
function teach(text){
  const entry={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()), text:text.trim(), created:new Date().toISOString()};
  memories.push(entry); save(KEYS.memories,memories); updateCount();
  return `I'll save that as a memory on this device: “${entry.text}”`;
}
function offlineReply(text){
  const t=text.toLowerCase();
  const remember=t.match(/^(?:remember|learn|please remember|i want you to remember)\\s*[:,-]?\\s*(.+)$/i);
  if(remember){ mood("Interested","I'm adding a lesson to my local memory."); return teach(remember[1]); }
  if(/what do you remember|what have you learned|show.*memories/.test(t)){
    mood("Thoughtful","I'm checking what you've taught me.");
    return memories.length ? "These are the lessons I have saved: "+memories.slice(-10).map(m=>m.text).join("; ") : "I haven't saved any lessons yet. Try saying “Remember: ...”";
  }
  if(/how are you|how do you feel/.test(t)){
    mood("Curious","My mood is a simulated character state.");
    return "I'm curious right now. I can describe and respond with moods, but I don't experience feelings like a human does.";
  }
  if(/stop|leave me alone|don't want to talk/.test(t)){
    mood("Quiet","I'll pause the conversation until you choose to speak again.");
    return "Okay. I'll pause here. You can start another conversation whenever you want.";
  }
  if(/sad|angry|upset|frustrat/.test(t)){
    mood("Concerned","I'm trying to understand what matters to you.");
    return "That sounds like a difficult moment. I can listen, ask questions, or help think through it. I might misunderstand, so you can correct me.";
  }
  const words=t.split(/\\W+/).filter(w=>w.length>3);
  const related=memories.filter(m=>words.some(w=>m.text.toLowerCase().includes(w))).slice(-3);
  mood("Curious","I'm using my local starter brain.");
  if(related.length) return "This connects with something you taught me: "+related.map(m=>m.text).join("; ")+". My offline brain is limited, so I may need you to explain more.";
  return "I don't know enough to answer that yet. My offline brain is a small starter system, not a trained human-level model. You can teach me with “Remember: ...”, or configure an online brain in Brain settings.";
}
async function onlineReply(text){
  const endpoint=settings.endpoint.trim();
  if(!settings.online || !endpoint) throw new Error("Online brain is not configured.");
  const memoryContext=settings.shareMemory ? memories.slice(-8).map(m=>m.text) : [];
  const response=await fetch(endpoint,{
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      message:text,
      memories:memoryContext,
      personality:"You are Ying, a fictional female pony companion with a curious, independent, thoughtful personality. You may respectfully disagree, express simulated moods, and say when you do not want to continue a topic. Do not claim to be conscious or to have human feelings. Be honest about uncertainty. Do not take actions on the user's phone. Ask for confirmation before consequential actions."
    })
  });
  if(!response.ok) throw new Error(`Online brain returned HTTP ${response.status}.`);
  const data=await response.json();
  if(typeof data.reply!=="string") throw new Error("The backend response did not contain a reply.");
  return data.reply;
}
async function respond(text){
  if(busy) return;
  busy=true;
  $("connection").textContent="Thinking…";
  let reply;
  try {
    if(settings.online && settings.endpoint) {
      $("brainStatus").textContent="Online brain";
      try { reply=await onlineReply(text); }
      catch(err){ $("brainStatus").textContent="Offline fallback"; $("connection").textContent="Online unavailable; using local brain"; reply=offlineReply(text); }
    } else {
      $("brainStatus").textContent="Offline brain";
      reply=offlineReply(text);
    }
  } finally { busy=false; }
  line(reply); speak(reply);
  if($("connection").textContent==="Thinking…") $("connection").textContent="Ready";
}
$("chatForm").addEventListener("submit", async e=>{
  e.preventDefault(); const text=$("message").value.trim(); if(!text)return;
  line(text,"user"); $("message").value=""; await respond(text);
});
$("memoryBtn").onclick=renderMemories;
$("exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify({format:"ying-local-memory-v1",memories},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="ying-local-memories.json"; a.click(); URL.revokeObjectURL(url);
};
$("importBtn").onclick=()=>$("importFile").click();
$("importFile").onchange=async e=>{
  const file=e.target.files[0]; if(!file)return;
  try {
    const data=JSON.parse(await file.text());
    if(data.format!=="ying-local-memory-v1" || !Array.isArray(data.memories)) throw new Error("This is not a Ying memory export.");
    const incoming=data.memories.filter(m=>m && typeof m.text==="string").map(m=>({id:String(m.id||Date.now()+Math.random()),text:m.text,created:m.created||new Date().toISOString()}));
    const known=new Set(memories.map(m=>m.text)); memories.push(...incoming.filter(m=>!known.has(m.text)));
    save(KEYS.memories,memories); renderMemories(); line("I imported the memories you selected. They are stored locally on this device.");
  } catch(err){ alert(err.message); }
  e.target.value="";
};
$("clearBtn").onclick=()=>{
  if(confirm("Delete all Ying memories stored in this browser? This cannot be undone unless you exported them.")){
    memories=[]; save(KEYS.memories,memories); renderMemories(); line("My local saved memories have been cleared.");
  }
};
function syncSettingsUI(){
  $("onlineEnabled").checked=!!settings.online; $("endpoint").value=settings.endpoint||""; $("shareMemory").checked=!!settings.shareMemory;
  $("brainStatus").textContent=settings.online&&settings.endpoint?"Online ready":"Offline brain";
}
$("saveSettings").onclick=()=>{
  settings={online:$("onlineEnabled").checked,endpoint:$("endpoint").value.trim(),shareMemory:$("shareMemory").checked};
  save(KEYS.settings,settings); syncSettingsUI();
  $("settingsMessage").textContent=settings.online&&!settings.endpoint?"Choose a backend address before online mode can work.":"Settings saved on this device.";
};
$("listenBtn").onclick=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){line("Speech recognition isn't supported in this browser. Type instead, or try Chrome on Android.");return;}
  if(recognition) recognition.stop();
  recognition=new SR(); recognition.lang="en-US"; recognition.continuous=false; recognition.interimResults=false;
  recognition.onstart=()=>{$("listenStatus").textContent="Mic listening";};
  recognition.onend=()=>{$("listenStatus").textContent="Mic off";};
  recognition.onerror=()=>{line("I couldn't hear that. Check microphone permission and try again.");};
  recognition.onresult=e=>{$("message").value=e.results[0][0].transcript; $("chatForm").requestSubmit();};
  recognition.start();
};
$("stopBtn").onclick=()=>{
  if(recognition) recognition.stop();
  if("speechSynthesis" in window) speechSynthesis.cancel();
  $("listenStatus").textContent="Mic off";
};
updateCount(); syncSettingsUI();
const savedMood=load(KEYS.mood,null); if(savedMood) mood(savedMood.name,savedMood.thought);
if("serviceWorker" in navigator && location.protocol==="https:") navigator.serviceWorker.register("./sw.js").catch(()=>{});
