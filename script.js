'use strict';

// ============================================================
// ALEX ACADEMY ECOSYSTEM — SCRIPT.JS
// ============================================================

// ============================================================
// SCHEDULE DATA
// ============================================================
const SCHEDULE_DATA = [
  {
    id: 'mon-1',
    day: 1, // Monday
    subject: 'Sejarah dan Memori',
    startTime: '13:00',
    endTime: '15:30',
    location: 'FAH 4.17',
    lecturer: 'Ilyas, M.Hum',
    sks: 3
  },
  {
    id: 'tue-1',
    day: 2,
    subject: 'Sejarah Gender',
    startTime: '07:30',
    endTime: '09:10',
    location: 'FAH 4.10',
    lecturer: 'Dr. Hj. Tati Hartimah, MA',
    sks: 2
  },
  {
    id: 'tue-2',
    day: 2,
    subject: 'Sejarah Publik',
    startTime: '10:01',
    endTime: '12:40',
    location: 'FAH 4.16',
    lecturer: 'Prof. Drs. H. Amirul Hadi, M.A., Ph.D.',
    sks: 3
  },
  {
    id: 'wed-1',
    day: 3,
    subject: 'Naskah-Naskah Islam Nusantara',
    startTime: '13:00',
    endTime: '16:20',
    location: 'FAH 4.15',
    lecturer: 'Saiful Umam, M.A., Ph.D.',
    sks: 4
  },
  {
    id: 'thu-1',
    day: 4,
    subject: 'Sejarah Keseharian',
    startTime: '07:30',
    endTime: '09:10',
    location: 'FAH 4.16',
    lecturer: 'Dr. Awalia Rahma, MA',
    sks: 2
  },
  {
    id: 'thu-2',
    day: 4,
    subject: 'Sejarah Digital',
    startTime: '13:00',
    endTime: '14:40',
    location: 'FAH 4.10',
    lecturer: 'Faizal Arifin M.Hum',
    sks: 2
  }
];

const DAY_NAMES_ID = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const DAY_NAMES_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

// ============================================================
// STORAGE MANAGER
// ============================================================
const StorageManager = {
  get(key, def = null) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : def;
    } catch { return def; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },
  clear() {
    try { localStorage.clear(); } catch {}
  }
};

// ============================================================
// TEMPORAL ENGINE
// ============================================================
const TemporalEngine = {
  now() { return new Date(); },
  toMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  },
  formatTime(date) {
    return date.toTimeString().slice(0, 8);
  },
  formatDate(date) {
    const d = DAY_NAMES_ID[date.getDay()];
    const t = date.getDate();
    const m = MONTH_NAMES_ID[date.getMonth()];
    const y = date.getFullYear();
    return `${d}, ${t} ${m} ${y}`;
  },
  pad(n) { return String(n).padStart(2, '0'); },
  formatCountdown(totalSeconds) {
    if (totalSeconds <= 0) return '00h 00m 00s';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${this.pad(h)}h ${this.pad(m)}m ${this.pad(s)}s`;
  }
};

// ============================================================
// SCHEDULE ENGINE
// ============================================================
const ScheduleEngine = {
  getTodayClasses(date) {
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon...
    return SCHEDULE_DATA.filter(c => c.day === dayOfWeek)
      .sort((a, b) => TemporalEngine.toMinutes(a.startTime) - TemporalEngine.toMinutes(b.startTime));
  },
  getWeekClasses() {
    const result = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    SCHEDULE_DATA.forEach(c => {
      if (result[c.day]) result[c.day].push(c);
    });
    return result;
  },
  getClassStatus(cls, date) {
    const now = date.getHours() * 60 + date.getMinutes();
    const start = TemporalEngine.toMinutes(cls.startTime);
    const end = TemporalEngine.toMinutes(cls.endTime);
    if (now >= start && now < end) return 'ongoing';
    if (now >= end) return 'done';
    return 'upcoming';
  },
  getNextClass(date) {
    const dayOfWeek = date.getDay();
    const nowMinutes = date.getHours() * 60 + date.getMinutes() * 1 + date.getSeconds() / 60;

    // Check remaining classes today
    const todayClasses = this.getTodayClasses(date);
    for (const cls of todayClasses) {
      const startMin = TemporalEngine.toMinutes(cls.startTime);
      const endMin = TemporalEngine.toMinutes(cls.endTime);
      if (nowMinutes < endMin) {
        return { cls, isToday: true, isOngoing: nowMinutes >= startMin };
      }
    }

    // Look ahead up to 7 days
    for (let offset = 1; offset <= 7; offset++) {
      const futureDay = (dayOfWeek + offset) % 7;
      const futureDayClasses = SCHEDULE_DATA.filter(c => c.day === futureDay)
        .sort((a, b) => TemporalEngine.toMinutes(a.startTime) - TemporalEngine.toMinutes(b.startTime));
      if (futureDayClasses.length > 0) {
        return { cls: futureDayClasses[0], isToday: false, isOngoing: false, daysAhead: offset };
      }
    }
    return null;
  },
  getCountdownSeconds(cls, date, isToday, daysAhead = 0) {
    const targetDate = new Date(date);
    if (daysAhead) targetDate.setDate(targetDate.getDate() + daysAhead);
    const [h, m] = cls.startTime.split(':').map(Number);
    const targetSec = h * 3600 + m * 60;
    const nowSec = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
    let diff;
    if (isToday || daysAhead === 0) {
      diff = targetSec - nowSec;
    } else {
      diff = (daysAhead * 86400) - (nowSec - targetSec) - 86400;
      // simpler: just days * 86400 + target offset - current offset
      const daySeconds = daysAhead * 86400;
      diff = daySeconds + targetSec - nowSec;
    }
    return Math.max(0, Math.floor(diff));
  },
  getTotalSKS() {
    return SCHEDULE_DATA.reduce((sum, c) => sum + c.sks, 0);
  },
  getTodayDuration(date) {
    const todayClasses = this.getTodayClasses(date);
    let total = 0;
    todayClasses.forEach(c => {
      total += TemporalEngine.toMinutes(c.endTime) - TemporalEngine.toMinutes(c.startTime);
    });
    return total;
  },
  getWeeklyDuration() {
    let total = 0;
    SCHEDULE_DATA.forEach(c => {
      total += TemporalEngine.toMinutes(c.endTime) - TemporalEngine.toMinutes(c.startTime);
    });
    return total;
  }
};

// ============================================================
// THEME ENGINE
// ============================================================
const ThemeEngine = {
  currentTheme: null,
  apply(date) {
    const hour = date.getHours();
    let theme;
    if (hour >= 5 && hour < 12) theme = 'theme-morning';
    else if (hour >= 12 && hour < 18) theme = '';
    else theme = 'theme-deep-space';

    if (theme !== this.currentTheme) {
      document.body.classList.remove('theme-morning', 'theme-deep-space');
      if (theme) document.body.classList.add(theme);
      this.currentTheme = theme;
    }
  }
};

// ============================================================
// REMINDER ENGINE
// ============================================================
const ReminderEngine = {
  notifPermission: false,
  init() {
    this.checkMidnightReset();
    if ('Notification' in window && Notification.permission === 'granted') {
      this.notifPermission = true;
    }
  },
  async requestPermission() {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    this.notifPermission = perm === 'granted';
  },
  checkMidnightReset() {
    const lastReset = StorageManager.get('lastReminderReset', '');
    const today = new Date().toDateString();
    if (lastReset !== today) {
      StorageManager.set('reminderFlags', {});
      StorageManager.set('lastReminderReset', today);
    }
  },
  shouldFire(key) {
    const flags = StorageManager.get('reminderFlags', {});
    return !flags[key];
  },
  markFired(key) {
    const flags = StorageManager.get('reminderFlags', {});
    flags[key] = true;
    StorageManager.set('reminderFlags', flags);
  },
  check(date) {
    this.checkMidnightReset();
    const nowMinutes = date.getHours() * 60 + date.getMinutes();
    const todayClasses = ScheduleEngine.getTodayClasses(date);

    todayClasses.forEach(cls => {
      const startMin = TemporalEngine.toMinutes(cls.startTime);
      const diff = startMin - nowMinutes;

      if (diff > 0 && diff <= 60 && diff > 55) {
        const key = `${cls.id}-60`;
        if (this.shouldFire(key)) {
          this.markFired(key);
          this.sendReminder(cls, 60);
        }
      }
      if (diff > 0 && diff <= 10 && diff > 5) {
        const key = `${cls.id}-10`;
        if (this.shouldFire(key)) {
          this.markFired(key);
          this.sendReminder(cls, 10);
        }
      }
    });
  },
  sendReminder(cls, minutesBefore) {
    const msg = `${cls.subject} in ${minutesBefore} minutes`;
    const body = `${cls.startTime} · ${cls.location}`;

    if (this.notifPermission && !document.hidden) {
      try {
        new Notification(msg, { body, icon: '' });
      } catch {}
    }

    UIRenderer.showToast(msg, body, 'warning', 8000);
  }
};

// ============================================================
// FOCUS ENGINE
// ============================================================
const FocusEngine = {
  duration: 50 * 60,
  remaining: 50 * 60,
  total: 50 * 60,
  running: false,
  paused: false,
  interval: null,
  circumference: 2 * Math.PI * 88,

  init() {
    this.circumference = 2 * Math.PI * 88;
    const ring = document.getElementById('focus-ring-prog');
    if (ring) ring.style.strokeDasharray = this.circumference;
  },

  setDuration(minutes) {
    if (this.running) return;
    this.duration = minutes * 60;
    this.remaining = this.duration;
    this.total = this.duration;
    this.updateDisplay();
  },

  start() {
    this.running = true;
    this.paused = false;
    document.getElementById('focus-start-btn').classList.add('hidden');
    document.getElementById('focus-pause-btn').classList.remove('hidden');
    document.getElementById('focus-end-btn').classList.remove('hidden');
    document.getElementById('focus-duration-select').style.opacity = '0.3';
    document.getElementById('focus-duration-select').style.pointerEvents = 'none';
    document.getElementById('focus-state-label').textContent = 'In Progress';

    document.getElementById('focus-overlay').classList.remove('hidden');
    document.getElementById('view-focus').style.position = 'relative';
    document.getElementById('view-focus').style.zIndex = '51';

    this.interval = setInterval(() => {
      if (!this.paused) {
        this.remaining--;
        this.updateDisplay();
        if (this.remaining <= 0) this.complete();
      }
    }, 1000);
  },

  pause() {
    this.paused = !this.paused;
    const btn = document.getElementById('focus-pause-btn');
    btn.textContent = this.paused ? 'Resume' : 'Pause';
    document.getElementById('focus-state-label').textContent = this.paused ? 'Paused' : 'In Progress';
  },

  end() {
    if (this.interval) clearInterval(this.interval);
    this.running = false;
    this.paused = false;
    this.remaining = this.duration;
    this.total = this.duration;
    this.updateDisplay();
    this.resetUI();
  },

  complete() {
    clearInterval(this.interval);
    this.running = false;

    const minutes = this.duration / 60;
    const sessions = StorageManager.get('focusSessions', []);
    sessions.unshift({
      duration: minutes,
      date: new Date().toLocaleDateString('id-ID'),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    });
    if (sessions.length > 50) sessions.splice(50);
    StorageManager.set('focusSessions', sessions);

    const totalMinutes = StorageManager.get('totalFocusMinutes', 0) + minutes;
    StorageManager.set('totalFocusMinutes', totalMinutes);

    this.resetUI();
    UIRenderer.showToast('Focus Session Complete', `${minutes} minute session saved.`, 'success', 6000);
    UIRenderer.renderFocusHistory();
    UIRenderer.updateMetrics();
  },

  resetUI() {
    document.getElementById('focus-start-btn').classList.remove('hidden');
    document.getElementById('focus-pause-btn').classList.add('hidden');
    document.getElementById('focus-end-btn').classList.add('hidden');
    document.getElementById('focus-pause-btn').textContent = 'Pause';
    document.getElementById('focus-duration-select').style.opacity = '';
    document.getElementById('focus-duration-select').style.pointerEvents = '';
    document.getElementById('focus-state-label').textContent = 'Ready';
    document.getElementById('focus-overlay').classList.add('hidden');
    document.getElementById('view-focus').style.position = '';
    document.getElementById('view-focus').style.zIndex = '';
  },

  updateDisplay() {
    const h = Math.floor(this.remaining / 3600);
    const m = Math.floor((this.remaining % 3600) / 60);
    const s = this.remaining % 60;
    let display;
    if (h > 0) {
      display = `${TemporalEngine.pad(h)}:${TemporalEngine.pad(m)}:${TemporalEngine.pad(s)}`;
    } else {
      display = `${TemporalEngine.pad(m)}:${TemporalEngine.pad(s)}`;
    }

    const el = document.getElementById('focus-time-display');
    if (el) el.textContent = display;

    // Ring update
    const ring = document.getElementById('focus-ring-prog');
    if (ring) {
      const progress = this.remaining / this.total;
      const offset = this.circumference * (1 - progress);
      ring.style.strokeDashoffset = offset;

      // Color transition based on remaining
      if (this.remaining < this.total * 0.25) {
        ring.style.stroke = '#fc8181';
      } else if (this.remaining < this.total * 0.5) {
        ring.style.stroke = '#f6ad55';
      } else {
        ring.style.stroke = '#63b3ed';
      }
    }
  }
};

// ============================================================
// MODAL ENGINE
// ============================================================
const ModalEngine = {
  currentSubject: null,
  saveTimeout: null,

  open(cls) {
    this.currentSubject = cls;
    document.getElementById('modal-subject-name').textContent = cls.subject;
    document.getElementById('modal-meta').innerHTML = `
      <span>⏱ ${cls.startTime} – ${cls.endTime}</span>
      <span>⊡ ${cls.location}</span>
      <span>◈ ${cls.sks} SKS</span>
      <span>✦ ${cls.lecturer}</span>
    `;

    const notes = StorageManager.get(`notes-${cls.id}`, '');
    const textarea = document.getElementById('notes-textarea');
    textarea.value = notes;
    this.updateNoteStats(notes);

    document.getElementById('notes-saved').textContent = notes ? 'Saved' : 'Not saved';
    document.getElementById('notes-saved').className = 'notes-saved' + (notes ? ' saved' : '');

    document.getElementById('modal-overlay').classList.remove('hidden');
    setTimeout(() => textarea.focus(), 300);
  },

  close() {
    document.getElementById('modal-overlay').classList.add('hidden');
    this.currentSubject = null;
  },

  saveNotes(text) {
    if (!this.currentSubject) return;
    StorageManager.set(`notes-${this.currentSubject.id}`, text);
    document.getElementById('notes-saved').textContent = `Saved · ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    document.getElementById('notes-saved').className = 'notes-saved saved';
    UIRenderer.updateMetrics();
  },

  updateNoteStats(text) {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const readMin = Math.max(1, Math.ceil(words / 200));
    const chars = text.length;
    document.getElementById('notes-stats').textContent = `${words} words · ~${readMin} min read`;
    document.getElementById('notes-chars').textContent = `${chars} chars`;
  }
};

// ============================================================
// ENERGY STATE ENGINE
// ============================================================
const EnergyEngine = {
  lastUpdate: 0,
  messages: {
    earlyMorning: [
      'The day begins. Your earliest thoughts often carry the most clarity.',
      'Pre-dawn hours belong to those who prepare deliberately.',
      'Quiet mornings are an academic privilege. Use them well.'
    ],
    morning: [
      'Morning cognition is at peak potential. Engage with difficulty.',
      'The schedule ahead is structured. Move through it with intention.',
      'Good mornings are not accidental — they are architected.'
    ],
    midday: [
      'Midday brings a natural transition. Sustain your focus through it.',
      'You are mid-session. The work continues.',
      'The afternoon is not a retreat. It is continuation.'
    ],
    afternoon: [
      'Afternoon clarity is earned, not given. Stay in the work.',
      'The second half of the day still holds significant capacity.',
      'Maintain your intellectual posture through the afternoon.'
    ],
    evening: [
      'Evening is for consolidation. Review what the day has taught.',
      'The day\'s learning settles during evening reflection.',
      'Diminish the noise. The evening rewards quiet focus.'
    ],
    night: [
      'Deep night favors sustained, uninterrupted thinking.',
      'The rest of the world has quieted. The academic work continues.',
      'Night sessions require intention. Guard your energy carefully.'
    ]
  },

  getMessage(date) {
    const hour = date.getHours();
    let pool;
    if (hour < 5) pool = this.messages.night;
    else if (hour < 9) pool = this.messages.earlyMorning;
    else if (hour < 12) pool = this.messages.morning;
    else if (hour < 14) pool = this.messages.midday;
    else if (hour < 18) pool = this.messages.afternoon;
    else if (hour < 21) pool = this.messages.evening;
    else pool = this.messages.night;

    const idx = Math.floor(date.getMinutes() / 20) % pool.length;
    return pool[idx];
  },

  update(date) {
    const now = date.getTime();
    if (now - this.lastUpdate < 300000 && this.lastUpdate !== 0) return;
    this.lastUpdate = now;

    const msg = this.getMessage(date);
    const el = document.getElementById('energy-message');
    const badge = document.getElementById('energy-badge');
    const timeEl = document.getElementById('energy-update-time');

    if (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      setTimeout(() => {
        el.textContent = msg;
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        el.style.opacity = '';
        el.style.transform = '';
      }, 300);
    }

    if (badge) badge.textContent = msg.split(' ').slice(0, 5).join(' ') + '…';
    if (timeEl) timeEl.textContent = `Updated · ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  }
};

// ============================================================
// UI RENDERER
// ============================================================
const UIRenderer = {

  renderTemporal(date) {
    const timeStr = `${TemporalEngine.pad(date.getHours())}:${TemporalEngine.pad(date.getMinutes())}:${TemporalEngine.pad(date.getSeconds())}`;
    const dateStr = TemporalEngine.formatDate(date);

    // Top bar
    this.setTextSafe('temporal-time', timeStr);
    this.setTextSafe('temporal-date', DAY_NAMES_ID[date.getDay()] + ', ' + date.getDate() + ' ' + MONTH_NAMES_ID[date.getMonth()]);

    // Card
    this.setTextSafe('temporal-big-time', timeStr);
    this.setTextSafe('temporal-big-date', dateStr);
    this.setTextSafe('t-hari', DAY_NAMES_ID[date.getDay()]);
    this.setTextSafe('t-tanggal', String(date.getDate()));
    this.setTextSafe('t-bulan', MONTH_NAMES_ID[date.getMonth()]);
    this.setTextSafe('t-tahun', String(date.getFullYear()));
  },

  renderNextClass(date) {
    const next = ScheduleEngine.getNextClass(date);

    if (!next) {
      this.setTextSafe('next-class-subject', 'Tidak ada kelas tersisa');
      this.setTextSafe('next-class-meta', '—');
      this.setTextSafe('next-class-countdown', '—');
      this.setTextSafe('next-class-location', '—');
      return;
    }

    const { cls, isOngoing, isToday, daysAhead } = next;

    this.setTextSafe('next-class-subject', cls.subject);
    this.setTextSafe('next-class-meta', `${cls.startTime} – ${cls.endTime} · ${cls.lecturer}`);
    this.setTextSafe('next-class-location', `${cls.location} · ${cls.sks} SKS`);

    if (isOngoing) {
      this.setTextSafe('next-class-countdown', 'In Progress');
      const el = document.getElementById('next-class-countdown');
      if (el) el.style.color = '#68d391';

      // Progress bar
      const startMin = TemporalEngine.toMinutes(cls.startTime);
      const endMin = TemporalEngine.toMinutes(cls.endTime);
      const nowMin = date.getHours() * 60 + date.getMinutes();
      const progress = ((nowMin - startMin) / (endMin - startMin)) * 100;
      const fill = document.getElementById('class-progress-fill');
      if (fill) fill.style.width = Math.min(100, progress) + '%';
    } else {
      const seconds = ScheduleEngine.getCountdownSeconds(cls, date, isToday, daysAhead || 0);
      this.setTextSafe('next-class-countdown', TemporalEngine.formatCountdown(seconds));
      const el = document.getElementById('next-class-countdown');
      if (el) el.style.color = '';
    }

    if (!isToday && daysAhead) {
      const dayName = DAY_NAMES_ID[(date.getDay() + daysAhead) % 7];
      const metaEl = document.getElementById('next-class-meta');
      if (metaEl) metaEl.textContent = `${dayName} · ${cls.startTime} – ${cls.endTime}`;
    }
  },

  renderTodaySchedule(date) {
    const container = document.getElementById('today-schedule-list');
    if (!container) return;

    const classes = ScheduleEngine.getTodayClasses(date);
    if (classes.length === 0) {
      container.innerHTML = '<div class="empty-state">Tidak ada kelas hari ini</div>';
      return;
    }

    container.innerHTML = classes.map(cls => {
      const status = ScheduleEngine.getClassStatus(cls, date);
      const statusClass = status === 'ongoing' ? 'ongoing' : status === 'done' ? 'done' : '';
      const ongoingDot = status === 'ongoing' ? '<div class="ongoing-dot"></div>' : '';
      return `
        <div class="schedule-item ${statusClass} ripple-container" data-id="${cls.id}">
          <div class="schedule-time-col">
            <div class="schedule-time">${cls.startTime}<br>${cls.endTime}</div>
          </div>
          <div class="schedule-info">
            <div class="schedule-subject">${cls.subject}</div>
            <div class="schedule-detail">${cls.location} · ${cls.lecturer}</div>
          </div>
          <div class="schedule-sks-badge">${cls.sks}K</div>
          ${ongoingDot}
        </div>
      `;
    }).join('');

    container.querySelectorAll('.schedule-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = el.dataset.id;
        const cls = SCHEDULE_DATA.find(c => c.id === id);
        if (cls) {
          UIRenderer.addRipple(el, e);
          ModalEngine.open(cls);
        }
      });
    });
  },

  renderWeeklyGrid() {
    const container = document.getElementById('weekly-grid');
    if (!container) return;
    const today = new Date().getDay();
    const weekData = ScheduleEngine.getWeekClasses();

    const dayMap = [
      { key: 1, name: 'Senin' },
      { key: 2, name: 'Selasa' },
      { key: 3, name: 'Rabu' },
      { key: 4, name: 'Kamis' },
      { key: 5, name: 'Jumat' }
    ];

    container.innerHTML = dayMap.map(({ key, name }) => {
      const classes = weekData[key] || [];
      const isToday = today === key;
      const classItems = classes.map(cls => `
        <div class="weekly-class-item ripple-container" data-id="${cls.id}">
          <div class="weekly-class-name">${cls.subject}</div>
          <div class="weekly-class-time">${cls.startTime} – ${cls.endTime}</div>
          <div class="weekly-class-room">${cls.location}</div>
        </div>
      `).join('') || '<div class="empty-state">—</div>';

      return `
        <div class="weekly-day ${isToday ? 'today' : ''}">
          <div class="weekly-day-header">${name}${isToday ? ' ·today' : ''}</div>
          <div class="weekly-day-content">${classItems}</div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.weekly-class-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = el.dataset.id;
        const cls = SCHEDULE_DATA.find(c => c.id === id);
        if (cls) {
          UIRenderer.addRipple(el, e);
          ModalEngine.open(cls);
        }
      });
    });
  },

  renderIntelligence(date) {
    const totalSKS = ScheduleEngine.getTotalSKS();
    const subjects = SCHEDULE_DATA.length;
    const todayMin = ScheduleEngine.getTodayDuration(date);
    const weekMin = ScheduleEngine.getWeeklyDuration();

    this.setTextSafe('intel-sks', String(totalSKS));
    this.setTextSafe('intel-subjects', String(subjects));
    this.setTextSafe('intel-today-hours', todayMin > 0 ? `${(todayMin / 60).toFixed(1)}j` : '0j');
    this.setTextSafe('intel-weekly-hours', `${(weekMin / 60).toFixed(1)}j`);
  },

  renderFocusHistory() {
    const container = document.getElementById('focus-history-list');
    if (!container) return;
    const sessions = StorageManager.get('focusSessions', []);
    if (sessions.length === 0) {
      container.innerHTML = '<div class="empty-state">No sessions recorded</div>';
      return;
    }
    container.innerHTML = sessions.slice(0, 20).map(s => `
      <div class="focus-history-item">
        <span class="fh-dur">${s.duration}m</span>
        <span class="fh-date">${s.date} ${s.time}</span>
      </div>
    `).join('');
  },

  updateMetrics() {
    const sessions = StorageManager.get('focusSessions', []);
    const totalMinutes = StorageManager.get('totalFocusMinutes', 0);
    const noteCount = SCHEDULE_DATA.filter(c => {
      const n = StorageManager.get(`notes-${c.id}`, '');
      return n.trim().length > 0;
    }).length;

    this.setTextSafe('metric-notes', String(noteCount));
    this.setTextSafe('metric-focus', String(sessions.length));
    this.setTextSafe('metric-hours', `${(totalMinutes / 60).toFixed(1)}h`);
    this.setTextSafe('metric-subjects-done', String(0));
  },

  showToast(title, body, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-title">${title}</div>
      ${body ? `<div class="toast-body">${body}</div>` : ''}
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  },

  setTextSafe(id, text) {
    const el = document.getElementById(id);
    if (el && el.textContent !== text) el.textContent = text;
  },

  addRipple(el, e) {
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  },

  revealCards() {
    const items = document.querySelectorAll('.reveal-item');
    items.forEach((el, i) => {
      setTimeout(() => el.classList.add('revealed'), i * 80 + 100);
    });
  }
};

// ============================================================
// BOOT SEQUENCE
// ============================================================
const BootSequence = {
  lines: [
    'Initializing Academic Core...',
    'Loading Schedule Matrix...',
    'Synchronizing Temporal Engine...',
    'Verifying Identity...',
  ],
  currentLine: 0,
  currentChar: 0,
  textEl: null,
  onComplete: null,

  start(onComplete) {
    this.onComplete = onComplete;
    this.textEl = document.getElementById('boot-text');
    this.createStars();
    setTimeout(() => this.typeLine(), 600);
  },

  createStars() {
    const container = document.getElementById('boot-starfield');
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 150; i++) {
      const star = document.createElement('div');
      star.className = 'boot-star';
      const size = Math.random() * 2 + 0.5;
      star.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        --dur: ${2 + Math.random() * 4}s;
        --delay: ${-Math.random() * 4}s;
        --op-min: ${0.05 + Math.random() * 0.2};
        --op-max: ${0.4 + Math.random() * 0.6};
      `;
      fragment.appendChild(star);
    }
    container.appendChild(fragment);
  },

  typeLine() {
    if (this.currentLine >= this.lines.length) {
      setTimeout(() => this.finishBoot(), 700);
      return;
    }

    const line = this.lines[this.currentLine];
    if (this.currentChar <= line.length) {
      if (this.textEl) this.textEl.textContent = line.slice(0, this.currentChar);
      this.currentChar++;
      const delay = 40 + Math.random() * 60;
      setTimeout(() => this.typeLine(), delay);
    } else {
      this.currentChar = 0;
      this.currentLine++;
      setTimeout(() => {
        if (this.textEl) this.textEl.textContent = '';
        setTimeout(() => this.typeLine(), 200);
      }, 700);
    }
  },

  finishBoot() {
    const bootScreen = document.getElementById('boot-screen');
    bootScreen.style.transition = 'opacity 1s ease, filter 1s ease';
    bootScreen.style.opacity = '0';
    bootScreen.style.filter = 'blur(20px)';
    setTimeout(() => {
      bootScreen.classList.add('hidden');
      if (this.onComplete) this.onComplete();
    }, 1000);
  }
};

// ============================================================
// STARFIELD (MAIN OS)
// ============================================================
const Starfield = {
  canvas: null,
  ctx: null,
  stars: [],
  animFrame: null,

  init() {
    this.canvas = document.getElementById('starfield-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.createStars();
    this.animate();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.stars.length > 0) this.createStars();
  },

  createStars() {
    const count = Math.floor((window.innerWidth * window.innerHeight) / 8000);
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      size: Math.random() * 1.5 + 0.2,
      opacity: Math.random() * 0.4 + 0.05,
      speed: Math.random() * 0.15 + 0.02,
      twinkleSpeed: Math.random() * 0.005 + 0.001,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));
  },

  animate() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const t = performance.now() * 0.001;
    this.stars.forEach(star => {
      const twinkle = 0.5 + 0.5 * Math.sin(t * star.twinkleSpeed * 200 + star.twinkleOffset);
      const alpha = star.opacity * (0.4 + 0.6 * twinkle);
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 215, 255, ${alpha})`;
      ctx.fill();

      star.y -= star.speed * 0.1;
      if (star.y < 0) {
        star.y = this.canvas.height;
        star.x = Math.random() * this.canvas.width;
      }
    });

    this.animFrame = requestAnimationFrame(() => this.animate());
  }
};

// ============================================================
// APP CONTROLLER
// ============================================================
const App = {
  currentView: 'dashboard',
  tickInterval: null,
  energyInterval: null,

  init() {
    const hasBooted = StorageManager.get('hasBooted', false);
    const userName = StorageManager.get('userName', null);

    if (!hasBooted || !userName) {
      StorageManager.set('hasBooted', false);
      BootSequence.start(() => {
        this.showIdentityScreen();
      });
    } else {
      document.getElementById('boot-screen').classList.add('hidden');
      this.launchOS(userName);
    }
  },

  showIdentityScreen() {
    document.getElementById('identity-screen').classList.remove('hidden');
    const input = document.getElementById('name-input');
    const btn = document.getElementById('name-submit');
    const content = document.getElementById('id-content');

    setTimeout(() => input.focus(), 500);

    const submit = () => {
      const name = input.value.trim();
      if (!name) {
        input.style.borderColor = 'rgba(252,129,129,0.5)';
        setTimeout(() => input.style.borderColor = '', 1000);
        return;
      }

      StorageManager.set('userName', name);
      StorageManager.set('hasBooted', true);

      // Glitch effect
      const idScreen = document.getElementById('identity-screen');
      idScreen.style.transition = 'filter 0.8s ease, opacity 0.8s ease';
      idScreen.style.filter = 'blur(0)';

      let glitchCount = 0;
      const glitch = setInterval(() => {
        idScreen.style.filter = `blur(${Math.random() * 8}px) hue-rotate(${Math.random() * 90}deg)`;
        glitchCount++;
        if (glitchCount >= 6) {
          clearInterval(glitch);
          idScreen.style.filter = 'blur(20px)';
          idScreen.style.opacity = '0';
          setTimeout(() => {
            idScreen.classList.add('hidden');
            this.launchOS(name);
          }, 800);
        }
      }, 80);
    };

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') submit();
    });
  },

  launchOS(userName) {
    document.getElementById('main-os').classList.remove('hidden');
    Starfield.init();
    FocusEngine.init();
    ReminderEngine.init();

    // Set greeting
    const el = document.getElementById('hero-greeting');
    if (el) el.innerHTML = `Welcome back, <span class="name-highlight">${userName}</span>`;

    this.loadSettings();
    this.setupNavigation();
    this.setupSidePanel();
    this.setupModal();
    this.setupFocusMode();
    this.setupExportImport();
    this.setupSettings();
    this.setupFAB();

    // Initial renders
    const now = new Date();
    ThemeEngine.apply(now);
    UIRenderer.renderTemporal(now);
    UIRenderer.renderNextClass(now);
    UIRenderer.renderTodaySchedule(now);
    UIRenderer.renderIntelligence(now);
    UIRenderer.renderWeeklyGrid();
    UIRenderer.renderFocusHistory();
    UIRenderer.updateMetrics();
    EnergyEngine.update(now);

    // Reveal cards
    setTimeout(() => UIRenderer.revealCards(), 200);

    // Start tick
    this.tickInterval = setInterval(() => this.tick(), 1000);
  },

  tick() {
    const now = new Date();
    ThemeEngine.apply(now);
    UIRenderer.renderTemporal(now);
    UIRenderer.renderNextClass(now);
    UIRenderer.renderTodaySchedule(now);
    ReminderEngine.check(now);
    EnergyEngine.update(now);
  },

  setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.switchView(view);
        this.closeSidePanel();
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  },

  switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.add('active');
    this.currentView = viewName;
  },

  setupSidePanel() {
    const hamburger = document.getElementById('hamburger-btn');
    const overlay = document.getElementById('side-overlay');
    const panel = document.getElementById('side-panel');
    const closeBtn = document.getElementById('side-close');

    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      panel.classList.toggle('open');
      overlay.classList.toggle('visible');
    });

    [overlay, closeBtn].forEach(el => {
      el.addEventListener('click', () => this.closeSidePanel());
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.closeSidePanel();
        ModalEngine.close();
      }
    });
  },

  closeSidePanel() {
    document.getElementById('hamburger-btn').classList.remove('open');
    document.getElementById('side-panel').classList.remove('open');
    document.getElementById('side-overlay').classList.remove('visible');
  },

  setupModal() {
    document.getElementById('modal-close').addEventListener('click', () => ModalEngine.close());
    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target === document.getElementById('modal-overlay')) ModalEngine.close();
    });

    const textarea = document.getElementById('notes-textarea');
    textarea.addEventListener('input', () => {
      const text = textarea.value;
      ModalEngine.updateNoteStats(text);
      clearTimeout(ModalEngine.saveTimeout);
      ModalEngine.saveTimeout = setTimeout(() => ModalEngine.saveNotes(text), 1500);

      const savedEl = document.getElementById('notes-saved');
      if (savedEl) { savedEl.textContent = 'Saving...'; savedEl.className = 'notes-saved'; }
    });
  },

  setupFocusMode() {
    document.getElementById('focus-start-btn').addEventListener('click', () => {
      FocusEngine.start();
    });
    document.getElementById('focus-pause-btn').addEventListener('click', () => {
      FocusEngine.pause();
    });
    document.getElementById('focus-end-btn').addEventListener('click', () => {
      if (confirm('End focus session early?')) FocusEngine.end();
    });

    document.querySelectorAll('.dur-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (FocusEngine.running) return;
        document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        FocusEngine.setDuration(parseInt(btn.dataset.min));
      });
    });
  },

  setupFAB() {
    document.getElementById('focus-fab').addEventListener('click', () => {
      this.switchView('focus');
      document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.view === 'focus');
      });
    });
  },

  setupExportImport() {
    document.getElementById('export-btn').addEventListener('click', () => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = StorageManager.get(key);
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alex-academy-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      UIRenderer.showToast('Data Exported', 'Your academic data has been saved.', 'success');
    });

    document.getElementById('import-btn').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const data = JSON.parse(evt.target.result);
          Object.entries(data).forEach(([k, v]) => StorageManager.set(k, v));
          UIRenderer.showToast('Data Imported', 'Your data has been restored.', 'success');
          UIRenderer.updateMetrics();
          UIRenderer.renderFocusHistory();
        } catch {
          UIRenderer.showToast('Import Failed', 'Invalid file format.', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
      if (confirm('Reset all data? This cannot be undone.')) {
        StorageManager.clear();
        UIRenderer.showToast('System Reset', 'All data cleared. Rebooting...', 'error');
        setTimeout(() => location.reload(), 2000);
      }
    });
  },

  setupSettings() {
    const settings = [
      { id: 'setting-contrast', key: 'setting-high-contrast', cls: 'high-contrast' },
      { id: 'setting-fontsize', key: 'setting-large-text', cls: 'large-text' },
      { id: 'setting-motion', key: 'setting-reduce-motion', cls: 'reduce-motion' },
    ];

    settings.forEach(({ id, key, cls }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.checked = StorageManager.get(key, false);
      if (el.checked) document.body.classList.add(cls);

      el.addEventListener('change', () => {
        StorageManager.set(key, el.checked);
        document.body.classList.toggle(cls, el.checked);
      });
    });

    const notifToggle = document.getElementById('setting-notifications');
    if (notifToggle) {
      notifToggle.checked = StorageManager.get('setting-notifications', false);
      notifToggle.addEventListener('change', async () => {
        if (notifToggle.checked) {
          await ReminderEngine.requestPermission();
          StorageManager.set('setting-notifications', ReminderEngine.notifPermission);
          notifToggle.checked = ReminderEngine.notifPermission;
          if (!ReminderEngine.notifPermission) {
            UIRenderer.showToast('Permission Denied', 'Notifications could not be enabled.', 'error');
          }
        } else {
          StorageManager.set('setting-notifications', false);
        }
      });
    }
  },

  loadSettings() {
    if (StorageManager.get('setting-high-contrast', false)) document.body.classList.add('high-contrast');
    if (StorageManager.get('setting-large-text', false)) document.body.classList.add('large-text');
    if (StorageManager.get('setting-reduce-motion', false)) document.body.classList.add('reduce-motion');
  }
};

// ============================================================
// LAUNCH
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// PWA REGISTER
if ("serviceWorker" in navigator) {
navigator.serviceWorker.register("sw.js")
.then(() => console.log("PWA ready"))
.catch(() => console.log("PWA failed"));
}
