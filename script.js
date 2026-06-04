/* =========================================================
   喵记 - 治愈系动画日记 · 主脚本
   ========================================================= */

/* =========================================================
   1. LOCAL STORAGE UTILITY — 完整的数据持久化管理
   ========================================================= */
const Storage = {
  /**
   * 保存数据到 localStorage
   * @param {string} key - 存储键
   * @param {*} data - 要保存的数据
   * @returns {boolean} 是否保存成功
   */
  saveData(key, data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(key, json);
      return true;
    } catch (e) {
      console.error(`[Storage.saveData] 保存失败，键: ${key}`, e);
      return false;
    }
  },

  /**
   * 从 localStorage 读取数据
   * @param {string} key - 存储键
   * @param {*} defaultValue - 默认值（读取失败时返回）
   * @returns {*} 读取到的数据，或默认值
   */
  loadData(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return defaultValue;
      const parsed = JSON.parse(raw);
      return parsed;
    } catch (e) {
      console.error(`[Storage.loadData] 读取失败，键: ${key}`, e);
      return defaultValue;
    }
  },

  /**
   * 删除指定键的数据
   * @param {string} key - 存储键
   * @returns {boolean} 是否删除成功
   */
  removeData(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`[Storage.removeData] 删除失败，键: ${key}`, e);
      return false;
    }
  },
};

/* =========================================================
   2. CONSTANTS & STATE
   ========================================================= */
const DIARY_STORAGE_KEY = 'diaryList';

const CAT_MESSAGES = {
  idle: [
    '喵～今天记录了什么呢？',
    '主人，今天过得怎么样？',
    '写日记的你最可爱了！',
    '喵喵喵～',
    '记录生活的每一个瞬间吧～',
    '今天也要加油哦！',
  ],
  save: [
    '写得真好！每一篇都很珍贵～',
    '太棒了！你真的很厉害喵！',
    '又记录了美好的一天！',
    '这篇日记一定会成为美好的回忆！',
    '喵！你真的很努力呢！',
  ],
  delete: [
    '没关系～删掉的故事还在心里呢！',
    '好吧，帮你好好收藏到另一个世界了喵...',
    '放下也是一种勇气喵～',
    '喵，要保重哦～',
  ],
  listening: [
    '继续加油！喵在认真听呢～',
    '写得越来越好了！',
    '喵在认真看你写哦～',
    '今天发生了什么有趣的事吗？',
    '慢慢写，不着急～',
  ],
  interact: [
    '喵！你摸了我！',
    '呜呜～好舒服！',
    '再来一下！',
    '喵喵喵喵喵！',
    '你是最好的主人！',
  ],
};

let state = {
  diaries: [],
  bubbleTimer: null,
  // Debounce timer for listening animation (avoid triggering on every keystroke)
  listenDebounce: null,
};

/* =========================================================
   3. DOM REFERENCES
   ========================================================= */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const dom = {
  todayDate:     $('today-date'),
  diaryTitle:    $('diary-title'),
  diaryContent:  $('diary-content'),
  titleCount:    $('title-count'),
  btnSave:       $('btn-save'),
  btnClear:      $('btn-clear'),
  saveToast:     $('save-toast'),
  editorSection: $('editor-section'),
  listSection:   $('list-section'),
  diaryList:     $('diary-list'),
  emptyState:    $('empty-state'),
  totalCount:    $('total-count'),
  searchInput:   $('search-input'),
  catSvg:        $('cat-svg-container'),
  catBtn:        $('cat-interact-btn'),
  bubble:        $('bubble'),
  bubbleText:    $('bubble-text'),
  diaryModal:    $('diary-modal'),
  modalClose:    $('modal-close'),
  modalDate:     $('modal-date'),
  modalTitle:    $('modal-title'),
  modalContent:  $('modal-content'),
  confirmDialog: $('confirm-dialog'),
  confirmCancel: $('confirm-cancel'),
  confirmOk:     $('confirm-ok'),
};

/* =========================================================
   4. CAT SVG RENDERING
   ========================================================= */
const CAT_SVG = {
  idle: `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 4px 8px rgba(0,0,0,0.12))">
      <ellipse cx="50" cy="68" rx="28" ry="22" fill="#f5dbb0"/>
      <circle cx="50" cy="42" r="24" fill="#f5dbb0"/>
      <polygon points="28,24 22,8 38,18" fill="#f5dbb0"/>
      <polygon points="30,23 25,12 36,19" fill="#ffb6c1"/>
      <polygon points="72,24 78,8 62,18" fill="#f5dbb0"/>
      <polygon points="70,23 75,12 64,19" fill="#ffb6c1"/>
      <ellipse cx="41" cy="40" rx="5" ry="6" fill="#4a3728"/>
      <ellipse cx="59" cy="40" rx="5" ry="6" fill="#4a3728"/>
      <circle cx="42" cy="38" r="1.5" fill="white"/>
      <circle cx="60" cy="38" r="1.5" fill="white"/>
      <ellipse cx="50" cy="49" rx="3" ry="2" fill="#e8a87c"/>
      <path d="M46 52 Q50 56 54 52" stroke="#c47a5a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <line x1="25" y1="48" x2="44" y2="50" stroke="#c8b89a" stroke-width="1" opacity="0.7"/>
      <line x1="25" y1="52" x2="44" y2="51" stroke="#c8b89a" stroke-width="1" opacity="0.7"/>
      <line x1="75" y1="48" x2="56" y2="50" stroke="#c8b89a" stroke-width="1" opacity="0.7"/>
      <line x1="75" y1="52" x2="56" y2="51" stroke="#c8b89a" stroke-width="1" opacity="0.7"/>
      <path d="M78 80 Q90 60 80 50" stroke="#f0c88a" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse cx="36" cy="86" rx="8" ry="6" fill="#f0c88a"/>
      <ellipse cx="64" cy="86" rx="8" ry="6" fill="#f0c88a"/>
      <ellipse cx="50" cy="72" rx="14" ry="10" fill="#fff0e0" opacity="0.6"/>
    </svg>`,

  happy: `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 4px 8px rgba(0,0,0,0.12))">
      <ellipse cx="50" cy="68" rx="28" ry="22" fill="#f5dbb0"/>
      <circle cx="50" cy="42" r="24" fill="#f5dbb0"/>
      <polygon points="28,24 22,8 38,18" fill="#f5dbb0"/>
      <polygon points="30,23 25,12 36,19" fill="#ffb6c1"/>
      <polygon points="72,24 78,8 62,18" fill="#f5dbb0"/>
      <polygon points="70,23 75,12 64,19" fill="#ffb6c1"/>
      <path d="M36 40 Q41 35 46 40" stroke="#4a3728" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M54 40 Q59 35 64 40" stroke="#4a3728" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="34" cy="48" rx="6" ry="4" fill="#ffb6c1" opacity="0.5"/>
      <ellipse cx="66" cy="48" rx="6" ry="4" fill="#ffb6c1" opacity="0.5"/>
      <ellipse cx="50" cy="49" rx="3" ry="2" fill="#e8a87c"/>
      <path d="M44 52 Q50 58 56 52" stroke="#c47a5a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <line x1="25" y1="48" x2="44" y2="50" stroke="#c8b89a" stroke-width="1" opacity="0.7"/>
      <line x1="25" y1="52" x2="44" y2="51" stroke="#c8b89a" stroke-width="1" opacity="0.7"/>
      <line x1="75" y1="48" x2="56" y2="50" stroke="#c8b89a" stroke-width="1" opacity="0.7"/>
      <line x1="75" y1="52" x2="56" y2="51" stroke="#c8b89a" stroke-width="1" opacity="0.7"/>
      <path d="M78 80 Q92 58 82 46" stroke="#f0c88a" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse cx="36" cy="86" rx="8" ry="6" fill="#f0c88a"/>
      <ellipse cx="64" cy="86" rx="8" ry="6" fill="#f0c88a"/>
      <ellipse cx="50" cy="72" rx="14" ry="10" fill="#fff0e0" opacity="0.6"/>
    </svg>`,
};

function renderCat(catState = 'idle') {
  const svg = CAT_SVG[catState] || CAT_SVG.idle;
  dom.catSvg.innerHTML = svg;
  dom.catSvg.parentElement.classList.remove('cat-happy', 'cat-sad', 'cat-listening');
}

/**
 * Trigger a cat animation + show matching bubble message simultaneously.
 * Uses a guard so rapid calls restart cleanly without stacking timers.
 * @param {'happy'|'sad'|'listening'} type
 * @param {number} duration ms before returning to idle
 */
function triggerCatAnimation(type, duration = 2000) {
  const wrapper = dom.catSvg.parentElement;

  // Clear any pending return-to-idle
  if (state.animReturnTimer) {
    clearTimeout(state.animReturnTimer);
  }

  // Remove all state classes and force reflow to restart CSS animation
  wrapper.classList.remove('cat-happy', 'cat-sad', 'cat-listening');
  void wrapper.offsetWidth;

  if (type === 'happy') {
    wrapper.classList.add('cat-happy');
    renderCat('happy');
  } else if (type === 'sad') {
    wrapper.classList.add('cat-sad');
    renderCat('idle');
  } else if (type === 'listening') {
    wrapper.classList.add('cat-listening');
    renderCat('idle');
  }

  state.animReturnTimer = setTimeout(() => {
    wrapper.classList.remove('cat-happy', 'cat-sad', 'cat-listening');
    renderCat('idle');
    state.animReturnTimer = null;
  }, duration);
}

/* =========================================================
   5. UTILITY FUNCTIONS
   ========================================================= */

/** 生成唯一 ID */
function generateDiaryId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** 获取完整的日期时间字符串（YYYY-MM-DD HH:mm 格式）*/
function getDateTime() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

/** 从消息组中随机选一条 */
function pickMessage(category) {
  const msgs = CAT_MESSAGES[category] || CAT_MESSAGES.idle;
  return msgs[Math.floor(Math.random() * msgs.length)];
}

/** HTML 转义 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* =========================================================
   6. SPEECH BUBBLE — transition-based show/hide
   ========================================================= */

/**
 * Show the speech bubble with a message.
 * Uses CSS class toggle instead of `hidden` so the fade-in transition fires.
 * @param {string} message - Text to display
 * @param {number} duration - Auto-hide delay in ms (default 3500)
 */
function showBubble(message, duration = 3500) {
  clearTimeout(state.bubbleTimer);

  dom.bubbleText.textContent = message;
  // Remove hidden attribute if present (first-ever show), then add visible class
  dom.bubble.removeAttribute('hidden');

  // Small rAF delay lets the browser paint the element before transitioning in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dom.bubble.classList.add('bubble-visible');
    });
  });

  state.bubbleTimer = setTimeout(() => hideBubble(), duration);
}

function hideBubble() {
  dom.bubble.classList.remove('bubble-visible');
}

/* =========================================================
   7. TOAST NOTIFICATION
   ========================================================= */
function showToast(msg, type = 'success') {
  dom.saveToast.textContent = msg;
  dom.saveToast.style.color = type === 'error' ? 'var(--error)' : 'var(--success)';
  dom.saveToast.classList.add('show');
  setTimeout(() => dom.saveToast.classList.remove('show'), 2800);
}

/** 列表区域专用 toast（在列表顶部显示） */
function showListToast(msg, type = 'success') {
  let toast = document.getElementById('list-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'list-toast';
    toast.className = 'list-toast';
    dom.diaryList.parentElement.insertBefore(toast, dom.diaryList);
  }
  toast.textContent = msg;
  toast.style.color = type === 'error' ? 'var(--error)' : 'var(--success)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

/* =========================================================
   8. DATE INITIALIZATION
   ========================================================= */
function initEditorDate() {
  const d = new Date();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const w = weekdays[d.getDay()];
  dom.todayDate.textContent = `${y}年${m}月${day}日 周${w}`;
}

/* =========================================================
   9. DIARY DATA MANAGEMENT
   ========================================================= */

/** 加载所有日记（从 localStorage 读取 diaryList） */
function loadDiaries() {
  const data = Storage.loadData(DIARY_STORAGE_KEY, []);
  if (!Array.isArray(data)) return [];
  return data.filter(item =>
    item && typeof item === 'object' && item.id && item.createTime && item.content
  );
}

/** 保存所有日记到 localStorage */
function saveDiaries(diaries) {
  Storage.saveData(DIARY_STORAGE_KEY, diaries);
}

/* =========================================================
   10. EDITOR INPUT EVENTS
   ========================================================= */

/** 标题输入事件 */
function onTitleInput() {
  const len = dom.diaryTitle.value.length;
  dom.titleCount.textContent = len;
  onContentTyping();
}

/** 内容输入事件 — 统一处理倾听动画，debounce 避免每个键盘事件都触发 */
function onContentTyping() {
  clearTimeout(state.listenDebounce);
  state.listenDebounce = setTimeout(() => {
    triggerCatAnimation('listening', 1800);
    showBubble(pickMessage('listening'), 2000);
  }, 600);
}

/** 清空编辑器内容 */
function clearEditor() {
  dom.diaryTitle.value = '';
  dom.diaryContent.value = '';
  dom.titleCount.textContent = '0';
  dom.diaryTitle.focus();
}

/* =========================================================
   11. SAVE DIARY
   ========================================================= */
function onSave() {
  const title = dom.diaryTitle.value.trim();
  const content = dom.diaryContent.value.trim();

  if (!content) {
    showToast('请先写点内容再保存吧～', 'error');
    showBubble('喵？好像还没写内容哦！', 3000);
    dom.diaryContent.focus();
    return;
  }

  const diary = {
    id: generateDiaryId(),
    title: title || '无标题',
    content: content,
    createTime: getDateTime(),
  };

  state.diaries.unshift(diary);
  saveDiaries(state.diaries);

  showToast('日记保存成功 🐱', 'success');
  triggerCatAnimation('happy', 2500);
  showBubble(pickMessage('save'), 2800);

  clearEditor();
}

/* =========================================================
   12. DIARY LIST RENDERING — 历史日记列表
   ========================================================= */

/** 获取过滤后的日记列表（按创建时间倒序） */
function getFilteredDiaries() {
  let list = [...state.diaries];
  if (dom.searchInput.value.trim()) {
    const q = dom.searchInput.value.toLowerCase();
    list = list.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.content.toLowerCase().includes(q)
    );
  }
  return list;
}

/** 渲染日记列表 — 每条包含标题、时间、查看和删除按钮 */
function renderList() {
  const list = getFilteredDiaries();
  dom.totalCount.textContent = `${state.diaries.length} 篇`;

  dom.diaryList.innerHTML = '';

  if (!list.length) {
    dom.emptyState.hidden = false;
    return;
  }

  dom.emptyState.hidden = true;

  list.forEach(entry => {
    const el = document.createElement('article');
    el.className = 'diary-entry';
    el.setAttribute('role', 'listitem');
    el.dataset.id = entry.id;

    const isUntitled = entry.title === '无标题';
    const titleClass = isUntitled ? 'entry-title untitled' : 'entry-title';
    const titleText = isUntitled ? '无标题' : escapeHtml(entry.title);

    el.innerHTML = `
      <div class="entry-header">
        <div class="entry-info">
          <div class="${titleClass}">${titleText}</div>
          <span class="entry-date">${entry.createTime}</span>
        </div>
      </div>
      <div class="entry-preview">${escapeHtml(entry.content)}</div>
      <div class="entry-actions">
        <button class="btn-view" data-action="view" data-id="${entry.id}" aria-label="查看日记">查看</button>
        <button class="btn-delete" data-action="delete" data-id="${entry.id}" aria-label="删除日记">删除</button>
      </div>
    `;

    dom.diaryList.appendChild(el);
  });
}

/* =========================================================
   13. VIEW DIARY DETAIL — 查看日记详情模态框
   ========================================================= */

/** 打开日记详情模态框 */
function openModal(id) {
  const entry = state.diaries.find(d => d.id === id);
  if (!entry) return;

  dom.modalDate.textContent = entry.createTime;
  dom.modalTitle.textContent = entry.title;
  dom.modalContent.textContent = entry.content;

  dom.diaryModal.hidden = false;
  document.body.style.overflow = 'hidden';
  dom.modalClose.focus();
}

/** 关闭模态框 */
function closeModal() {
  dom.diaryModal.hidden = true;
  document.body.style.overflow = '';
}

/* =========================================================
   14. DELETE DIARY — slide-out animation, then remove from storage
   ========================================================= */

let pendingDeleteId = null;

/** 弹出删除确认对话框 */
function promptDelete(id) {
  pendingDeleteId = id;
  dom.confirmDialog.hidden = false;
  dom.confirmOk.focus();
}

/**
 * 确认删除：
 * 1. 找到对应的 DOM 元素
 * 2. 添加 .entry-removing 触发向右滑出动画（0.45s）
 * 3. 动画结束后再从 state 和 localStorage 删除，刷新列表
 */
function confirmDelete() {
  if (!pendingDeleteId) return;

  const idToDelete = pendingDeleteId;
  pendingDeleteId = null;

  dom.confirmDialog.hidden = true;
  closeModal();

  // Find the DOM element for this entry
  const el = dom.diaryList.querySelector(`[data-id="${idToDelete}"]`);

  // Trigger cat + bubble immediately so feedback is instant
  triggerCatAnimation('sad', 2500);
  showBubble(pickMessage('delete'), 2800);

  if (el) {
    // Add animation class — CSS handles the slide + fade
    el.classList.add('entry-removing');

    // Wait for animation to finish before touching data
    el.addEventListener('animationend', () => {
      state.diaries = state.diaries.filter(d => d.id !== idToDelete);
      saveDiaries(state.diaries);
      renderList();
      showListToast('日记已删除', 'success');
    }, { once: true });
  } else {
    // Fallback: element not visible (e.g. filtered out), delete immediately
    state.diaries = state.diaries.filter(d => d.id !== idToDelete);
    saveDiaries(state.diaries);
    renderList();
    showListToast('日记已删除', 'success');
  }
}

/** 取消删除 */
function cancelDelete() {
  pendingDeleteId = null;
  dom.confirmDialog.hidden = true;
}

/* =========================================================
   15. VIEW SWITCHING
   ========================================================= */
function switchView(view) {
  const isEditor = view === 'editor';
  dom.editorSection.hidden = !isEditor;
  dom.listSection.hidden = isEditor;
  dom.editorSection.classList.toggle('active', isEditor);
  dom.listSection.classList.toggle('active', !isEditor);

  $$('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  if (!isEditor) {
    renderList();
  } else {
    dom.diaryTitle.focus();
  }
}

/* =========================================================
   16. CAT INTERACTION
   ========================================================= */
function onCatInteract() {
  triggerCatAnimation('happy', 2000);
  showBubble(pickMessage('interact'), 2200);
}

/* =========================================================
   17. PERIODIC CAT MESSAGES
   ========================================================= */
function startIdleMessages() {
  setInterval(() => {
    if (!dom.bubble.classList.contains('bubble-visible')) {
      showBubble(pickMessage('idle'), 4000);
    }
  }, 30000);
}

/* =========================================================
   18. EVENT BINDING
   ========================================================= */
function bindEvents() {
  // 导航按钮
  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // 空状态中的"开始写日记"按钮
  document.addEventListener('click', e => {
    if (e.target.dataset.view) switchView(e.target.dataset.view);
  });

  // 标题输入 — 字数计数 + 倾听动画
  dom.diaryTitle.addEventListener('input', onTitleInput);

  // 内容输入 — 倾听动画（debounced）
  dom.diaryContent.addEventListener('input', onContentTyping);

  // 保存按钮 + Ctrl/Cmd+S
  dom.btnSave.addEventListener('click', onSave);
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave();
    }
  });

  // 清空按钮
  dom.btnClear.addEventListener('click', () => {
    clearEditor();
    showBubble('喵～重新开始写吧！', 2500);
  });

  // 搜索输入
  dom.searchInput.addEventListener('input', () => {
    renderList();
  });

  // 日记列表事件委托 — 查看 / 删除按钮
  dom.diaryList.addEventListener('click', e => {
    const viewBtn = e.target.closest('[data-action="view"]');
    const deleteBtn = e.target.closest('[data-action="delete"]');

    if (viewBtn) {
      e.stopPropagation();
      openModal(viewBtn.dataset.id);
    } else if (deleteBtn) {
      e.stopPropagation();
      promptDelete(deleteBtn.dataset.id);
    }
  });

  // 模态框关闭 — 关闭按钮 + 点击半透明背景
  dom.modalClose.addEventListener('click', closeModal);
  dom.diaryModal.addEventListener('click', e => {
    if (e.target === dom.diaryModal) closeModal();
  });

  // 确认对话框
  dom.confirmOk.addEventListener('click', confirmDelete);
  dom.confirmCancel.addEventListener('click', cancelDelete);
  dom.confirmDialog.addEventListener('click', e => {
    if (e.target === dom.confirmDialog) cancelDelete();
  });

  // Escape 快捷键
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      cancelDelete();
    }
  });

  // 猫咪互动
  dom.catBtn.addEventListener('click', onCatInteract);
}

/* =========================================================
   19. INITIALIZATION
   ========================================================= */
function init() {
  // 从 localStorage 加载已保存的日记
  state.diaries = loadDiaries();

  // 初始化今天日期显示
  initEditorDate();

  // 绘制猫咪
  renderCat('idle');

  // 绑定所有事件
  bindEvents();

  // 欢迎气泡 — 根据时间选择问候语
  const hour = new Date().getHours();
  let greeting;
  if (hour < 6)        greeting = '深夜还不睡吗？喵～';
  else if (hour < 12)  greeting = '早上好喵～今天也要加油！';
  else if (hour < 18)  greeting = '下午好喵～记得喝水哦！';
  else                 greeting = '晚上好喵～辛苦了今天！';

  setTimeout(() => showBubble(greeting, 4000), 800);

  // 启动周期性闲聊
  startIdleMessages();

  // 初始聚焦到标题输入框
  dom.diaryTitle.focus();
}

document.addEventListener('DOMContentLoaded', init);
