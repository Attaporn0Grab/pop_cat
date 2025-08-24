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
const popSound = document.getElementById('popSound');
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

function clickOnce() {
  const { code, name, flag } = getSelectedInfo();
  ensureCountryInState(code, name, flag);
  state.counts[code].count += 1;
  saveCounts(); updateTotal(); renderLeaderboard();

  // visual toggle + sound
  catClosed.classList.add('opacity-0', 'pop');
  catOpen.classList.remove('opacity-0');
  popSound.currentTime = 0;
  popSound.play().catch(()=>{});
  setTimeout(() => {
    catClosed.classList.remove('opacity-0', 'pop');
    catOpen.classList.add('opacity-0');
  }, 90);
}

// click anywhere on stage to pop
stage.addEventListener('pointerdown', clickOnce);

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
