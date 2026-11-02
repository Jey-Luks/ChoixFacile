  /* ==========================================================================
   ChoixFacile — script.js
   Roulette de décisions : Canvas API, crypto.getRandomValues, LocalStorage,
   Web Audio API, i18n FR/ENG. Aucune dépendance externe.
   ========================================================================== */
'use strict';

/* --------------------------------------------------------------------------
   1. Utilitaires
   -------------------------------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const TAU = Math.PI * 2;
const POINTER_ANGLE = -Math.PI / 2;      // le pointeur fixe est placé en haut
const MAX_OPTIONS = 40;
const HISTORY_LIMIT = 50;
const STORAGE_KEY = 'choixfacile_state_v1';

const mod = (a, n) => ((a % n) + n) % n;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const escapeHtml = (str) => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

/* Icônes SVG inline (aucun emoji, aucune ressource externe) */
const ICON_PENCIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>';
const ICON_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
const ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

/* --------------------------------------------------------------------------
   2. Traductions FR / ENG
   -------------------------------------------------------------------------- */
const I18N = {
  fr: {
    'doc.title': 'ChoixFacile — Trop d\u2019hésitations ? Laisse la roulette décider.',
    'a11y.skip': 'Aller au contenu principal',
    'a11y.home': 'Aller à l\u2019accueil',
    'a11y.nav': 'Navigation principale',
    'a11y.wheelArea': 'Roulette',
    'nav.home': 'Accueil',
    'nav.history': 'Historique',
    'nav.settings': 'Paramètres',
    'panel.title': 'Mes choix',
    'panel.subtitle': 'Trop d\u2019hésitations ? Laisse la roulette décider.',
    'panel.category': 'Charger une catégorie prédéfinie',
    'category.placeholder': 'Choisir une catégorie…',
    'cat.restaurants': 'Restaurants',
    'cat.loisirs': 'Loisirs',
    'cat.etudes': 'Études',
    'cat.voyages': 'Voyages',
    'cat.sport': 'Sport',
    'cat.quotidien': 'Décisions quotidiennes',
    'panel.addLabel': 'Ajouter une option',
    'panel.inputPlaceholder': 'Ex. : Pizza',
    'buttons.add': 'Ajouter',
    'panel.list': 'Options',
    'panel.listEmpty': 'Aucune option pour le moment. Ajoutez-en ci-dessus.',
    'buttons.build': 'Construire la roue',
    'buttons.clearAll': 'Tout effacer',
    'panel.storageNote': 'Vos données sont conservées localement sur cet appareil, dans votre navigateur.',
    'wheel.spin': 'FAIRE TOURNER',
    'wheel.empty': 'Ajoutez des options pour construire la roue',
    'stats.options': 'possibilités',
    'stats.draws': 'tirages',
    'stats.last': 'Dernier résultat',
    'modal.title': 'Le choix gagnant !',
    'modal.again': 'Recommencer',
    'modal.close': 'Fermer',
    'modal.among': 'Choisi parmi {n} possibilités.',
    'confirm.yes': 'Confirmer',
    'confirm.no': 'Annuler',
    'history.title': 'Historique des tirages',
    'history.empty': 'Aucun tirage pour le moment. Lancez la roue et vos résultats apparaîtront ici.',
    'history.clear': 'Effacer tout',
    'settings.title': 'Paramètres',
    'settings.sound': 'Effets sonores',
    'settings.soundHint': 'Sons discrets lors des interactions et des tirages.',
    'settings.theme': 'Thème',
    'settings.light': 'Clair',
    'settings.dark': 'Sombre',
    'settings.palette': 'Palette de la roue',
    'palette.classique': 'Classique',
    'palette.pastel': 'Pastel',
    'palette.ocean': 'Océan',
    'settings.language': 'Langue',
    'settings.reset': 'Réinitialiser les paramètres',
    'settings.close': 'Fermer les paramètres',
    'a11y.edit': 'Modifier l\u2019option {v}',
    'a11y.delete': 'Supprimer l\u2019option {v}',
    'a11y.editInput': 'Nom de l\u2019option',
    'a11y.deleteDraw': 'Supprimer ce résultat',
    'edit.save': 'Enregistrer',
    'edit.cancel': 'Annuler',
    'toast.empty': 'Veuillez saisir une option avant d\u2019ajouter.',
    'toast.duplicate': 'Cette option existe déjà dans la liste.',
    'toast.added': '« {v} » a été ajouté à la roue.',
    'toast.updated': 'L\u2019option a été modifiée.',
    'toast.removed': '« {v} » a été supprimé.',
    'toast.cleared': 'Toutes les options ont été supprimées.',
    'toast.built': 'Roue actualisée : {v}.',
    'toast.loaded': 'Catégorie « {v} » chargée : {c}.',
    'toast.drawSaved': 'Résultat ajouté à l\u2019historique.',
    'toast.historyCleared': 'L\u2019historique a été effacé.',
    'toast.entryDeleted': 'Le résultat a été supprimé.',
    'toast.settingsReset': 'Les paramètres ont été réinitialisés.',
    'toast.storageError': 'Impossible d\u2019enregistrer : le stockage local est indisponible.',
    'toast.maxOptions': 'Limite de {n} options atteinte.',
    'toast.needOptions': 'Ajoutez au moins une option pour lancer la roue.',
    'confirm.replaceTitle': 'Charger cette catégorie ?',
    'confirm.replaceText': 'Votre liste actuelle ({v}) sera remplacée par la catégorie « {c} ». Voulez-vous continuer ?',
    'confirm.clearTitle': 'Tout effacer ?',
    'confirm.clearText': 'Toutes les options seront supprimées de la roue.',
    'confirm.historyTitle': 'Effacer l\u2019historique ?',
    'confirm.historyText': 'Tous les tirages enregistrés seront définitivement supprimés.',
    'confirm.resetTitle': 'Réinitialiser les paramètres ?',
    'confirm.resetText': 'Le thème, les sons, la palette et la langue reviendront à leurs valeurs par défaut.'
  },
  en: {
    'doc.title': 'ChoixFacile — Too many choices? Let the wheel decide.',
    'a11y.skip': 'Skip to main content',
    'a11y.home': 'Go to home',
    'a11y.nav': 'Main navigation',
    'a11y.wheelArea': 'Wheel',
    'nav.home': 'Home',
    'nav.history': 'History',
    'nav.settings': 'Settings',
    'panel.title': 'My choices',
    'panel.subtitle': 'Too many choices? Let the wheel decide.',
    'panel.category': 'Load a preset category',
    'category.placeholder': 'Choose a category…',
    'cat.restaurants': 'Restaurants',
    'cat.loisirs': 'Leisure',
    'cat.etudes': 'Studies',
    'cat.voyages': 'Travel',
    'cat.sport': 'Sport',
    'cat.quotidien': 'Daily decisions',
    'panel.addLabel': 'Add an option',
    'panel.inputPlaceholder': 'e.g. Pizza',
    'buttons.add': 'Add',
    'panel.list': 'Options',
    'panel.listEmpty': 'No options yet. Add one above.',
    'buttons.build': 'Build wheel',
    'buttons.clearAll': 'Clear all',
    'panel.storageNote': 'Your data is stored locally on this device, in your browser.',
    'wheel.spin': 'SPIN',
    'wheel.empty': 'Add options to build the wheel',
    'stats.options': 'options',
    'stats.draws': 'draws',
    'stats.last': 'Last result',
    'modal.title': 'The winning choice!',
    'modal.again': 'Spin again',
    'modal.close': 'Close',
    'modal.among': 'Picked from {n} options.',
    'confirm.yes': 'Confirm',
    'confirm.no': 'Cancel',
    'history.title': 'Draw history',
    'history.empty': 'No draws yet. Spin the wheel and your results will appear here.',
    'history.clear': 'Clear all',
    'settings.title': 'Settings',
    'settings.sound': 'Sound effects',
    'settings.soundHint': 'Subtle sounds for interactions and draws.',
    'settings.theme': 'Theme',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
    'settings.palette': 'Wheel palette',
    'palette.classique': 'Classic',
    'palette.pastel': 'Pastel',
    'palette.ocean': 'Ocean',
    'settings.language': 'Language',
    'settings.reset': 'Reset settings',
    'settings.close': 'Close settings',
    'a11y.edit': 'Edit option {v}',
    'a11y.delete': 'Delete option {v}',
    'a11y.editInput': 'Option name',
    'a11y.deleteDraw': 'Delete this result',
    'edit.save': 'Save',
    'edit.cancel': 'Cancel',
    'toast.empty': 'Please enter an option before adding.',
    'toast.duplicate': 'This option is already in the list.',
    'toast.added': '“{v}” has been added to the wheel.',
    'toast.updated': 'The option has been updated.',
    'toast.removed': '“{v}” has been removed.',
    'toast.cleared': 'All options have been removed.',
    'toast.built': 'Wheel updated: {v}.',
    'toast.loaded': 'Category “{v}” loaded: {c}.',
    'toast.drawSaved': 'Result added to history.',
    'toast.historyCleared': 'History has been cleared.',
    'toast.entryDeleted': 'The result has been deleted.',
    'toast.settingsReset': 'Settings have been reset.',
    'toast.storageError': 'Unable to save: local storage is unavailable.',
    'toast.maxOptions': 'Limit of {n} options reached.',
    'toast.needOptions': 'Add at least one option to spin the wheel.',
    'confirm.replaceTitle': 'Load this category?',
    'confirm.replaceText': 'Your current list ({v}) will be replaced by the “{c}” category. Continue?',
    'confirm.clearTitle': 'Clear everything?',
    'confirm.clearText': 'All options will be removed from the wheel.',
    'confirm.historyTitle': 'Clear history?',
    'confirm.historyText': 'All saved draws will be permanently deleted.',
    'confirm.resetTitle': 'Reset settings?',
    'confirm.resetText': 'Theme, sounds, palette and language will return to their default values.'
  }
};

function t(key, vars) {
  let s = I18N[state.lang][key] != null ? I18N[state.lang][key] : (I18N.fr[key] != null ? I18N.fr[key] : key);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split('{' + k + '}').join(String(v));
    }
  }
  return s;
}

function formatCount(n) {
  if (state.lang === 'fr') return n === 1 ? '1 choix' : n + ' choix';
  return n === 1 ? '1 choice' : n + ' choices';
}

function formatDraws(n) {
  if (state.lang === 'fr') return n > 1 ? n + ' tirages' : n + ' tirage';
  return n === 1 ? '1 draw' : n + ' draws';
}

/* --------------------------------------------------------------------------
   3. Catégories prédéfinies & palettes
   -------------------------------------------------------------------------- */
const CATEGORIES = {
  restaurants: {
    labelKey: 'cat.restaurants',
    items: {
      fr: ['Pizza', 'Sushi', 'Burger', 'Poulet', 'Poisson', 'Pâtes'],
      en: ['Pizza', 'Sushi', 'Burger', 'Chicken', 'Fish', 'Pasta']
    }
  },
  loisirs: {
    labelKey: 'cat.loisirs',
    items: {
      fr: ['Cinéma', 'Lecture', 'Jeux vidéo', 'Musique', 'Sport'],
      en: ['Cinema', 'Reading', 'Video games', 'Music', 'Sport']
    }
  },
  etudes: {
    labelKey: 'cat.etudes',
    items: {
      fr: ['Mathématiques', 'Français', 'Anglais', 'Sciences', 'Histoire'],
      en: ['Mathematics', 'French', 'English', 'Sciences', 'History']
    }
  },
  voyages: {
    labelKey: 'cat.voyages',
    items: {
      fr: ['Paris', 'Londres', 'Dubaï', 'Tokyo', 'Nairobi'],
      en: ['Paris', 'London', 'Dubai', 'Tokyo', 'Nairobi']
    }
  },
  sport: {
    labelKey: 'cat.sport',
    items: {
      fr: ['Football', 'Basketball', 'Tennis', 'Natation', 'Course'],
      en: ['Football', 'Basketball', 'Tennis', 'Swimming', 'Running']
    }
  },
  quotidien: {
    labelKey: 'cat.quotidien',
    items: {
      fr: ['Oui', 'Non', 'Peut-être'],
      en: ['Yes', 'No', 'Maybe']
    }
  }
};

/* Éléments de la catégorie dans la langue courante (repli : français) */
function categoryItems(cat) {
  return cat.items[state.lang] || cat.items.fr;
}

const PALETTES = {
  classique: ['#6C4CF1', '#3B82F6', '#EC4899', '#EF4444', '#F97316', '#FACC15', '#10B981', '#14B8A6'],
  pastel:    ['#A5B4FC', '#F9A8D4', '#FDE68A', '#BBF7D0', '#99F6E4', '#FCA5A5', '#C4B5FD', '#FDBA74'],
  ocean:     ['#0EA5E9', '#2563EB', '#7C3AED', '#06B6D4', '#4F46E5', '#0891B2', '#6366F1', '#3B82F6']
};

function colorForIndex(i) {
  const p = PALETTES[state.palette] || PALETTES.classique;
  return p[i % p.length];
}

function textColorFor(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.6 ? '#25233A' : '#FFFFFF';
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* --------------------------------------------------------------------------
   4. État global & sauvegarde LocalStorage
   -------------------------------------------------------------------------- */
const state = {
  options: [],
  lang: 'fr',
  theme: 'light',
  sound: true,
  palette: 'classique',
  history: [],          // { id, name, ts } — du plus récent au plus ancien
  totalDraws: 0,
  lastResult: null
};

let isSpinning = false;
let rotation = 0;        // rotation courante de la roue (radians)
let lastWinnerIndex = -1;
let animationId = null;
let storageWarned = false;

function normalizeOptions(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const v = item.trim().replace(/\s+/g, ' ').slice(0, 60);
    if (!v) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
    if (out.length >= MAX_OPTIONS) break;
  }
  return out;
}

function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const h of raw) {
    if (!h || typeof h.name !== 'string' || !Number.isFinite(h.ts)) continue;
    out.push({ id: String(h.id), name: h.name.slice(0, 60), ts: h.ts });
  }
  out.sort((a, b) => b.ts - a.ts);
  return out.slice(0, HISTORY_LIMIT);
}

function loadState() {
  let restored = false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && typeof d === 'object') {
        state.options = normalizeOptions(d.options);
        state.lang = I18N[d.lang] ? d.lang : 'fr';
        state.theme = d.theme === 'dark' ? 'dark' : 'light';
        state.sound = d.sound !== false;
        state.palette = PALETTES[d.palette] ? d.palette : 'classique';
        state.history = normalizeHistory(d.history);
        state.totalDraws = Number.isInteger(d.totalDraws) && d.totalDraws >= 0 ? d.totalDraws : 0;
        state.lastResult = typeof d.lastResult === 'string' ? d.lastResult : null;
        restored = true;
      }
    }
  } catch (e) {
    restored = false; // stockage indisponible ou données corrompues
  }
  if (!restored) {
    // Premier lancement : liste de démonstration
    state.options = [...categoryItems(CATEGORIES.restaurants)];
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    if (!storageWarned) {
      storageWarned = true;
      toast(t('toast.storageError'), 'error');
    }
  }
}

/* --------------------------------------------------------------------------
   5. Sons (Web Audio API) — création paresseuse, jamais au chargement
   -------------------------------------------------------------------------- */
const Sound = {
  ctx: null,
  enabled: true,

  ensure() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { this.ctx = new AC(); } catch (e) { return null; }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  },

  tone(freq, duration, type, gain, delay = 0) {
    const ac = this.ensure();
    if (!ac) return;
    try {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const t0 = ac.currentTime + delay;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.05);
    } catch (e) { /* le son ne doit jamais bloquer l'application */ }
  },

  tick()  { this.tone(1150 + Math.random() * 250, 0.045, 'triangle', 0.05); },
  click() { this.tone(620, 0.06, 'sine', 0.05); },
  win()   { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.16, 'sine', 0.07, i * 0.09)); }
};

/* --------------------------------------------------------------------------
   6. Toast & message inline du panneau
   -------------------------------------------------------------------------- */
let toastTimer = null;
function toast(message, type = 'info') {
  const el = $('#toast');
  el.textContent = message;
  el.className = 'toast show' + (type === 'error' ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 2600);
}

let msgTimer = null;
function showPanelMsg(text, type = 'info') {
  const el = $('#panelMsg');
  el.textContent = text;
  el.className = 'msg show ' + (type === 'error' ? 'error' : 'ok');
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { el.className = 'msg'; }, 3200);
}

/* --------------------------------------------------------------------------
   7. Modales (résultat, paramètres, confirmation)
   -------------------------------------------------------------------------- */
function openModal(el, focusEl) {
  el.removeAttribute('hidden');
  if (focusEl) focusEl.focus();
}

function closeModal(el) {
  el.setAttribute('hidden', '');
}

let confirmResolve = null;

function askConfirm(titleKey, textKey, vars) {
  $('#confirmTitle').textContent = t(titleKey);
  $('#confirmText').textContent = t(textKey, vars);
  const modal = $('#confirmModal');
  openModal(modal, $('#btnConfirmNo'));
  return new Promise((resolve) => { confirmResolve = resolve; });
}

function settleConfirm(value) {
  if (!confirmResolve) return;
  closeModal($('#confirmModal'));
  const resolve = confirmResolve;
  confirmResolve = null;
  resolve(value);
}

function showResultModal(name, optionCount) {
  $('#resultName').textContent = name;
  $('#resultAmong').textContent = t('modal.among', { n: optionCount });
  openModal($('#resultModal'), $('#btnAgain'));
}

/* --------------------------------------------------------------------------
   8. Rendu : liste des options, statistiques, historique
   -------------------------------------------------------------------------- */
function renderOptions() {
  const list = $('#optionsList');
  const n = state.options.length;
  $('#optionsCount').textContent = formatCount(n);

  if (n === 0) {
    list.innerHTML = '<li class="list-empty">' + escapeHtml(t('panel.listEmpty')) + '</li>';
  } else {
    const disabled = isSpinning ? ' disabled' : '';
    list.innerHTML = state.options.map((opt, i) =>
      '<li class="option-item" data-index="' + i + '">' +
        '<span class="opt-dot" style="background:' + colorForIndex(i) + '"></span>' +
        '<span class="opt-label" title="' + escapeHtml(opt) + '">' + escapeHtml(opt) + '</span>' +
        '<button type="button" class="icon-btn sm edit-btn" data-action="edit" data-index="' + i + '"' + disabled +
          ' aria-label="' + escapeHtml(t('a11y.edit', { v: opt })) + '">' + ICON_PENCIL + '</button>' +
        '<button type="button" class="icon-btn sm delete-btn" data-action="delete" data-index="' + i + '"' + disabled +
          ' aria-label="' + escapeHtml(t('a11y.delete', { v: opt })) + '">' + ICON_TRASH + '</button>' +
      '</li>'
    ).join('');
  }
  updateSpinButton();
}

function startEdit(index) {
  if (isSpinning) return;
  const li = $('#optionsList .option-item[data-index="' + index + '"]');
  if (!li) return;
  const opt = state.options[index];
  li.classList.add('editing');
  li.innerHTML =
    '<span class="opt-dot" style="background:' + colorForIndex(index) + '"></span>' +
    '<input type="text" class="edit-input" maxlength="60" value="' + escapeHtml(opt) + '"' +
      ' aria-label="' + escapeHtml(t('a11y.editInput')) + '">' +
    '<button type="button" class="icon-btn sm save-btn" data-action="save" data-index="' + index + '"' +
      ' aria-label="' + escapeHtml(t('edit.save')) + '">' + ICON_CHECK + '</button>' +
    '<button type="button" class="icon-btn sm cancel-btn" data-action="cancel" data-index="' + index + '"' +
      ' aria-label="' + escapeHtml(t('edit.cancel')) + '">' + ICON_X + '</button>';

  const input = $('.edit-input', li);
  input.focus();
  input.select();
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      saveEdit(index);
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      renderOptions();
    }
  });
}

function saveEdit(index) {
  const li = $('#optionsList .option-item.editing');
  const input = li ? $('.edit-input', li) : null;
  if (!input) { renderOptions(); return; }
  const value = input.value.trim().replace(/\s+/g, ' ');
  if (!value) {
    showPanelMsg(t('toast.empty'), 'error');
    input.focus();
    return;
  }
  const duplicate = state.options.some((o, i) => i !== index && o.toLowerCase() === value.toLowerCase());
  if (duplicate) {
    showPanelMsg(t('toast.duplicate'), 'error');
    input.focus();
    return;
  }
  state.options[index] = value;
  saveState();
  renderOptions();
  drawWheel();
  showPanelMsg(t('toast.updated'), 'ok');
}

function updateStats() {
  $('#statOptions').textContent = String(state.options.length);
  $('#statDraws').textContent = String(state.totalDraws);
  $('#statLast').textContent = state.lastResult != null ? state.lastResult : '—';
}

function renderHistory() {
  const list = $('#historyList');
  const empty = $('#historyEmpty');
  const items = state.history;

  $('#historyCount').textContent = formatDraws(items.length);
  $('#btnClearHistory').disabled = items.length === 0 || isSpinning;

  if (items.length === 0) {
    list.innerHTML = '';
    empty.removeAttribute('hidden');
    return;
  }
  empty.setAttribute('hidden', '');

  const locale = state.lang === 'fr' ? 'fr-FR' : 'en-GB';
  let dateFmt, timeFmt;
  try {
    dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    timeFmt = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    dateFmt = { format: (ts) => new Date(ts).toLocaleDateString() };
    timeFmt = { format: (ts) => new Date(ts).toLocaleTimeString() };
  }

  list.innerHTML = items.map((h) =>
    '<li class="history-item">' +
      '<span class="history-dot" aria-hidden="true"></span>' +
      '<div class="history-info">' +
        '<span class="history-name">' + escapeHtml(h.name) + '</span>' +
        '<span class="history-date">' + escapeHtml(dateFmt.format(h.ts)) + ' · ' + escapeHtml(timeFmt.format(h.ts)) + '</span>' +
      '</div>' +
      '<button type="button" class="icon-btn sm delete-btn" data-history-id="' + escapeHtml(h.id) + '"' +
        ' aria-label="' + escapeHtml(t('a11y.deleteDraw')) + '">' + ICON_TRASH + '</button>' +
    '</li>'
  ).join('');
}

/* --------------------------------------------------------------------------
   9. Roulette (Canvas API)
   -------------------------------------------------------------------------- */
const canvas = $('#wheelCanvas');
const ctx = canvas.getContext('2d');
let canvasSize = 520;
let dpr = 1;

function setupCanvas() {
  const wrap = $('#wheelWrap');
  const rect = wrap.getBoundingClientRect();
  canvasSize = Math.max(200, Math.round(rect.width) || 520);
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvasSize * dpr);
  canvas.height = Math.round(canvasSize * dpr);
}

function fitText(text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(out + '…').width > maxWidth) {
    out = out.slice(0, -1);
  }
  return out.trimEnd() + '…';
}

function drawWheel() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvasSize, canvasSize);

  const c = canvasSize / 2;
  const R = c - 6;                                        // marge pour l'ombre
  const rimW = Math.max(8, Math.round(canvasSize * 0.02)); // largeur du cerclage
  const rSeg = R - rimW;
  const rimColor = cssVar('--rim');
  const n = state.options.length;

  // Socle circulaire avec ombre portée
  ctx.save();
  ctx.shadowColor = 'rgba(37, 35, 58, 0.22)';
  ctx.shadowBlur = canvasSize * 0.05;
  ctx.shadowOffsetY = canvasSize * 0.02;
  ctx.beginPath();
  ctx.arc(c, c, R, 0, TAU);
  ctx.fillStyle = rimColor;
  ctx.fill();
  ctx.restore();

  if (n === 0) {
    // Roue vide : anneau pointillé indicatif
    ctx.save();
    ctx.beginPath();
    ctx.arc(c, c, rSeg - 6, 0, TAU);
    ctx.setLineDash([10, 12]);
    ctx.lineWidth = 3;
    ctx.strokeStyle = cssVar('--empty-ring');
    ctx.stroke();
    ctx.restore();
    return;
  }

  const seg = TAU / n;

  // Segments
  for (let i = 0; i < n; i++) {
    const start = rotation + i * seg;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.arc(c, c, rSeg, start, start + seg);
    ctx.closePath();
    ctx.fillStyle = colorForIndex(i);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = rimColor;
    ctx.stroke();
  }

  // Libellés orientés du centre vers l'extérieur
  const hubRadius = canvasSize * 0.17;
  const baseFont = clamp(canvasSize * 0.045, 12, 20);
  for (let i = 0; i < n; i++) {
    const mid = rotation + i * seg + seg / 2;
    const color = colorForIndex(i);
    const fontSize = clamp(baseFont * Math.min(1, seg / 0.5), 9, baseFont);
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(mid);
    ctx.textBaseline = 'middle';
    ctx.font = '700 ' + fontSize + 'px Manrope, "Segoe UI", system-ui, sans-serif';
    const label = fitText(state.options[i], rSeg - hubRadius - 16);
    ctx.fillStyle = textColorFor(color);
    if (Math.cos(mid) < 0) {
      // moitié gauche : texte retourné pour rester lisible à l'écran
      ctx.rotate(Math.PI);
      ctx.textAlign = 'left';
      ctx.fillText(label, -(rSeg - 14), 0);
    } else {
      ctx.textAlign = 'right';
      ctx.fillText(label, rSeg - 14, 0);
    }
    ctx.restore();
  }
}

/* --------------------------------------------------------------------------
   10. Tirage : hasard cryptographique, angles, animation
   -------------------------------------------------------------------------- */

/* Entier uniforme dans [0, maxExclusive) — rejection sampling sans biais */
function cryptoRandomInt(maxExclusive) {
  if (maxExclusive <= 1) return 0;
  if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
    const range = 0x100000000;
    const limit = range - (range % maxExclusive);
    const buf = new Uint32Array(1);
    let v;
    do {
      window.crypto.getRandomValues(buf);
      v = buf[0];
    } while (v >= limit);
    return v % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

/* Index du segment situé exactement sous le pointeur (en haut) */
function indexAtPointer(rot, optionCount) {
  if (optionCount === 0) return -1;
  const seg = TAU / optionCount;
  return Math.floor(mod(POINTER_ANGLE - rot, TAU) / seg) % optionCount;
}

/* Calcule la rotation finale : le segment gagnant arrive sous le pointeur */
function planSpin(currentRotation, winnerIndex, optionCount) {
  const seg = TAU / optionCount;
  const margin = Math.min(0.035, seg * 0.12);
  const span = seg / 2 - margin;
  const offset = ((cryptoRandomInt(2001) / 2000) * 2 - 1) * span;
  const targetRel = winnerIndex * seg + seg / 2 + offset;   // position voulue sous le pointeur
  const targetRotation = POINTER_ANGLE - targetRel;
  const turns = 5 + cryptoRandomInt(3);                     // 5 à 7 tours complets
  const delta = mod(targetRotation - currentRotation, TAU);
  return {
    totalRotation: turns * TAU + delta,
    duration: 5200 + cryptoRandomInt(1800)                  // 5,2 s à 7 s
  };
}

function setSpinningUi(on) {
  ['optionInput', 'btnAdd', 'btnBuild', 'btnClear', 'categorySelect'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = on;
  });
  renderOptions(); // recharge la liste avec les boutons désactivés
  updateSpinButton();
}

function updateSpinButton() {
  const btn = $('#spinBtn');
  btn.disabled = isSpinning || state.options.length === 0;
  $('#wheelEmpty').hidden = state.options.length !== 0;
}

function startSpin() {
  if (isSpinning) return; // aucune rotation simultanée
  const n = state.options.length;
  if (n === 0) {
    toast(t('toast.needOptions'), 'error');
    return;
  }

  // 1. Le gagnant est tiré AVANT l'animation (hasard cryptographique)
  const winnerIndex = cryptoRandomInt(n);
  // 2. L'angle final est calculé pour l'amener exactement sous le pointeur
  const plan = planSpin(rotation, winnerIndex, n);

  isSpinning = true;
  lastWinnerIndex = -1;
  setSpinningUi(true);

  const startRotation = rotation;
  const startTime = performance.now();
  const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
  let lastTickIndex = indexAtPointer(rotation, n);
  let lastTickTime = 0;

  const frame = (now) => {
    const progress = clamp((now - startTime) / plan.duration, 0, 1);
    rotation = startRotation + plan.totalRotation * easeOutQuart(progress);

    // Clic sonore à chaque franchissement de segment
    const currentIndex = indexAtPointer(rotation, n);
    if (currentIndex !== lastTickIndex && now - lastTickTime > 30) {
      lastTickIndex = currentIndex;
      lastTickTime = now;
      Sound.tick();
    }

    drawWheel();

    if (progress < 1) {
      animationId = requestAnimationFrame(frame);
    } else {
      finishSpin();
    }
  };
  animationId = requestAnimationFrame(frame);
}

function finishSpin() {
  animationId = null;
  rotation = mod(rotation, TAU); // évite la dérive des flottants
  const n = state.options.length;

  // Le gagnant affiché est relu depuis la position réelle de la roue
  const winnerIndex = indexAtPointer(rotation, n);
  lastWinnerIndex = winnerIndex;
  isSpinning = false;
  setSpinningUi(false);
  drawWheel();

  if (winnerIndex < 0) return;
  const name = state.options[winnerIndex];

  state.totalDraws += 1;
  state.lastResult = name;
  state.history.unshift({
    id: (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : Date.now() + '-' + Math.floor(Math.random() * 1e6),
    name,
    ts: Date.now()
  });
  if (state.history.length > HISTORY_LIMIT) state.history.length = HISTORY_LIMIT;
  saveState();

  updateStats();
  renderHistory();
  Sound.win();
  showResultModal(name, n);
  toast(t('toast.drawSaved'));
}

/* --------------------------------------------------------------------------
   11. Gestion des options
   -------------------------------------------------------------------------- */
function addOption(raw) {
  if (isSpinning) return false;
  const value = String(raw).trim().replace(/\s+/g, ' ');
  if (!value) {
    showPanelMsg(t('toast.empty'), 'error');
    return false;
  }
  if (state.options.length >= MAX_OPTIONS) {
    showPanelMsg(t('toast.maxOptions', { n: MAX_OPTIONS }), 'error');
    return false;
  }
  if (state.options.some((o) => o.toLowerCase() === value.toLowerCase())) {
    showPanelMsg(t('toast.duplicate'), 'error');
    return false;
  }
  state.options.push(value);
  saveState();
  renderOptions();
  drawWheel();
  updateStats();
  showPanelMsg(t('toast.added', { v: value }), 'ok');
  return true;
}

function deleteOption(index) {
  if (isSpinning) return;
  const name = state.options[index];
  if (name == null) return;
  state.options.splice(index, 1);
  saveState();
  renderOptions();
  drawWheel();
  updateStats();
  toast(t('toast.removed', { v: name }));
}

function clearAllOptions() {
  if (isSpinning) return;
  askConfirm('confirm.clearTitle', 'confirm.clearText').then((ok) => {
    if (!ok) return;
    state.options = [];
    saveState();
    renderOptions();
    drawWheel();
    updateStats();
    toast(t('toast.cleared'));
  });
}

function buildWheel() {
  if (isSpinning) return;
  drawWheel();
  updateStats();
  toast(t('toast.built', { v: formatCount(state.options.length) }));
  Sound.click();
}

async function loadCategory(key, selectEl) {
  if (isSpinning || !CATEGORIES[key]) return;
  const cat = CATEGORIES[key];

  if (state.options.length > 0) {
    // Ne jamais remplacer une liste personnalisée sans confirmation
    const ok = await askConfirm('confirm.replaceTitle', 'confirm.replaceText', {
      v: formatCount(state.options.length),
      c: t(cat.labelKey)
    });
    if (!ok) {
      selectEl.value = '';
      return;
    }
  }

  state.options = [...categoryItems(cat)];
  saveState();
  renderOptions();
  drawWheel();
  updateStats();
  toast(t('toast.loaded', { v: t(cat.labelKey), c: formatCount(state.options.length) }));
}

/* --------------------------------------------------------------------------
   12. Historique
   -------------------------------------------------------------------------- */
function deleteHistoryEntry(id) {
  const idx = state.history.findIndex((h) => h.id === id);
  if (idx === -1) return;
  state.history.splice(idx, 1);
  saveState();
  renderHistory();
  toast(t('toast.entryDeleted'));
}

function clearHistory() {
  askConfirm('confirm.historyTitle', 'confirm.historyText').then((ok) => {
    if (!ok) return;
    state.history = [];
    saveState();
    renderHistory();
    toast(t('toast.historyCleared'));
  });
}

/* --------------------------------------------------------------------------
   13. Langue, thème, palette, paramètres
   -------------------------------------------------------------------------- */
function applyTranslations() {
  const dict = I18N[state.lang];
  document.documentElement.lang = state.lang === 'fr' ? 'fr' : 'en';
  document.title = dict['doc.title'];
  $$('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] != null) el.textContent = dict[key];
  });
  $$('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key] != null) el.placeholder = dict[key];
  });
  $$('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (dict[key] != null) el.setAttribute('aria-label', dict[key]);
  });
}

function setLang(lang) {
  if (!I18N[lang] || state.lang === lang) return;
  state.lang = lang;
  saveState();
  applyTranslations();
  syncLangButtons();
  renderOptions();
  renderHistory();
  updateStats();
}

function syncLangButtons() {
  $$('.lang-btn').forEach((btn) => {
    const active = btn.dataset.lang === state.lang;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}

function setTheme(theme) {
  state.theme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = state.theme;
  saveState();
  syncThemeButtons();
  drawWheel(); // le cerclage dépend du thème
}

function syncThemeButtons() {
  $$('#themeSeg .seg-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.themeChoice === state.theme);
  });
}

function setPalette(key) {
  if (!PALETTES[key]) return;
  state.palette = key;
  saveState();
  syncPaletteButtons();
  renderOptions(); // met à jour les pastilles de couleur
  drawWheel();
}

function syncPaletteButtons() {
  $$('#paletteOpts .palette-opt').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.palette === state.palette);
  });
}

function resetSettings() {
  askConfirm('confirm.resetTitle', 'confirm.resetText').then((ok) => {
    if (!ok) return;
    state.sound = true;
    Sound.enabled = true;
    $('#soundToggle').checked = true;
    setLang('fr');
    setTheme('light');
    setPalette('classique');
    saveState();
    toast(t('toast.settingsReset'));
  });
}

function openSettings() {
  $('#soundToggle').checked = state.sound;
  syncThemeButtons();
  syncPaletteButtons();
  syncLangButtons();
  openModal($('#settingsModal'), $('#btnCloseSettings'));
}

/* --------------------------------------------------------------------------
   14. Vues (Accueil / Historique)
   -------------------------------------------------------------------------- */
function showView(name) {
  $('#viewHome').classList.toggle('active', name === 'home');
  $('#viewHistory').classList.toggle('active', name === 'history');
  $('#navHome').classList.toggle('active', name === 'home');
  $('#navHistory').classList.toggle('active', name === 'history');
  if (name === 'history') renderHistory();
}

/* --------------------------------------------------------------------------
   15. Événements
   -------------------------------------------------------------------------- */
function wireEvents() {
  // Navigation
  $('#navHome').addEventListener('click', () => showView('home'));
  $('#navHistory').addEventListener('click', () => showView('history'));
  $('#brandHome').addEventListener('click', () => showView('home'));

  // Langue (en-tête + paramètres)
  $$('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  // Paramètres
  $('#btnSettings').addEventListener('click', openSettings);
  $('#btnCloseSettings').addEventListener('click', () => closeModal($('#settingsModal')));
  $('#soundToggle').addEventListener('change', (e) => {
    state.sound = e.target.checked;
    Sound.enabled = e.target.checked;
    saveState();
  });
  $$('#themeSeg .seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => setTheme(btn.dataset.themeChoice));
  });
  $$('#paletteOpts .palette-opt').forEach((btn) => {
    btn.addEventListener('click', () => setPalette(btn.dataset.palette));
  });
  $('#btnResetSettings').addEventListener('click', resetSettings);

  // Roulette
  $('#spinBtn').addEventListener('click', startSpin);

  // Gestion des choix
  $('#btnAdd').addEventListener('click', () => {
    if (addOption($('#optionInput').value)) {
      $('#optionInput').value = '';
      Sound.click();
    }
    $('#optionInput').focus();
  });
  $('#optionInput').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (addOption($('#optionInput').value)) {
      $('#optionInput').value = '';
      Sound.click();
    }
  });
  $('#btnClear').addEventListener('click', clearAllOptions);
  $('#btnBuild').addEventListener('click', buildWheel);
  $('#categorySelect').addEventListener('change', (e) => {
    const key = e.target.value;
    if (!key) return;
    loadCategory(key, e.target);
  });

  // Liste des options : suppression / édition (délégation)
  $('#optionsList').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn || btn.disabled) return;
    const index = Number(btn.dataset.index);
    const action = btn.dataset.action;
    if (action === 'delete') deleteOption(index);
    else if (action === 'edit') startEdit(index);
    else if (action === 'save') saveEdit(index);
    else if (action === 'cancel') renderOptions();
  });

  // Historique
  $('#btnClearHistory').addEventListener('click', clearHistory);
  $('#historyList').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-history-id]');
    if (!btn) return;
    deleteHistoryEntry(btn.dataset.historyId);
  });

  // Modale de résultat
  $('#btnCloseResult').addEventListener('click', () => closeModal($('#resultModal')));
  $('#btnAgain').addEventListener('click', () => {
    closeModal($('#resultModal'));
    setTimeout(startSpin, 180);
  });
  $('#resultModal').addEventListener('click', (e) => {
    if (e.target === $('#resultModal')) closeModal($('#resultModal'));
  });

  // Modale de confirmation
  $('#btnConfirmYes').addEventListener('click', () => settleConfirm(true));
  $('#btnConfirmNo').addEventListener('click', () => settleConfirm(false));
  $('#confirmModal').addEventListener('click', (e) => {
    if (e.target === $('#confirmModal')) settleConfirm(false);
  });

  // Modale des paramètres : clic sur l'arrière-plan
  $('#settingsModal').addEventListener('click', (e) => {
    if (e.target === $('#settingsModal')) closeModal($('#settingsModal'));
  });

  // Échap : ferme la modale ouverte (la confirmation est annulée)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('#confirmModal').hidden) settleConfirm(false);
    else if (!$('#resultModal').hidden) closeModal($('#resultModal'));
    else if (!$('#settingsModal').hidden) closeModal($('#settingsModal'));
  });

  // Le contexte audio n'est créé qu'après un geste utilisateur (jamais au chargement)
  document.addEventListener('pointerdown', () => {
    if (Sound.enabled) Sound.ensure();
  }, { once: true });

  // Redimensionnement : la roue reste nette et centrée
  const ro = new ResizeObserver(() => {
    setupCanvas();
    drawWheel();
  });
  ro.observe($('#wheelWrap'));
}

/* --------------------------------------------------------------------------
   16. Initialisation
   -------------------------------------------------------------------------- */
function init() {
  loadState();
  document.documentElement.dataset.theme = state.theme;
  Sound.enabled = state.sound;
  $('#soundToggle').checked = state.sound;

  applyTranslations();
  syncLangButtons();
  syncThemeButtons();
  syncPaletteButtons();

  setupCanvas();
  drawWheel();
  renderOptions();
  renderHistory();
  updateStats();
  wireEvents();
}

document.addEventListener('DOMContentLoaded', init);

/* --------------------------------------------------------------------------
   17. API publique de lecture (introspection / debug)
   -------------------------------------------------------------------------- */
window.ChoixFacile = {
  version: '1.1.0',
  getOptions: () => [...state.options],
  getHistory: () => state.history.map((h) => ({ ...h })),
  getStats: () => ({
    totalDraws: state.totalDraws,
    lastResult: state.lastResult,
    optionCount: state.options.length
  }),
  getState: () => ({
    isSpinning,
    rotation: mod(rotation, TAU),
    optionCount: state.options.length,
    lastWinnerIndex,
    lang: state.lang,
    theme: state.theme,
    palette: state.palette,
    sound: state.sound,
    options: [...state.options]
  })
};
