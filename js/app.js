/**
 * TASKFLOW — Next-Gen Modern Productivity & To-Do Suite
 * Pure Vanilla JavaScript Architecture
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. Constants & Initial State
     ========================================================================== */
  const STORAGE_KEY_TASKS = 'taskflow_tasks_v1';
  const STORAGE_KEY_THEME = 'taskflow_theme';
  const STORAGE_KEY_SOUND = 'taskflow_sound';
  const STORAGE_KEY_STREAK = 'taskflow_streak';
  const STORAGE_KEY_CLEANED = 'taskflow_sample_purged_v1';

  // Sample tasks loaded on fresh launch
  const SAMPLE_TASKS = [
    {
      id: 'task-1',
      title: 'Review Q4 Product Architecture & Roadmap',
      notes: 'Align team on modular components, responsive layouts, and performance targets.',
      priority: 'high',
      category: 'Work',
      dueDate: getRelativeDateString(0), // Today
      status: 'in-progress',
      pinned: true,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      subtasks: [
        { id: 'sub-1', title: 'Prepare performance benchmarks', completed: true },
        { id: 'sub-2', title: 'Review API payload specifications', completed: false },
        { id: 'sub-3', title: 'Schedule stakeholder sync', completed: false }
      ]
    },
    {
      id: 'task-2',
      title: 'Implement Dark & Light mode theme engine',
      notes: 'Ensure fluid color transitions with CSS custom tokens and SVG icons.',
      priority: 'medium',
      category: 'Coding',
      dueDate: getRelativeDateString(1), // Tomorrow
      status: 'done',
      pinned: false,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      subtasks: [
        { id: 'sub-4', title: 'Define HSL color palettes', completed: true },
        { id: 'sub-5', title: 'Add local storage persistence', completed: true }
      ]
    },
    {
      id: 'task-3',
      title: 'Complete 45-minute HIIT workout session',
      notes: 'Hydrate well and follow stretching routine afterward.',
      priority: 'medium',
      category: 'Health',
      dueDate: getRelativeDateString(0),
      status: 'todo',
      pinned: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      subtasks: []
    },
    {
      id: 'task-4',
      title: 'Buy fresh organic groceries & pantry restock',
      notes: 'Avocados, almond milk, oats, Greek yogurt, and sourdough bread.',
      priority: 'low',
      category: 'Shopping',
      dueDate: getRelativeDateString(2),
      status: 'todo',
      pinned: false,
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      subtasks: [
        { id: 'sub-6', title: 'Check refrigerator inventory', completed: true },
        { id: 'sub-7', title: 'Bring reusable bags', completed: false }
      ]
    },
    {
      id: 'task-5',
      title: 'Review monthly subscription costs & budget',
      notes: 'Cancel unused services and transfer savings to investment account.',
      priority: 'high',
      category: 'Finance',
      dueDate: getRelativeDateString(-1), // Overdue for demonstration
      status: 'todo',
      pinned: false,
      createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
      subtasks: []
    }
  ];

  /* State Management */
  let tasks = loadTasksFromStorage();
  let currentFilter = 'all';
  let currentCategory = 'all';
  let currentSort = 'date-desc';
  let currentSearchQuery = '';
  let currentView = 'list'; // 'list' | 'board'
  let soundEnabled = localStorage.getItem(STORAGE_KEY_SOUND) !== 'false';
  let lastDeletedTask = null;
  let creatorSubtasksList = [];
  let editModalSubtasksList = [];

  /* ==========================================================================
     2. Web Audio API Synthesizer (Zero External Dependencies)
     ========================================================================== */
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  const SoundEngine = {
    playSuccess() {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        
        // Ascending harmonic chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
        osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5

        osc2.frequency.setValueAtTime(1046.50, now + 0.15); // C6

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.15);
        osc1.stop(now + 0.5);
        osc2.stop(now + 0.5);
      } catch (e) {
        console.warn('Audio feedback failed:', e);
      }
    },

    playPop() {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } catch (e) {}
    },

    playAdd() {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } catch (e) {}
    },

    playFanfare() {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, High C
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = ctx.currentTime + idx * 0.12;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.12, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.4);
        });
      } catch (e) {}
    }
  };

  /* ==========================================================================
     3. Lightweight Confetti Particle Canvas
     ========================================================================== */
  const Confetti = {
    canvas: document.getElementById('confettiCanvas'),
    ctx: null,
    particles: [],
    animationId: null,

    init() {
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
    },

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    burst(x = window.innerWidth / 2, y = window.innerHeight / 3) {
      if (!this.ctx) this.init();
      const colors = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
      const count = 75;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 4;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 12,
          gravity: 0.25,
          alpha: 1,
          shape: Math.random() > 0.4 ? 'rect' : 'circle'
        });
      }

      if (!this.animationId) {
        this.animate();
      }
    },

    animate() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.alpha -= 0.012;

        if (p.alpha <= 0 || p.y > this.canvas.height + 20) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(p.alpha, 0);
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        this.animationId = requestAnimationFrame(() => this.animate());
      } else {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.animationId = null;
      }
    }
  };

  /* ==========================================================================
     4. Date & Helper Functions
     ========================================================================== */
  function getRelativeDateString(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const todayStr = getRelativeDateString(0);
    const tomorrowStr = getRelativeDateString(1);
    const yesterdayStr = getRelativeDateString(-1);

    if (dateStr === todayStr) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    if (dateStr === yesterdayStr) return 'Yesterday';

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return dateStr;
  }

  function isOverdue(dateStr, status) {
    if (!dateStr || status === 'done') return false;
    const todayStr = getRelativeDateString(0);
    return dateStr < todayStr;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ==========================================================================
     5. Storage & Persistence
     ========================================================================== */
  function loadTasksFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TASKS);
      const purged = localStorage.getItem(STORAGE_KEY_CLEANED);

      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // One-time automatic migration: purge old default sample tasks from previous visits
          if (!purged) {
            localStorage.setItem(STORAGE_KEY_CLEANED, 'true');
            const sampleIds = new Set(['task-1', 'task-2', 'task-3', 'task-4', 'task-5']);
            const cleaned = parsed.filter(t => !sampleIds.has(t.id));
            if (cleaned.length !== parsed.length) {
              localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(cleaned));
              return cleaned;
            }
          }
          return parsed;
        }
      } else {
        localStorage.setItem(STORAGE_KEY_CLEANED, 'true');
      }
    } catch (e) {
      console.error('Error loading tasks from local storage:', e);
    }
    // Clean default state on first launch: exactly 0 tasks
    return [];
  }

  function saveTasksToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
      updateProductivityMetrics();
      updateStreakTracker();
    } catch (e) {
      console.error('Error saving tasks to local storage:', e);
    }
  }

  /* Daily Streak Calculation */
  function updateStreakTracker() {
    const todayStr = getRelativeDateString(0);
    let streakData = { count: 1, lastCompletedDate: todayStr };

    try {
      const stored = localStorage.getItem(STORAGE_KEY_STREAK);
      if (stored) streakData = JSON.parse(stored);
    } catch (e) {}

    const completedToday = tasks.some(t => t.status === 'done');
    if (completedToday) {
      if (streakData.lastCompletedDate !== todayStr) {
        const yesterdayStr = getRelativeDateString(-1);
        if (streakData.lastCompletedDate === yesterdayStr) {
          streakData.count += 1;
        } else {
          streakData.count = 1;
        }
        streakData.lastCompletedDate = todayStr;
        localStorage.setItem(STORAGE_KEY_STREAK, JSON.stringify(streakData));
      }
    }

    const streakCountElem = document.getElementById('streakCount');
    if (streakCountElem) {
      streakCountElem.textContent = streakData.count || 1;
    }
  }

  /* ==========================================================================
     6. Toast Notifications
     ========================================================================== */
  function showToast(message, type = 'info', undoCallback = null) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else if (type === 'danger') {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <span>${escapeHtml(message)}</span>
    `;

    if (undoCallback) {
      const undoBtn = document.createElement('button');
      undoBtn.className = 'toast-undo-btn';
      undoBtn.textContent = 'Undo';
      undoBtn.onclick = () => {
        undoCallback();
        toast.remove();
      };
      toast.appendChild(undoBtn);
    }

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  /* ==========================================================================
     7. Filter & Sorting Logic
     ========================================================================== */
  function getFilteredAndSortedTasks() {
    let result = [...tasks];

    // Search query filter
    if (currentSearchQuery.trim()) {
      const q = currentSearchQuery.toLowerCase();
      result = result.filter(task => {
        const inTitle = task.title.toLowerCase().includes(q);
        const inNotes = task.notes ? task.notes.toLowerCase().includes(q) : false;
        const inCategory = task.category.toLowerCase().includes(q);
        const inSubtasks = task.subtasks ? task.subtasks.some(s => s.title.toLowerCase().includes(q)) : false;
        return inTitle || inNotes || inCategory || inSubtasks;
      });
    }

    // Category filter
    if (currentCategory !== 'all') {
      result = result.filter(task => task.category === currentCategory);
    }

    // Status / View filter
    const todayStr = getRelativeDateString(0);
    if (currentFilter === 'active') {
      result = result.filter(task => task.status !== 'done');
    } else if (currentFilter === 'completed') {
      result = result.filter(task => task.status === 'done');
    } else if (currentFilter === 'today') {
      result = result.filter(task => task.dueDate === todayStr);
    } else if (currentFilter === 'high') {
      result = result.filter(task => task.priority === 'high');
    }

    // Sorting
    result.sort((a, b) => {
      // Pinned items always float to the top
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      if (currentSort === 'date-desc') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (currentSort === 'date-asc') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (currentSort === 'due-date') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      } else if (currentSort === 'priority-desc') {
        const weight = { high: 3, medium: 2, low: 1 };
        return weight[b.priority] - weight[a.priority];
      } else if (currentSort === 'alpha-asc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }

  /* ==========================================================================
     8. Rendering Engine
     ========================================================================== */
  function render() {
    if (currentView === 'list') {
      renderListView();
    } else {
      renderKanbanView();
    }
    updateProductivityMetrics();
  }

  /* 8.1 List View Rendering */
  function renderListView() {
    const pinnedGroup = document.getElementById('pinnedTasksGroup');
    const pinnedList = document.getElementById('pinnedTasksList');
    const pinnedBadge = document.getElementById('pinnedCountBadge');

    const tasksList = document.getElementById('tasksList');
    const activeBadge = document.getElementById('activeCountBadge');
    const activeGroupHeading = document.getElementById('activeGroupHeading');

    const completedGroup = document.getElementById('completedTasksGroup');
    const completedList = document.getElementById('completedTasksList');
    const completedBadge = document.getElementById('completedCountBadge');

    const emptyState = document.getElementById('emptyStateContainer');

    const filtered = getFilteredAndSortedTasks();

    pinnedList.innerHTML = '';
    tasksList.innerHTML = '';
    completedList.innerHTML = '';

    const pinnedTasks = filtered.filter(t => t.pinned && t.status !== 'done');
    const regularTasks = filtered.filter(t => !t.pinned && t.status !== 'done');
    const completedTasks = filtered.filter(t => t.status === 'done');

    // Handle Pinned Section
    if (pinnedTasks.length > 0 && currentFilter !== 'completed') {
      pinnedGroup.classList.remove('hidden');
      pinnedBadge.textContent = pinnedTasks.length;
      pinnedTasks.forEach(task => pinnedList.appendChild(createTaskItemElement(task)));
    } else {
      pinnedGroup.classList.add('hidden');
    }

    // Handle Active Section
    if (currentFilter === 'completed') {
      document.getElementById('activeTasksGroup').classList.add('hidden');
    } else {
      document.getElementById('activeTasksGroup').classList.remove('hidden');
      activeGroupHeading.textContent = pinnedTasks.length > 0 ? 'Other Tasks' : 'Tasks';
      activeBadge.textContent = regularTasks.length;
      regularTasks.forEach(task => tasksList.appendChild(createTaskItemElement(task)));
    }

    // Handle Completed Section
    if (completedTasks.length > 0 && (currentFilter === 'all' || currentFilter === 'completed')) {
      completedGroup.classList.remove('hidden');
      completedBadge.textContent = completedTasks.length;
      completedTasks.forEach(task => completedList.appendChild(createTaskItemElement(task)));
    } else {
      completedGroup.classList.add('hidden');
    }

    // Handle Empty State
    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
      const emptyTitle = document.getElementById('emptyTitle');
      const emptyDesc = document.getElementById('emptyDesc');

      if (currentSearchQuery.trim()) {
        emptyTitle.textContent = 'No matching tasks';
        emptyDesc.textContent = `No tasks found matching "${currentSearchQuery}".`;
      } else if (currentFilter === 'completed') {
        emptyTitle.textContent = 'No completed tasks yet';
        emptyDesc.textContent = 'Finish tasks to see them celebrated here!';
      } else {
        emptyTitle.textContent = 'All caught up!';
        emptyDesc.textContent = 'No tasks in this view. Enjoy your day or add a new goal.';
      }
    } else {
      emptyState.classList.add('hidden');
    }
  }

  /* Create Individual Task Item Element */
  function createTaskItemElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.status === 'done' ? 'completed' : ''} ${task.pinned ? 'pinned' : ''}`;
    li.dataset.id = task.id;
    li.dataset.priority = task.priority;

    const isTaskDone = task.status === 'done';
    const overdue = isOverdue(task.dueDate, task.status);
    const dateLabel = formatDisplayDate(task.dueDate);

    // Subtasks summary
    const totalSubs = task.subtasks ? task.subtasks.length : 0;
    const completedSubs = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
    const hasSubs = totalSubs > 0;

    li.innerHTML = `
      <div class="task-main-row">
        <!-- Animated Checkbox -->
        <div class="task-checkbox-wrap">
          <input 
            type="checkbox" 
            class="task-checkbox" 
            id="chk-${task.id}" 
            ${isTaskDone ? 'checked' : ''} 
            title="${isTaskDone ? 'Mark as Incomplete' : 'Mark as Complete'}"
          >
          <svg class="custom-checkmark-svg" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <!-- Task Body -->
        <div class="task-body">
          <div class="task-title-line">
            <span class="task-title">${escapeHtml(task.title)}</span>
          </div>
          
          ${task.notes ? `<p class="task-notes">${escapeHtml(task.notes)}</p>` : ''}

          <!-- Metadata Badges -->
          <div class="task-meta-bar">
            <!-- Category Badge -->
            <span class="meta-badge category-pill" data-category="${escapeHtml(task.category)}">
              ${escapeHtml(task.category)}
            </span>

            <!-- Priority Badge -->
            <span class="meta-badge priority-tag ${task.priority}">
              ${task.priority} priority
            </span>

            <!-- Due Date Badge -->
            ${task.dueDate ? `
              <span class="meta-badge due-badge ${overdue ? 'overdue' : (dateLabel === 'Today' ? 'today' : '')}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                ${dateLabel}${overdue ? ' (Overdue)' : ''}
              </span>
            ` : ''}

            <!-- Subtask Badge Toggle -->
            ${hasSubs ? `
              <span class="meta-badge subtask-counter-pill" data-subtask-toggle="${task.id}" title="Toggle subtask checklist">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                ${completedSubs}/${totalSubs} steps
              </span>
            ` : ''}
          </div>

          <!-- Subtasks Container (Collapsible) -->
          ${hasSubs ? `
            <div class="task-subtasks-container" id="subtasks-container-${task.id}">
              ${task.subtasks.map(sub => `
                <label class="subtask-row">
                  <input type="checkbox" class="subtask-checkbox" data-task-id="${task.id}" data-sub-id="${sub.id}" ${sub.completed ? 'checked' : ''}>
                  <span class="subtask-title">${escapeHtml(sub.title)}</span>
                </label>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Task Actions -->
        <div class="task-actions">
          <button class="task-action-btn btn-pin ${task.pinned ? 'is-pinned' : ''}" data-action="pin" title="${task.pinned ? 'Unpin' : 'Pin to top'}">
            <svg viewBox="0 0 24 24" fill="${task.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6l.8.8.8-.8v-6H18v-2l-2-2z"/></svg>
          </button>
          <button class="task-action-btn btn-edit" data-action="edit" title="Edit task">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
          <button class="task-action-btn btn-duplicate" data-action="duplicate" title="Duplicate task">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button class="task-action-btn btn-delete" data-action="delete" title="Delete task">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;

    // Event Listeners for Task Items
    const chk = li.querySelector('.task-checkbox');
    chk.addEventListener('change', (e) => {
      toggleTaskCompletion(task.id, e.target.checked);
    });

    // Subtask checkbox listeners
    li.querySelectorAll('.subtask-checkbox').forEach(input => {
      input.addEventListener('change', (e) => {
        const taskId = e.target.dataset.taskId;
        const subId = e.target.dataset.subId;
        toggleSubtask(taskId, subId, e.target.checked);
      });
    });

    // Subtask toggle button
    const subToggleBtn = li.querySelector('[data-subtask-toggle]');
    if (subToggleBtn) {
      subToggleBtn.addEventListener('click', () => {
        const drawer = document.getElementById(`subtasks-container-${task.id}`);
        if (drawer) {
          drawer.classList.toggle('hidden');
        }
      });
    }

    // Action button listeners
    li.querySelector('[data-action="pin"]').addEventListener('click', () => togglePinTask(task.id));
    li.querySelector('[data-action="edit"]').addEventListener('click', () => openEditModal(task.id));
    li.querySelector('[data-action="duplicate"]').addEventListener('click', () => duplicateTask(task.id));
    li.querySelector('[data-action="delete"]').addEventListener('click', () => deleteTask(task.id));

    return li;
  }

  /* 8.2 Kanban Board View Rendering & Drag-and-Drop */
  function renderKanbanView() {
    const colTodo = document.getElementById('kanbanCardsTodo');
    const colInProgress = document.getElementById('kanbanCardsInProgress');
    const colDone = document.getElementById('kanbanCardsDone');

    const badgeTodo = document.getElementById('colBadgeTodo');
    const badgeInProgress = document.getElementById('colBadgeInProgress');
    const badgeDone = document.getElementById('colBadgeDone');

    colTodo.innerHTML = '';
    colInProgress.innerHTML = '';
    colDone.innerHTML = '';

    const filtered = getFilteredAndSortedTasks();

    let countTodo = 0;
    let countInProgress = 0;
    let countDone = 0;

    filtered.forEach(task => {
      const card = createKanbanCard(task);
      if (task.status === 'in-progress') {
        colInProgress.appendChild(card);
        countInProgress++;
      } else if (task.status === 'done') {
        colDone.appendChild(card);
        countDone++;
      } else {
        colTodo.appendChild(card);
        countTodo++;
      }
    });

    badgeTodo.textContent = countTodo;
    badgeInProgress.textContent = countInProgress;
    badgeDone.textContent = countDone;
  }

  function createKanbanCard(task) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.id = task.id;

    const overdue = isOverdue(task.dueDate, task.status);
    const dateLabel = formatDisplayDate(task.dueDate);

    card.innerHTML = `
      <div class="kanban-card-title">${escapeHtml(task.title)}</div>
      ${task.notes ? `<p class="task-notes" style="font-size:0.78rem;">${escapeHtml(task.notes)}</p>` : ''}
      <div class="kanban-card-meta">
        <span class="meta-badge category-pill" data-category="${escapeHtml(task.category)}">${escapeHtml(task.category)}</span>
        <span class="meta-badge priority-tag ${task.priority}">${task.priority}</span>
        ${task.dueDate ? `
          <span class="meta-badge due-badge ${overdue ? 'overdue' : (dateLabel === 'Today' ? 'today' : '')}">
            ${dateLabel}
          </span>
        ` : ''}
      </div>
      <div class="kanban-card-footer">
        <button class="kanban-quick-status-btn" data-action="quick-cycle">
          Status: <strong>${task.status === 'in-progress' ? 'In Progress' : (task.status === 'done' ? 'Done' : 'To Do')}</strong>
        </button>
        <button class="task-action-btn btn-edit" data-action="edit" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </button>
      </div>
    `;

    // Drag events
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', task.id);
      card.classList.add('is-dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('is-dragging');
    });

    // Quick cycle status button
    card.querySelector('[data-action="quick-cycle"]').addEventListener('click', () => {
      const nextStatus = task.status === 'todo' ? 'in-progress' : (task.status === 'in-progress' ? 'done' : 'todo');
      setTaskStatus(task.id, nextStatus);
    });

    card.querySelector('[data-action="edit"]').addEventListener('click', () => {
      openEditModal(task.id);
    });

    return card;
  }

  /* Setup Kanban Drag and Drop Containers */
  function setupKanbanDropZones() {
    const columns = [
      document.getElementById('kanbanCardsTodo'),
      document.getElementById('kanbanCardsInProgress'),
      document.getElementById('kanbanCardsDone')
    ];

    columns.forEach(col => {
      if (!col) return;
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('drag-over');
      });

      col.addEventListener('dragleave', () => {
        col.classList.remove('drag-over');
      });

      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const taskId = e.dataTransfer.getData('text/plain');
        const targetStatus = col.dataset.dropStatus;
        if (taskId && targetStatus) {
          setTaskStatus(taskId, targetStatus);
        }
      });
    });
  }

  /* ==========================================================================
     9. Productivity Dashboard Metrics & Progress Ring
     ========================================================================== */
  function updateProductivityMetrics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const pending = tasks.filter(t => t.status === 'in-progress').length;
    const high = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;

    // Filter counts update
    const countFilterAll = document.getElementById('countFilterAll');
    const countFilterActive = document.getElementById('countFilterActive');
    const countFilterToday = document.getElementById('countFilterToday');
    const countFilterHigh = document.getElementById('countFilterHigh');
    const countFilterCompleted = document.getElementById('countFilterCompleted');

    const todayStr = getRelativeDateString(0);
    const todayCount = tasks.filter(t => t.dueDate === todayStr).length;

    if (countFilterAll) countFilterAll.textContent = total;
    if (countFilterActive) countFilterActive.textContent = total - completed;
    if (countFilterToday) countFilterToday.textContent = todayCount;
    if (countFilterHigh) countFilterHigh.textContent = high;
    if (countFilterCompleted) countFilterCompleted.textContent = completed;

    // Hero stats
    const totalTasksElem = document.getElementById('totalTasksCount');
    const completedTasksElem = document.getElementById('completedTasksCount');
    const pendingTasksElem = document.getElementById('pendingTasksCount');
    const highPriorityElem = document.getElementById('highPriorityCount');

    if (totalTasksElem) totalTasksElem.textContent = total;
    if (completedTasksElem) completedTasksElem.textContent = completed;
    if (pendingTasksElem) pendingTasksElem.textContent = pending;
    if (highPriorityElem) highPriorityElem.textContent = high;

    // Progress percentage
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const progressPercentageElem = document.getElementById('progressPercentage');
    if (progressPercentageElem) {
      progressPercentageElem.textContent = `${percent}%`;
    }

    // Circular progress stroke calculation
    const circle = document.getElementById('progressRingCircle');
    if (circle) {
      const radius = circle.r.baseVal.value;
      const circumference = 2 * Math.PI * radius; // ~339.292
      circle.style.strokeDasharray = `${circumference} ${circumference}`;
      const offset = circumference - (percent / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }

    // Progress status message
    const statusTextElem = document.getElementById('progressStatusText');
    if (statusTextElem) {
      if (total === 0) {
        statusTextElem.textContent = 'Add your first task!';
      } else if (percent === 100) {
        statusTextElem.textContent = '🎉 All tasks accomplished!';
      } else if (percent >= 75) {
        statusTextElem.textContent = 'Almost there! Finish strong.';
      } else if (percent >= 50) {
        statusTextElem.textContent = 'Halfway conquered!';
      } else if (percent > 0) {
        statusTextElem.textContent = 'Making great progress!';
      } else {
        statusTextElem.textContent = 'Ready to crush your goals?';
      }
    }
  }

  /* ==========================================================================
     10. Task CRUD Actions
     ========================================================================== */
  function addTask(title, notes, priority, category, dueDate, subtasks = []) {
    if (!title.trim()) return;

    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: title.trim(),
      notes: notes.trim(),
      priority: priority || 'medium',
      category: category || 'Work',
      dueDate: dueDate || '',
      status: 'todo',
      pinned: false,
      createdAt: new Date().toISOString(),
      subtasks: [...subtasks]
    };

    tasks.unshift(newTask);
    saveTasksToStorage();
    render();
    SoundEngine.playAdd();
    showToast(`Task "${newTask.title}" created!`, 'success');
  }

  function setTaskStatus(taskId, status) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const wasDone = task.status === 'done';
    task.status = status;

    if (status === 'done') {
      // Also complete all subtasks
      if (task.subtasks) {
        task.subtasks.forEach(s => s.completed = true);
      }
      SoundEngine.playSuccess();
      Confetti.burst();
      checkAllCompletedMilestone();
    } else {
      SoundEngine.playPop();
    }

    saveTasksToStorage();
    render();
  }

  function toggleTaskCompletion(taskId, isChecked) {
    setTaskStatus(taskId, isChecked ? 'done' : 'todo');
  }

  function toggleSubtask(taskId, subId, isChecked) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const sub = task.subtasks.find(s => s.id === subId);
    if (sub) {
      sub.completed = isChecked;
      SoundEngine.playPop();
      saveTasksToStorage();
      render();
    }
  }

  function togglePinTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.pinned = !task.pinned;
    saveTasksToStorage();
    render();
    SoundEngine.playPop();
    showToast(task.pinned ? 'Task pinned to top' : 'Task unpinned', 'info');
  }

  function duplicateTask(taskId) {
    const original = tasks.find(t => t.id === taskId);
    if (!original) return;

    const copy = {
      ...JSON.parse(JSON.stringify(original)),
      id: 'task-' + Date.now(),
      title: `${original.title} (Copy)`,
      createdAt: new Date().toISOString()
    };

    const index = tasks.findIndex(t => t.id === taskId);
    tasks.splice(index + 1, 0, copy);
    saveTasksToStorage();
    render();
    SoundEngine.playAdd();
    showToast('Task duplicated!', 'info');
  }

  function deleteTask(taskId) {
    const index = tasks.findIndex(t => t.id === taskId);
    if (index === -1) return;

    lastDeletedTask = {
      task: { ...tasks[index] },
      index: index
    };

    const taskTitle = tasks[index].title;
    tasks.splice(index, 1);
    saveTasksToStorage();
    render();
    SoundEngine.playPop();

    showToast(`Deleted "${taskTitle}"`, 'danger', () => {
      // Undo callback
      if (lastDeletedTask) {
        tasks.splice(lastDeletedTask.index, 0, lastDeletedTask.task);
        saveTasksToStorage();
        render();
        SoundEngine.playAdd();
        showToast('Task restored!', 'success');
        lastDeletedTask = null;
      }
    });
  }

  function clearAllCompleted() {
    const completedCount = tasks.filter(t => t.status === 'done').length;
    if (completedCount === 0) return;

    const previousTasks = [...tasks];
    tasks = tasks.filter(t => t.status !== 'done');
    saveTasksToStorage();
    render();
    SoundEngine.playPop();

    showToast(`Cleared ${completedCount} completed tasks`, 'danger', () => {
      tasks = previousTasks;
      saveTasksToStorage();
      render();
      showToast('Completed tasks restored!', 'success');
    });
  }

  function clearAllTasks() {
    if (tasks.length === 0) return;
    const previousTasks = [...tasks];
    tasks = [];
    saveTasksToStorage();
    render();
    SoundEngine.playPop();
    showToast('All tasks cleared!', 'info', () => {
      tasks = previousTasks;
      saveTasksToStorage();
      render();
      showToast('Tasks restored!', 'success');
    });
  }

  function checkAllCompletedMilestone() {
    const allDone = tasks.length > 0 && tasks.every(t => t.status === 'done');
    if (allDone) {
      setTimeout(() => {
        SoundEngine.playFanfare();
        Confetti.burst(window.innerWidth * 0.3, window.innerHeight * 0.4);
        Confetti.burst(window.innerWidth * 0.7, window.innerHeight * 0.4);
        showToast('🏆 Spectacular! You completed every single task!', 'success');
      }, 350);
    }
  }

  /* ==========================================================================
     11. Edit Task Modal Logic
     ========================================================================== */
  function openEditModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskNotes').value = task.notes || '';
    document.getElementById('editStatusSelect').value = task.status;
    document.getElementById('editCategorySelect').value = task.category;
    document.getElementById('editDueDateInput').value = task.dueDate || '';

    // Set priority pill active
    const priorityPills = document.querySelectorAll('#editPrioritySelector .priority-pill');
    priorityPills.forEach(p => {
      p.classList.toggle('active', p.dataset.priority === task.priority);
    });

    // Populate modal subtasks
    editModalSubtasksList = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
    renderEditModalSubtasks();

    const backdrop = document.getElementById('editModalBackdrop');
    backdrop.classList.remove('hidden');
    document.getElementById('editTaskTitle').focus();
  }

  function closeEditModal() {
    const backdrop = document.getElementById('editModalBackdrop');
    backdrop.classList.add('hidden');
  }

  function renderEditModalSubtasks() {
    const list = document.getElementById('editModalSubtaskList');
    list.innerHTML = '';
    editModalSubtasksList.forEach((sub, index) => {
      const li = document.createElement('li');
      li.className = 'modal-subtask-item';
      li.innerHTML = `
        <span style="text-decoration: ${sub.completed ? 'line-through' : 'none'}; color: ${sub.completed ? 'var(--text-muted)' : 'var(--text-main)'}">
          ${escapeHtml(sub.title)}
        </span>
        <button type="button" class="subtask-remove-btn" title="Remove subtask">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `;
      li.querySelector('.subtask-remove-btn').addEventListener('click', () => {
        editModalSubtasksList.splice(index, 1);
        renderEditModalSubtasks();
      });
      list.appendChild(li);
    });
  }

  /* ==========================================================================
     12. UI Event Listeners & Initialization
     ========================================================================== */
  function init() {
    // 12.1 Theme Switcher
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(STORAGE_KEY_THEME, next);
      SoundEngine.playPop();
    });

    // 12.2 Sound Effects Toggle
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    const iconSoundOn = soundToggleBtn.querySelector('.icon-sound-on');
    const iconSoundOff = soundToggleBtn.querySelector('.icon-sound-off');

    function updateSoundBtnUI() {
      if (soundEnabled) {
        iconSoundOn.classList.remove('hidden');
        iconSoundOff.classList.add('hidden');
      } else {
        iconSoundOn.classList.add('hidden');
        iconSoundOff.classList.remove('hidden');
      }
    }
    updateSoundBtnUI();

    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem(STORAGE_KEY_SOUND, soundEnabled);
      updateSoundBtnUI();
      if (soundEnabled) SoundEngine.playAdd();
      showToast(soundEnabled ? 'Sound feedback enabled' : 'Sound feedback muted', 'info');
    });

    // 12.3 Live Clock & Date in Header
    function updateClock() {
      const now = new Date();
      const dateDisplay = document.getElementById('currentDateDisplay');
      const timeDisplay = document.getElementById('currentTimeDisplay');
      if (dateDisplay) {
        dateDisplay.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }
      if (timeDisplay) {
        timeDisplay.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
    }
    updateClock();
    setInterval(updateClock, 1000);

    // 12.4 Quick Task Creator
    const quickForm = document.getElementById('quickTaskForm');
    const expandBtn = document.getElementById('expandCreatorBtn');
    const detailsDrawer = document.getElementById('creatorDetailsDrawer');
    const priorityPills = document.querySelectorAll('#creatorPrioritySelector .priority-pill');
    let selectedPriority = 'medium';

    expandBtn.addEventListener('click', () => {
      const isExpanded = detailsDrawer.classList.toggle('expanded');
      expandBtn.classList.toggle('expanded', isExpanded);
    });

    priorityPills.forEach(pill => {
      pill.addEventListener('click', () => {
        priorityPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        selectedPriority = pill.dataset.priority;
      });
    });

    // Quick Date Chips in Creator
    document.querySelectorAll('.chip-date').forEach(chip => {
      chip.addEventListener('click', () => {
        const offset = parseInt(chip.dataset.days, 10);
        document.getElementById('creatorDueDateInput').value = getRelativeDateString(offset);
      });
    });

    // Subtask Creator List
    const subInput = document.getElementById('newSubtaskInput');
    const addSubBtn = document.getElementById('addSubtaskBtn');
    const subList = document.getElementById('creatorSubtaskList');

    function renderCreatorSubtasks() {
      subList.innerHTML = '';
      creatorSubtasksList.forEach((sub, idx) => {
        const li = document.createElement('li');
        li.className = 'subtask-chip';
        li.innerHTML = `
          <span>${escapeHtml(sub.title)}</span>
          <button type="button" class="subtask-remove-btn" title="Remove step">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        `;
        li.querySelector('.subtask-remove-btn').addEventListener('click', () => {
          creatorSubtasksList.splice(idx, 1);
          renderCreatorSubtasks();
        });
        subList.appendChild(li);
      });
    }

    function addCreatorSubtask() {
      const text = subInput.value.trim();
      if (!text) return;
      creatorSubtasksList.push({
        id: 'sub-' + Date.now(),
        title: text,
        completed: false
      });
      subInput.value = '';
      renderCreatorSubtasks();
    }

    addSubBtn.addEventListener('click', addCreatorSubtask);
    subInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCreatorSubtask();
      }
    });

    // Form Submit
    quickForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('taskInputTitle');
      const notesInput = document.getElementById('taskInputNotes');
      const categorySelect = document.getElementById('creatorCategorySelect');
      const dueDateInput = document.getElementById('creatorDueDateInput');

      addTask(
        titleInput.value,
        notesInput.value,
        selectedPriority,
        categorySelect.value,
        dueDateInput.value,
        creatorSubtasksList
      );

      // Reset Form
      titleInput.value = '';
      notesInput.value = '';
      dueDateInput.value = '';
      creatorSubtasksList = [];
      renderCreatorSubtasks();

      if (detailsDrawer.classList.contains('expanded')) {
        detailsDrawer.classList.remove('expanded');
        expandBtn.classList.remove('expanded');
      }
    });

    // 12.5 View Switcher Tabs (List / Kanban)
    const viewListBtn = document.getElementById('viewListBtn');
    const viewBoardBtn = document.getElementById('viewBoardBtn');
    const listViewContainer = document.getElementById('listViewContainer');
    const boardViewContainer = document.getElementById('boardViewContainer');

    function switchView(viewName) {
      currentView = viewName;
      if (viewName === 'list') {
        viewListBtn.classList.add('active');
        viewListBtn.setAttribute('aria-selected', 'true');
        viewBoardBtn.classList.remove('active');
        viewBoardBtn.setAttribute('aria-selected', 'false');
        listViewContainer.classList.remove('hidden');
        boardViewContainer.classList.add('hidden');
      } else {
        viewBoardBtn.classList.add('active');
        viewBoardBtn.setAttribute('aria-selected', 'true');
        viewListBtn.classList.remove('active');
        viewListBtn.setAttribute('aria-selected', 'false');
        boardViewContainer.classList.remove('hidden');
        listViewContainer.classList.add('hidden');
      }
      render();
    }

    viewListBtn.addEventListener('click', () => switchView('list'));
    viewBoardBtn.addEventListener('click', () => switchView('board'));

    // 12.6 Filter Chips
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentFilter = chip.dataset.filter;
        render();
      });
    });

    // 12.7 Category Select Filter
    const categorySelect = document.getElementById('categoryFilterSelect');
    categorySelect.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      render();
    });

    // 12.8 Sort Select
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      render();
    });

    // 12.9 Search Input
    const searchInput = document.getElementById('searchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');

    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      searchClearBtn.classList.toggle('hidden', !currentSearchQuery);
      render();
    });

    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      currentSearchQuery = '';
      searchClearBtn.classList.add('hidden');
      render();
      searchInput.focus();
    });

    // 12.10 Group Actions: Clear Completed, Toggle Subtasks
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    if (clearCompletedBtn) {
      clearCompletedBtn.addEventListener('click', clearAllCompleted);
    }

    const collapseAllBtn = document.getElementById('collapseAllBtn');
    let allSubtasksVisible = true;
    if (collapseAllBtn) {
      collapseAllBtn.addEventListener('click', () => {
        allSubtasksVisible = !allSubtasksVisible;
        document.querySelectorAll('.task-subtasks-container').forEach(el => {
          el.classList.toggle('hidden', !allSubtasksVisible);
        });
      });
    }

    const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');
    if (emptyStateAddBtn) {
      emptyStateAddBtn.addEventListener('click', () => {
        const titleInput = document.getElementById('taskInputTitle');
        if (titleInput) {
          titleInput.focus();
          titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }

    // 12.11 Edit Modal Handlers
    const editForm = document.getElementById('editTaskForm');
    const closeEditBtn = document.getElementById('closeEditModalBtn');
    const cancelEditBtn = document.getElementById('cancelEditModalBtn');
    const editPriorityPills = document.querySelectorAll('#editPrioritySelector .priority-pill');
    let editSelectedPriority = 'medium';

    editPriorityPills.forEach(pill => {
      pill.addEventListener('click', () => {
        editPriorityPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        editSelectedPriority = pill.dataset.priority;
      });
    });

    closeEditBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);

    // Add subtask inside edit modal
    const editSubInput = document.getElementById('editNewSubtaskInput');
    const editAddSubBtn = document.getElementById('editAddSubtaskBtn');

    function addEditModalSubtask() {
      const text = editSubInput.value.trim();
      if (!text) return;
      editModalSubtasksList.push({
        id: 'sub-' + Date.now(),
        title: text,
        completed: false
      });
      editSubInput.value = '';
      renderEditModalSubtasks();
    }

    editAddSubBtn.addEventListener('click', addEditModalSubtask);
    editSubInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addEditModalSubtask();
      }
    });

    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const taskId = document.getElementById('editTaskId').value;
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      task.title = document.getElementById('editTaskTitle').value.trim();
      task.notes = document.getElementById('editTaskNotes').value.trim();
      task.priority = editSelectedPriority;
      task.status = document.getElementById('editStatusSelect').value;
      task.category = document.getElementById('editCategorySelect').value;
      task.dueDate = document.getElementById('editDueDateInput').value;
      task.subtasks = [...editModalSubtasksList];

      saveTasksToStorage();
      render();
      closeEditModal();
      SoundEngine.playPop();
      showToast('Task updated!', 'success');
    });

    // 12.12 Shortcuts Modal
    const shortcutsBtn = document.getElementById('shortcutsBtn');
    const shortcutsModal = document.getElementById('shortcutsModalBackdrop');
    const closeShortcutsBtn = document.getElementById('closeShortcutsBtn');

    function openShortcutsModal() {
      shortcutsModal.classList.remove('hidden');
    }
    function closeShortcutsModal() {
      shortcutsModal.classList.add('hidden');
    }

    shortcutsBtn.addEventListener('click', openShortcutsModal);
    closeShortcutsBtn.addEventListener('click', closeShortcutsModal);

    // 12.13 Data Menu (Export / Import / Reset)
    const dataMenuBtn = document.getElementById('dataMenuBtn');
    const dataDropdown = document.getElementById('dataDropdownMenu');
    const exportBtn = document.getElementById('exportDataBtn');
    const importInput = document.getElementById('importFileInput');
    const resetSampleBtn = document.getElementById('resetSampleDataBtn');

    dataMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dataDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!dataDropdown.contains(e.target) && e.target !== dataMenuBtn) {
        dataDropdown.classList.remove('active');
      }
    });

    // Export JSON
    exportBtn.addEventListener('click', () => {
      dataDropdown.classList.remove('active');
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `taskflow-backup-${getRelativeDateString(0)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Backup JSON exported successfully!', 'success');
    });

    // Import JSON
    importInput.addEventListener('change', (e) => {
      dataDropdown.classList.remove('active');
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (Array.isArray(parsed)) {
            tasks = parsed;
            saveTasksToStorage();
            render();
            showToast(`Imported ${parsed.length} tasks from backup!`, 'success');
          } else {
            showToast('Invalid backup file format.', 'danger');
          }
        } catch (err) {
          showToast('Failed to parse JSON file.', 'danger');
        }
      };
      reader.readAsText(file);
      importInput.value = '';
    });

    // Clear All Tasks button in Data menu
    const clearAllTasksBtn = document.getElementById('clearAllTasksBtn');
    if (clearAllTasksBtn) {
      clearAllTasksBtn.addEventListener('click', () => {
        dataDropdown.classList.remove('active');
        if (confirm('Clear all tasks? This will return to a clean empty state.')) {
          clearAllTasks();
        }
      });
    }

    // Reset to Sample Demo Tasks
    resetSampleBtn.addEventListener('click', () => {
      dataDropdown.classList.remove('active');
      if (confirm('Load demo sample tasks? (This will replace existing tasks with sample data)')) {
        tasks = JSON.parse(JSON.stringify(SAMPLE_TASKS));
        saveTasksToStorage();
        render();
        SoundEngine.playSuccess();
        showToast('Demo sample tasks loaded!', 'info');
      }
    });

    // 12.14 Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement.tagName.toLowerCase();
      const isInputActive = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // Escape closes open modals & menus
      if (e.key === 'Escape') {
        closeEditModal();
        closeShortcutsModal();
        dataDropdown.classList.remove('active');
        const drawer = document.getElementById('creatorDetailsDrawer');
        if (drawer.classList.contains('expanded')) {
          drawer.classList.remove('expanded');
          expandBtn.classList.remove('expanded');
        }
        return;
      }

      // If typing inside an input, don't trigger global navigation keys
      if (isInputActive) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        document.getElementById('taskInputTitle').focus();
      } else if (e.key === '/') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        switchView(currentView === 'list' ? 'board' : 'list');
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        themeToggleBtn.click();
      } else if (e.key === '?') {
        e.preventDefault();
        openShortcutsModal();
      }
    });

    // Initialize Kanban Drop zones and initial render
    setupKanbanDropZones();
    Confetti.init();
    render();
  }

  // Kickstart Application
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
