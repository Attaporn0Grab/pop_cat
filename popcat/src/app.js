// ------- simple state & storage -------
const STORAGE_KEY = 'popcat_country_counts_v1';
const state = { counts: loadCounts(), total: 0 };

function loadCounts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveCounts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.counts));
}

// ------- elements -------
const stage = document.getElementById('stage');
const catClosed = document.getElementById('catClosed');
const catOpen = document.getElementById('catOpen');
const countrySel = document.getElementById('country');
const leaderboardBody = document.getElementById('leaderboard');
const totalEl = document.getElementById('totalClicks');
const resetBtn = document.getElementById('resetBtn');
const bottomSheet = document.getElementById('bottomSheet');
const toggleSheet = document.getElementById('toggleSheet');
const toggleIcon = document.getElementById('toggleIcon');

// ------- bottom sheet toggle -------
let sheetOpen = false;
function setSheet(open) {
  sheetOpen = open;
  bottomSheet.style.transform = open ? 'translate(-50%, 0)' : 'translate(-50%, 100%)';
  toggleIcon.textContent = open ? '▼' : '▲';
}
toggleSheet.addEventListener('click', (e) => { e.stopPropagation(); setSheet(!sheetOpen); });

// ------- leaderboard helpers -------
function renderLeaderboard() {
  const entries = Object.entries(state.counts);
  entries.sort((a, b) => (b[1].count || 0) - (a[1].count || 0));
  leaderboardBody.innerHTML = '';
  entries.forEach(([code, info], idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="py-1 pr-3">${idx + 1}</td>
      <td class="py-1 pr-3 whitespace-nowrap">${info.flag || ''} ${info.name || code} <span class="opacity-50">(${code})</span></td>
      <td class="py-1 pr-3 font-semibold">${info.count}</td>`;
    leaderboardBody.appendChild(tr);
  });
}

function ensureCountryInState(code, name, flag) {
  if (!state.counts[code]) {
    state.counts[code] = { name: name || code, flag: flag || '', count: 0 };
  }
}

function getSelectedInfo() {
  const opt = countrySel.options[countrySel.selectedIndex];
  const code = opt.value;
  const label = opt.textContent;
  const maybeFlag = label.split(' ')[0];
  const hasEmoji = /\p{Emoji}/u.test(maybeFlag);
  const flag = hasEmoji ? maybeFlag : '';
  const name = hasEmoji ? label.replace(flag + ' ', '') : label;
  return { code, name, flag };
}

function updateTotal() {
  state.total = Object.values(state.counts)
    .reduce((s, v) => s + (v.count || 0), 0);
  totalEl.textContent = state.total.toLocaleString();
}

// ------- mouth helpers -------
function openMouth() {
  catClosed.classList.add('opacity-0', 'pop');
  catOpen.classList.remove('opacity-0');
}
function closeMouth() {
  catClosed.classList.remove('opacity-0', 'pop');
  catOpen.classList.add('opacity-0');
}

// ------- Web Audio (low-latency) -------
const POP_URL = "https://cdn.jsdelivr.net/gh/Attaporn0Grab/pop_cat@main/soud/poppop.ai%20-%20quick%20pop%20sound%20effect.mp3";
let audioCtx, popBuffer = null, waInit = false;

async function initWebAudio() {
  if (waInit) return;
  waInit = true;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const res = await fetch(POP_URL, { mode: "cors" });
  const arr = await res.arrayBuffer();
  popBuffer = await audioCtx.decodeAudioData(arr);
}

function playPopWA() {
  if (!audioCtx || !popBuffer) return;
  const src = audioCtx.createBufferSource();
  src.buffer = popBuffer;
  // random pitch เล็กน้อย ให้ไม่จำเจ
  src.playbackRate.value = 1 + (Math.random() * 0.08 - 0.04);
  const gain = audioCtx.createGain();
  gain.gain.value = 0.9;
  src.connect(gain).connect(audioCtx.destination);
  src.start();
}

// ปลดล็อคเสียงบนมือถือ/บราวเซอร์: เริ่มโหลด+resume เมื่อมี gesture ครั้งแรก
let audioUnlocked = false;
stage.addEventListener('pointerdown', async () => {
  if (!audioUnlocked) {
    try {
      await initWebAudio();
      if (audioCtx.state !== 'running') await audioCtx.resume();
    } catch {}
    audioUnlocked = true;
  }
}, { once: true });

// ------- click logic (hold to keep mouth open) -------
function clickOnce() {
  const { code, name, flag } = getSelectedInfo();
  ensureCountryInState(code, name, flag);
  state.counts[code].count += 1;
  saveCounts(); updateTotal(); renderLeaderboard();

  openMouth();
  playPopWA(); // เสียงแบบหน่วงต่ำ
}

// click/hold anywhere on stage to pop
stage.addEventListener('pointerdown', clickOnce);
stage.addEventListener('pointerup', closeMouth);
stage.addEventListener('pointerleave', closeMouth);

// reset
resetBtn.addEventListener('click', () => {
  if (!confirm('ลบคะแนนทั้งหมด?')) return;
  state.counts = {};
  saveCounts(); updateTotal(); renderLeaderboard();
});

// initial render
Array.from(countrySel.options).forEach(opt => {
  const label = opt.textContent;
  const maybeFlag = label.split(' ')[0];
  const hasEmoji = /\p{Emoji}/u.test(maybeFlag);
  const flag = hasEmoji ? maybeFlag : '';
  const name = hasEmoji ? label.replace(flag + ' ', '') : label;
  ensureCountryInState(opt.value, name, flag);
});
updateTotal();
renderLeaderboard();

// Start hidden (sheet down)
setSheet(false);
