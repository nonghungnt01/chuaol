import {RealtimeEvents} from './realtime.js';
import {giftIcons,giftIcon,defaultGiftSlots} from './gift-icons.mjs';
import {VoicePlayer} from './voice.js';
import {thanksText,chooseWish} from './thanks.mjs';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const fields=['showTopSupporters','showTitle','showGiftRail','showFooter','peachBlossoms','commentSeconds','crowdSize','title','subtitle','keyword','volume','speech','board','focusSeconds','voice','thanksTemplate','wishes','musicEnabled','musicVolume'];
const visibilityKeys=['showTitle','showGiftRail','showFooter','board','showTopSupporters'];
let current,timer,toastTimer,dirty=false,lastTestWish='';const testVoice=new VoicePlayer();

/* ========================================================
   1. ĐIỀU HƯỚNG CÁC TRANG & VIEW
   ======================================================== */
const pageInfo={
  overview:['Tổng quan & LIVE','Sẵn sàng cho một phiên LIVE.','Kết nối TikFinity, gửi lời cầu an nhanh và theo dõi nhật ký thời gian thực.'],
  ranking:['Bảng vàng & Phật tử','Vinh danh công đức và danh sách người tham gia.','Xem thứ hạng các thí chủ dâng quà nhiều nhất và danh sách Phật tử trong chánh điện.'],
  appearance:['Nội dung màn hình','Không gian mang dấu ấn của bạn.','Đặt tên chùa, lời nhắc và tùy chỉnh ẩn hiện các thành phần chánh điện.'],
  audio:['Âm thanh & Giọng AI','Thanh âm của sự bình an.','Điều chỉnh nhạc thiền, giọng cảm ơn AI và kho lời chúc gửi tới người xem.'],
  gifts:['Quà tặng & Lời cầu','Mỗi món quà, một lời nguyện.','Gắn từng món quà TikTok với lời cầu được hiển thị khi nhân vật dâng hương.'],
  simulator:['Bàn phím & Mô phỏng','Thử nghiệm hiệu ứng và sự kiện trực tiếp.','Mô phỏng quà lớn, sen vàng xoay, hoạt ảnh hành lễ và bình luận mẫu.'],
  guide:['Hướng dẫn sử dụng','Từ thiết lập đến lên sóng.','Những bước cần thiết để phiên LIVE đầu tiên diễn ra thuận lợi, chuyên nghiệp.'],
  support:['Liên hệ hỗ trợ','Luôn có người đồng hành cùng bạn.','Chủ tool: Đức Quân · Lập trình & Mod mọi loại tool theo yêu cầu riêng.']
};

function showView(){
  const hash = location.hash.slice(1);
  const key = hash in pageInfo ? hash : 'overview';
  $$('.view').forEach(p=>p.hidden = p.id !== 'view-' + key);
  $$('[data-view]').forEach(a=>{
    const isActive = a.dataset.view === key;
    a.classList.toggle('active', isActive);
    if(isActive) a.setAttribute('aria-current','page');
    else a.removeAttribute('aria-current');
  });
  const [crumb, title, description] = pageInfo[key];
  $('#breadcrumb').textContent = crumb;
  $('#page-title').textContent = title;
  $('#page-description').textContent = description;
}
addEventListener('hashchange',()=>{showView();scrollTo({top:0,behavior:'smooth'});});
showView();

/* ========================================================
   2. HỆ THỐNG GIAO DIỆN ĐA THEME (THEME SWITCHER MỚI)
   ======================================================== */
const THEMES = ['obsidian', 'emerald', 'lotus', 'imperial'];
function applyTheme(theme) {
  if (!THEMES.includes(theme)) theme = 'obsidian';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('phatmt_theme', theme);
  $$('[data-theme-target]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeTarget === theme);
  });
}
$$('[data-theme-target]').forEach(btn => {
  btn.onclick = () => {
    applyTheme(btn.dataset.themeTarget);
    toast('Đã đổi giao diện sang: ' + btn.title);
  };
});
applyTheme(localStorage.getItem('phatmt_theme') || 'obsidian');

/* ========================================================
   3. GÕ MÕ TÍCH CÔNG ĐỨC TRỰC TUYẾN (WEB AUDIO SYNTH MỚI)
   ======================================================== */
let mokugyoCount = Number(localStorage.getItem('phatmt_mokugyo') || 0);
$('#mokugyo-count').textContent = mokugyoCount.toLocaleString('vi-VN');

let mokugyoCtx = null;
function playMokugyoSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!mokugyoCtx && AudioCtx) mokugyoCtx = new AudioCtx();
    if (mokugyoCtx?.state === 'suspended') mokugyoCtx.resume();
    const t = mokugyoCtx.currentTime;

    const osc = mokugyoCtx.createOscillator();
    const gain = mokugyoCtx.createGain();
    const filter = mokugyoCtx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(880, t);
    filter.Q.setValueAtTime(5, t);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.08);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(mokugyoCtx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  } catch {}
}

function spawnFloatingMerit(btn) {
  const texts = ['+1 Công Đức 🙏', '+1 Bình An 🪷', '+1 May Mắn ✨', '+1 Vạn Sự Như Ý 🌸', '+1 Tâm An 💫', '+1 Phúc Lộc 💰'];
  const text = texts[Math.floor(Math.random() * texts.length)];
  const span = document.createElement('span');
  span.className = 'floating-merit';
  span.textContent = text;
  const rect = btn.getBoundingClientRect();
  span.style.left = (rect.left + rect.width / 2 + (Math.random() * 40 - 20)) + 'px';
  span.style.top = (rect.top - 10) + 'px';
  document.body.append(span);
  setTimeout(() => span.remove(), 1200);
}

$('#btn-mokugyo').onclick = () => {
  playMokugyoSound();
  mokugyoCount++;
  localStorage.setItem('phatmt_mokugyo', mokugyoCount);
  $('#mokugyo-count').textContent = mokugyoCount.toLocaleString('vi-VN');
  spawnFloatingMerit($('#btn-mokugyo'));
};

/* ========================================================
   4. ĐỒNG HỒ THỜI GIAN THỰC (LIVE CLOCK)
   ======================================================== */
function updateLiveClock() {
  const el = $('#live-clock');
  if (el) el.textContent = '⏱ ' + new Date().toLocaleTimeString('vi-VN');
}
setInterval(updateLiveClock, 1000);
updateLiveClock();

/* ========================================================
   5. THÔNG BÁO TOAST & API CALLS
   ======================================================== */
function toast(message){
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(()=>$('#toast').classList.remove('visible'), 4200);
}

async function api(route, data={}){
  const controller = new AbortController(), timeout = setTimeout(()=>controller.abort(), 5000);
  try{
    const r = await fetch('/api/' + route, {
      method: 'POST',
      signal: controller.signal,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    const b = await r.json();
    if(!r.ok) throw Error(b.error || 'Chưa thực hiện được. Vui lòng thử lại.');
    return b;
  }catch(e){
    if(e.name === 'AbortError') throw Error('Máy chủ chưa trả lời sau 5 giây. Vui lòng kiểm tra tool.');
    throw e;
  }finally{
    clearTimeout(timeout);
  }
}

function safeAction(action){
  return async()=>{
    try{ await action(); }catch(e){ toast(e.message); }
  };
}

/* ========================================================
   6. BÀN PHÍM CÂU NIỆM PHẬT & MÔ PHỎNG TẶNG QUÀ (MỚI)
   ======================================================== */
$$('[data-send-prayer]').forEach(btn => {
  btn.onclick = safeAction(async () => {
    const prayer = btn.dataset.sendPrayer;
    await api('demo', { type: 'chat', comment: prayer });
    toast(`Đã gửi lời cầu: "${prayer}"`);
  });
});

$('#btn-fire-custom-gift').onclick = safeAction(async () => {
  const name = $('#sim-sender-name').value.trim() || 'Minh Anh';
  const gift = $('#sim-gift-type').value;
  const count = Math.max(1, Math.min(9999, Number($('#sim-gift-count').value) || 1));
  const isBig = ['Lion', 'Dragon'].includes(gift);
  await api('demo', {
    type: isBig ? 'big' : 'gift',
    name,
    gift,
    count
  });
  toast(`Đã gửi mô phỏng: ${name} dâng ${gift} ×${count}!`);
});

/* ========================================================
   7. BẢNG VÀNG & PHẬT TỬ VIEWER (MỚI)
   ======================================================== */
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

let searchKeyword = '';
$('#search-devotees').oninput = e => {
  searchKeyword = e.target.value.trim().toLowerCase();
  if (current) renderDevoteesTable(current.people || []);
};

function renderDevoteesTable(people) {
  const tbody = $('#devotees-body');
  const activePeople = (people || []).filter(p => p && p.name);
  $('#badge-active-count').textContent = activePeople.length + ' / ' + (current?.capacity || 160) + ' chỗ';

  const filtered = activePeople.filter(p => !searchKeyword || p.name.toLowerCase().includes(searchKeyword));
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="empty-log" style="text-align:center">${searchKeyword ? 'Không tìm thấy người xem phù hợp.' : 'Chưa có người xem ngồi đệm trong phiên.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.slice(0, 60).map((p, idx) => {
    const isDonor = !!current?.scores?.[p.id];
    return `<tr>
      <td><span class="quiet-badge">#${idx + 1}</span></td>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td>${isDonor ? '<span style="color:var(--accent-light);font-weight:600">✦ Đã dâng quà</span>' : '<span style="color:var(--muted)">Đang dự lễ</span>'}</td>
    </tr>`;
  }).join('');
}

function renderRankingView(s) {
  const topDonorsBody = $('#top-donors-body');
  const scores = Object.values(s.scores || {}).sort((a,b) => b.total - a.total);
  if (!scores.length) {
    topDonorsBody.innerHTML = '<tr><td colspan="4" class="empty-log" style="text-align:center">Chưa có ai dâng quà trong phiên này.</td></tr>';
  } else {
    topDonorsBody.innerHTML = scores.slice(0, 15).map((p, i) => {
      const badgeClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-other';
      return `<tr>
        <td><span class="rank-badge ${badgeClass}">${i + 1}</span></td>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td><span class="quiet-badge">${(p.gifts || 0).toLocaleString('vi-VN')} món</span></td>
        <td><b style="color:var(--accent-light)">★ ${p.total.toLocaleString('vi-VN')}</b> <small style="color:var(--muted)">tâm đức</small></td>
      </tr>`;
    }).join('');
  }
  renderDevoteesTable(s.people || []);
}

$('#btn-export-merit').onclick = () => {
  const scores = Object.values(current?.scores || {}).sort((a,b) => b.total - a.total);
  if (!scores.length) {
    toast('Chưa có dữ liệu người dâng quà để sao chép.');
    return;
  }
  let text = `📜 BẢNG VÀNG CÔNG ĐỨC PHẬT TỬ (Phiên LIVE ${new Date().toLocaleDateString('vi-VN')})\n`;
  text += `--------------------------------------------------\n`;
  scores.forEach((p, i) => {
    text += `Top ${i + 1}: ${p.name} — ${p.total.toLocaleString('vi-VN')} tâm đức (${p.gifts || 0} món quà)\n`;
  });
  text += `--------------------------------------------------\n`;
  text += `Đức Quân Studio · Chúc quý Phật tử an khang (Zalo: 0329024876)\n`;
  copy(text, 'Đã sao chép danh sách vinh danh vào clipboard!');
};

/* ========================================================
   8. PRESET CÂU CHÚC TỰ ĐỘNG
   ======================================================== */
const WISH_PRESETS = {
  binh_an: [
    "Chúc bạn và gia đình luôn mạnh khỏe, bình an và hạnh phúc.",
    "Chúc bạn mỗi ngày đều ngập tràn niềm vui và bình an trong tâm hồn.",
    "Cầu mong chư Phật gia hộ cho bạn vạn sự hanh thông, tai qua nạn khỏi.",
    "Chúc bạn thân tâm an lạc, vạn sự cát tường, phúc thọ tăng long.",
    "Chúc gia đạo bạn hòa thuận, trên kính dưới nhường, hạnh phúc đong đầy."
  ],
  tai_loc: [
    "Chúc bạn công việc thuận lợi, buôn may bán đắt, tài lộc dồi dào.",
    "Chúc bạn sự nghiệp thăng tiến, vạn sự như ý, đắc tài đắc lộc.",
    "Chúc bạn kinh doanh hồng phát, tiền vào như nước, đại cát đại lợi.",
    "Chúc bạn gặt hái nhiều thành công rực rỡ, lộc đến đầy nhà.",
    "Chúc bạn khai thông tài vận, quý nhân phù trợ mọi bước đường."
  ],
  thi_cu: [
    "Chúc bạn học tập tiến bộ, thông minh sáng dạ, thi cử đỗ đạt.",
    "Chúc bạn công danh thăng tiến, bảng vàng ghi danh, ước mơ thành hiện thực.",
    "Chúc bạn thi đâu đỗ đó, trí tuệ hanh thông, sáng suốt trong mọi quyết định.",
    "Chúc bạn tự tin vượt vũ môn, đỗ đạt thủ khoa, tương lai rạng ngời."
  ],
  tong_hop: [
    "Chúc bạn và gia đình luôn mạnh khỏe, bình an và hạnh phúc.",
    "Chúc bạn mỗi ngày đều gặp nhiều may mắn và điều tốt đẹp.",
    "Chúc bạn tâm luôn sáng, lòng luôn thanh thản và nhẹ nhàng.",
    "Chúc bạn công việc thuận lợi, sự nghiệp ngày càng thăng tiến.",
    "Chúc bạn luôn đủ nghị lực vượt qua mọi khó khăn thử thách.",
    "Chúc bạn gia đình hòa thuận, yêu thương và luôn sum vầy.",
    "Chúc bạn gặp được nhiều người tốt, chân thành và tử tế.",
    "Chúc bạn học tập tiến bộ, sớm đạt được những ước mơ.",
    "Chúc bạn mỗi chuyến đi đều bình an, mọi hành trình thuận lợi.",
    "Chúc bạn luôn giữ lòng thiện lương, gieo duyên lành đón phước lành."
  ]
};

$$('[data-preset]').forEach(btn => {
  btn.onclick = () => {
    const list = WISH_PRESETS[btn.dataset.preset];
    if (list) {
      $('#wishes').value = list.join('\n');
      scheduleSave();
      toast('Đã nạp mẫu: ' + btn.textContent);
    }
  };
});

/* ========================================================
   9. QUẢN LÝ TRẠNG THÁI & LƯU CẤU HÌNH
   ======================================================== */
function status(s){
  const names = {
    offline: 'Chưa kết nối',
    connecting: 'Đang kết nối…',
    connected: 'Đã kết nối thành công',
    retry: 'Đang thử lại…',
    waiting: 'Chờ dữ liệu LIVE',
    error: 'Cần kiểm tra',
    needs_action: 'Cần thao tác'
  };
  for(const id of ['#status','#global-status']){
    $(id).textContent = names[s.state] || 'Chờ kết nối';
    $(id).className = 'status-pill ' + s.state;
  }
  $('#connection-message').textContent = s.message || 'Hãy mở TikFinity Desktop và kết nối phòng LIVE trước.';
  $('#connect').disabled = ['connecting','connected','retry','waiting'].includes(s.state);
  $('#disconnect').disabled = s.state === 'offline';
}

function ruleRow(rule){
  const row = document.createElement('div');
  row.className = 'rule';
  const match = document.createElement('input');
  match.placeholder = 'Ví dụ: Rose';
  match.setAttribute('aria-label','Tên quà');
  match.value = rule.match;
  const prayer = document.createElement('input');
  prayer.placeholder = 'Ví dụ: Cầu Bình An';
  prayer.setAttribute('aria-label','Lời cầu');
  prayer.value = rule.prayer;
  const remove = document.createElement('button');
  remove.textContent = '×';
  remove.title = 'Xóa quy tắc';
  remove.setAttribute('aria-label','Xóa quy tắc quà');
  remove.onclick = () => { row.remove(); scheduleSave(); };
  row.append(match, prayer, remove);
  row.addEventListener('input', scheduleSave);
  $('#rules').append(row);
}

function labels(){
  for(const id of ['musicVolume','volume']) {
    $('#' + id + '-output').textContent = Math.round(Number($('#' + id).value) * 100) + '%';
  }
  $('#wish-count').textContent = $('#wishes').value.split('\n').filter(x => x.trim()).length + ' câu';
}

function saveStatus(message){
  $('#saved').textContent = message;
  $$('.save-state').forEach(el => el.textContent = message);
}

function scheduleSave(){
  dirty = true;
  clearTimeout(timer);
  labels();
  saveStatus('Đang lưu…');
  timer = setTimeout(save, 500);
}

async function save(){
  clearTimeout(timer);
  const body = {speechMode: 'online'};
  for(const key of fields){
    const el = $('#' + key);
    if(['crowdSize','commentSeconds'].includes(key) && (!el.value || !el.validity.valid)) continue;
    body[key] = el.type === 'checkbox' ? el.checked : el.type === 'range' || el.type === 'number' ? Number(el.value) : key === 'wishes' ? el.value.split('\n').filter(x => x.trim()) : el.value;
  }
  body.giftSlots = $$('[data-gift-slot]').map(row => ({
    icon: row.querySelector('select').value,
    prayer: row.querySelector('input').value
  }));
  body.rules = $$('.rule').map(row => ({
    match: row.children[0].value,
    prayer: row.children[1].value
  })).filter(r => r.match.trim());

  try {
    await api('config', body);
    dirty = false;
    saveStatus('Đã lưu ✓');
  } catch(e) {
    saveStatus('Chưa lưu được');
    toast(e.message);
  }
}

function drawState(s){
  current = s;
  for(const kind of ['background','gift']){
    $('#audio-' + kind + '-name').textContent = 'Đang dùng: ' + (s.config[kind + 'Audio']?.name || (kind === 'background' ? 'Nhạc Thiền · Phật giáo không lời' : 'Chuông chùa mặc định'));
  }
  const crowdInput = $('#crowdSize');
  if(!dirty && document.activeElement !== crowdInput) {
    crowdInput.value = s.config.crowdSize ?? s.capacity ?? 160;
  }
  status(s.status);
  $('#stat-people').replaceChildren(document.createTextNode(String(s.people.filter(p => p.name).length) + ' '));
  const capacity = document.createElement('small');
  capacity.textContent = '/ ' + (s.capacity || 160);
  $('#stat-people').append(capacity);

  const scores = Object.values(s.scores || {});
  $('#stat-givers').textContent = scores.length.toLocaleString('vi-VN');
  $('#stat-diamonds').textContent = scores.reduce((sum, p) => sum + p.total, 0).toLocaleString('vi-VN');

  $('#seen-gifts').replaceChildren();
  if(!s.seenGifts.length){
    const p = document.createElement('p');
    p.className = 'field-hint';
    p.textContent = 'Chưa có quà trong phiên này.';
    $('#seen-gifts').append(p);
  }
  for(const gift of s.seenGifts){
    const b = document.createElement('button');
    b.textContent = gift.gift;
    b.onclick = () => {
      if($$('.rule').some(row => row.children[0].value === gift.gift)){
        toast('Món quà này đã có trong danh sách.');
        return;
      }
      ruleRow({match: gift.gift, prayer: 'Cầu Bình An'});
      scheduleSave();
    };
    $('#seen-gifts').append(b);
  }

  renderRankingView(s);
}

let initialized = false;
const es = new RealtimeEvents();
const parse = e => JSON.parse(e.data, (_, v) => typeof v === 'string' ? v.normalize('NFC') : v);

es.addEventListener('state', e => {
  const s = parse(e);
  if(!initialized){
    for(const key of fields){
      const el = $('#' + key);
      if(el.type === 'checkbox') el.checked = !!s.config[key];
      else el.value = key === 'wishes' ? (s.config[key] || []).join('\n') : key === 'commentSeconds' ? (s.config.commentSeconds ?? 8) : key === 'crowdSize' ? (s.config.crowdSize ?? s.capacity ?? 160) : key === 'focusSeconds' ? Math.max(5, Number(s.config[key]) || 5) : s.config[key] ?? '';
    }
    s.config.rules.forEach(ruleRow);
    renderGiftPicker(s.config.giftSlots || defaultGiftSlots);
    initialized = true;
    labels();
  }
  drawState(s);
});

es.addEventListener('status', e => status(parse(e)));
es.onerror = () => {
  status({state: 'error', message: 'Mất kết nối máy chủ. Vui lòng kiểm tra cửa sổ BAT_DAU.bat.'});
};

es.addEventListener('activity', e => {
  const d = parse(e);
  $('#log .empty-log')?.remove();
  const row = document.createElement('div');
  row.className = 'log-row';
  const time = document.createElement('time');
  time.textContent = new Date().toLocaleTimeString('vi-VN');
  const badge = document.createElement('span');
  badge.className = 'event-tag ' + d.type;
  badge.textContent = d.type === 'gift' ? 'QUÀ' : d.type === 'error' ? 'THÔNG BÁO' : 'BÌNH LUẬN';
  const text = document.createElement('span');
  text.textContent = d.type === 'error' ? d.message : d.type === 'gift' ? `${d.name} dâng ${d.gift} ×${d.count}` : `${d.name}: ${d.comment}`;
  row.append(time, badge, text);
  $('#log').prepend(row);
  while($('#log').children.length > 50) $('#log').lastChild.remove();
});

$('#connect').onclick = safeAction(async () => { await api('connect', {mode: 'tikfinity'}); });
$('#disconnect').onclick = safeAction(() => api('disconnect'));
$('#add-rule').onclick = () => ruleRow({match: '', prayer: ''});

for(const key of fields) if(!visibilityKeys.includes(key)) $('#' + key).addEventListener('input', scheduleSave);

function runtimeWarning(message){
  const banner = $('#runtime-warning');
  banner.textContent = message;
  banner.hidden = false;
}

const restartHint = 'Đóng tất cả cửa sổ BAT_DAU cũ, mở lại BAT_DAU.bat rồi nhấn Ctrl + F5.';
const visibilityJobs = new Map(), visibilityRevisions = new Map();
for(const key of visibilityKeys){
  const control = $('#' + key);
  control.disabled = false;
  control.addEventListener('change', () => {
    const value = control.checked, revision = (visibilityRevisions.get(key) || 0) + 1;
    visibilityRevisions.set(key, revision);
    saveStatus('Đang lưu…');
    const previous = visibilityJobs.get(key) || Promise.resolve();
    const job = previous.catch(()=>{}).then(async () => {
      if(visibilityRevisions.get(key) !== revision) return;
      try {
        const result = await api('config', {[key]: value});
        if(result.config?.[key] !== value) throw Error('Máy chủ chưa nhận cài đặt này. ' + restartHint);
        if(current) current.config[key] = value;
        if(visibilityRevisions.get(key) === revision) saveStatus('Đã lưu ✓');
      } catch(e) {
        if(visibilityRevisions.get(key) !== revision) return;
        control.checked = Boolean(current?.config?.[key]);
        saveStatus('Chưa lưu được');
        runtimeWarning(e.message);
        toast(e.message);
      }
    });
    visibilityJobs.set(key, job);
  });
}

(async()=>{
  try{
    const response = await fetch('/api/runtime', {cache: 'no-store', signal: AbortSignal.timeout(5000)});
    if(!response.ok) throw Error();
    const info = await response.json(), expected = document.documentElement.dataset.buildId;
    if(visibilityKeys.some(key => !info.visibilityFlags?.includes(key)) || (expected && info.buildId !== expected)) throw Error();
  }catch{
    runtimeWarning('Trang đang kết nối máy chủ cũ hoặc khác phiên bản. ' + restartHint);
  }
})();

$('#crowdSize').addEventListener('blur', () => {
  const el = $('#crowdSize'), n = Number(el.value), value = Math.max(1, Math.min(200, Math.round(Number.isFinite(n) && el.value ? n : current?.config.crowdSize || 160)));
  if(el.value !== String(value)) {
    el.value = value;
    scheduleSave();
  }
});

$$('[data-demo]').forEach(button => button.onclick = safeAction(async () => {
  if(current?.status?.state === 'connected' && !confirm('Phiên đang nhận dữ liệu LIVE. Sự kiện thử sẽ xuất hiện cùng người xem thật. Vẫn thử?')) return;
  await api('demo', {type: button.dataset.demo});
  toast('Đã gửi sự kiện mô phỏng.');
}));

$('#reset').onclick = safeAction(async () => {
  if(!confirm('Bắt đầu lại phiên? Tên Phật tử, điểm công đức và chỗ ngồi đệm sẽ được xóa. Cài đặt vẫn giữ nguyên.')) return;
  await api('reset');
  toast('Đã xóa dữ liệu phiên.');
});

async function copy(text, done){
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
  } catch {
    toast('Không sao chép tự động được. Liên kết: ' + text);
  }
}

const liveUrl = new URL('/overlay.html', location.href).href;
$('#guide-url').textContent = liveUrl;
$('#copy-link').onclick = () => copy(liveUrl, 'Đã sao chép liên kết màn hình LIVE.');
$$('[data-copy-live]').forEach(b => b.onclick = () => copy(liveUrl, 'Đã sao chép liên kết màn hình LIVE.'));
$('#copy-phone').onclick = () => copy('0329024876', 'Đã sao chép số Zalo Đức Quân (0329024876).');

$('#test-voice').onclick = async () => {
  const b = $('#test-voice');
  b.disabled = true;
  b.textContent = 'Đang tạo giọng…';
  try {
    if(dirty) await save();
    await api('config', {voice: $('#voice').value});
    const config = {speechMode: 'online', volume: Number($('#volume').value)}, wish = chooseWish($('#wishes').value.split('\n'), lastTestWish);
    lastTestWish = wish;
    const text = thanksText({name: 'Minh Anh', gift: 'Rose', count: 1, wish}, $('#thanksTemplate').value);
    await testVoice.play(text, config, testVoice.prepare(text));
    toast('Đã phát lời cảm ơn mẫu cho Minh Anh.');
  } catch(e) {
    toast(e.message);
  } finally {
    b.disabled = false;
    b.textContent = '♫ Nghe thử giọng đọc';
  }
};

addEventListener('pagehide', () => { es.close(); testVoice.stop(); });

/* ========================================================
   10. QUẢN LÝ TẢI FILE ÂM THANH
   ======================================================== */
let audioPreview;
for(const kind of ['background','gift']){
  const input = $('#audio-' + kind), message = $('#audio-' + kind + '-status'), saveButton = $('#audio-' + kind + '-save'), resetButton = $('#audio-' + kind + '-reset');
  let selectedFile = null;

  input.onchange = () => {
    const file = input.files[0];
    if(!file) return;
    const limit = kind === 'background' ? 100 : 15;
    if(file.size > limit * 1024 * 1024){
      message.textContent = 'File vượt quá ' + limit + ' MB.';
      selectedFile = null;
      saveButton.disabled = true;
      input.value = '';
      return;
    }
    selectedFile = file;
    saveButton.disabled = false;
    message.textContent = 'Đã chọn: ' + file.name + ' · ' + (file.size / 1024 / 1024).toFixed(1) + ' MB. Chưa lưu — bấm nút Lưu để tải lên.';
  };

  saveButton.onclick = async () => {
    if(!selectedFile) return;
    const file = selectedFile, controller = new AbortController(), timeout = setTimeout(()=>controller.abort(), 120000);
    input.disabled = saveButton.disabled = resetButton.disabled = true;
    saveButton.textContent = 'Đang lưu…';
    message.textContent = 'Đang tải và lưu: ' + file.name + '…';
    try {
      const res = await fetch('/api/audio/' + kind, {
        method: 'POST',
        signal: controller.signal,
        headers: {'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent(file.name)},
        body: file
      });
      let data;
      try { data = await res.json(); } catch { throw Error('Máy chủ không trả về kết quả.'); }
      if(!res.ok) throw Error(data.error || 'Không lưu được âm thanh.');
      if(current) current.config[kind + 'Audio'] = data.audio;
      $('#audio-' + kind + '-name').textContent = 'Đang dùng: ' + data.audio.name;
      message.textContent = 'Đã lưu thành công: ' + data.audio.name + '. Màn hình LIVE tự cập nhật.';
      selectedFile = null;
      input.value = '';
    } catch(e) {
      message.textContent = e.name === 'AbortError' ? 'Lưu quá lâu.' : e.message;
    } finally {
      clearTimeout(timeout);
      input.disabled = resetButton.disabled = false;
      saveButton.disabled = !selectedFile;
      saveButton.textContent = kind === 'background' ? 'Lưu nhạc nền' : 'Lưu âm thanh quà';
    }
  };

  resetButton.onclick = async () => {
    try {
      audioPreview?.pause();
      await api('audio/' + kind + '/reset', {});
      selectedFile = null;
      input.value = '';
      saveButton.disabled = true;
      message.textContent = 'Đã trở về âm thanh mặc định.';
    } catch(e) {
      message.textContent = e.message;
    }
  };

  $('#audio-' + kind + '-test').onclick = async () => {
    audioPreview?.pause();
    const url = current?.config[kind + 'Audio']?.url || (kind === 'background' ? '/audio/meditation-user.mp3' : null);
    if(!url){
      const context = new AudioContext();
      [220,441,653,891,1233].forEach((hz, i) => {
        const oscillator = context.createOscillator(), gain = context.createGain();
        oscillator.frequency.value = hz;
        gain.gain.setValueAtTime(Number(document.querySelector('#volume').value) * .15 / (i + 1), context.currentTime);
        gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + 3.8);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 4);
      });
      setTimeout(()=>context.close(), 4200);
      message.textContent = 'Đang nghe chuông chùa mặc định.';
      return;
    }
    audioPreview = new Audio(url);
    audioPreview.volume = Number($('#' + (kind === 'background' ? 'musicVolume' : 'volume')).value);
    try {
      await audioPreview.play();
      message.textContent = 'Đang nghe thử (tối đa 12 giây).';
      const sample = audioPreview;
      setTimeout(()=>sample.pause(), 12000);
    } catch {
      message.textContent = 'Không phát được file này. Hãy chọn file âm thanh khác.';
    }
  };
}

addEventListener('pagehide', () => audioPreview?.pause());

/* ========================================================
   11. BỘ CHỈNH VỊ TRÍ & KÍCH THƯỚC PREVIEW
   ======================================================== */
let layoutEditing = false;
const layoutFrame = document.querySelector('.preview iframe');

function sendLayoutEdit(){
  layoutFrame.contentWindow.postMessage({type: 'phatmt-layout-edit', enabled: layoutEditing}, location.origin);
}

document.querySelector('#layout-edit').onclick = () => {
  layoutEditing = !layoutEditing;
  const b = document.querySelector('#layout-edit');
  b.setAttribute('aria-pressed', String(layoutEditing));
  b.textContent = layoutEditing ? '✓ Xong chỉnh sửa' : '✥ Chỉnh vị trí & kích thước';
  document.querySelector('#layout-message').textContent = layoutEditing ? 'Kéo bảng để di chuyển; kéo góc ↘ để phóng to/thu nhỏ. Tự lưu khi thả chuột.' : 'Đã thoát chỉnh sửa.';
  sendLayoutEdit();
};

layoutFrame.addEventListener('load', sendLayoutEdit);

document.querySelector('#layout-reset').onclick = async () => {
  if(!confirm('Đưa vị trí và kích thước các bảng về mặc định?')) return;
  try {
    await api('config', {overlayLayout: {}});
    document.querySelector('#layout-message').textContent = 'Đã khôi phục bố cục mặc định.';
  } catch(e) {
    toast(e.message);
  }
};

addEventListener('message', e => {
  if(e.origin === location.origin && e.source === layoutFrame.contentWindow && e.data?.type === 'phatmt-layout-status') {
    document.querySelector('#layout-message').textContent = e.data.message;
  }
});

/* ========================================================
   12. BỘ CHỌN ICON QUÀ TẶNG & LỜI CẦU
   ======================================================== */
function renderGiftPicker(slots){
  const container = document.querySelector('#gift-slot-picker');
  container.replaceChildren();
  for(let i = 0; i < 4; i++){
    const slot = slots[i] || defaultGiftSlots[i], row = document.createElement('div');
    row.className = 'gift-slot-row';
    row.dataset.giftSlot = String(i);
    const badge = document.createElement('b');
    badge.textContent = String(i + 1);
    const preview = giftIcon(slot.icon), select = document.createElement('select'), input = document.createElement('input');
    select.id = 'gift-slot-icon-' + i;
    select.setAttribute('aria-label', 'Icon quà ô ' + (i + 1));
    for(const icon of giftIcons){
      const option = document.createElement('option');
      option.value = icon.id;
      option.textContent = icon.name;
      select.append(option);
    }
    select.value = slot.icon;
    input.value = slot.prayer;
    input.maxLength = 120;
    input.setAttribute('aria-label', 'Lời cầu ô ' + (i + 1));
    input.placeholder = 'Lời cầu hiển thị';
    select.onchange = () => {
      const next = giftIcon(select.value);
      row.replaceChild(next, row.querySelector('.tiktok-gift-icon'));
      scheduleSave();
    };
    input.oninput = scheduleSave;
    row.append(badge, preview, select, input);
    container.append(row);
  }
}
