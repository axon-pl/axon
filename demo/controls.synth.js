/** @param {string} v @returns {boolean} */
const __validate_NonEmptyString = (v) => v.length > 0;
/** @param {string} v @returns {boolean} */
const __validate_EmailAddress = (v) => __synth_presets.email.test(v);
/** @param {number} v @returns {boolean} */
const __validate_PositiveInt = (v) => v > 0;
/** @param {number} v @returns {boolean} */
const __validate_Score = (v) => (v >= 0) && (v <= 100);
/** @param {number} v @returns {boolean} */
const __validate_BoundedCount = (v) => (v >= -10) && (v <= 10);
/** @param {string} v @returns {boolean} */
const __validate_CSSClass = (v) => v.length > 0;
/** @param {string} v @returns {boolean} */
const __validate_SlugString = (v) => __synth_presets.slug.test(v);

const CounterState = (count, min, max) => ({ count, min, max });

const ValidationResult = (valid, message, value) => ({ valid, message, value });

const ModalState = (open, title, body) => ({ open, title, body });

const Player = (name, score, active) => ({ name, score, active });

const counter_make = (min, max, initial) => ({count: $clamp(initial, min, max), min, max});

const counter_inc = (state) => ({...state, count: Math.min(state.count + 1, state.max)});

const counter_dec = (state) => ({...state, count: Math.max(state.count - 1, state.min)});

const counter_can_inc = (state) => state.count < state.max;

const counter_can_dec = (state) => state.count > state.min;

/**
 * @param {CounterState} state
 * @returns {string}
 */
const counter_display = (state) => {
  let n = state.count;
  return ((_m) => (_m > 0) ? `+${n}` : (_m < 0) ? `${n}` : "0")(n);
};

const is_valid_email = (email) => __validate_EmailAddress(email);

/**
 * @param {string} email
 * @returns {ValidationResult}
 */
const validate_email = (email) => ((_m) => (_m === 0) ? {valid: false, message: "Email is required", value: email} : ((_m) => (_m === true) ? {valid: true, message: "Looks good!", value: email} : (_m === false) ? {valid: false, message: "Enter a valid email address", value: email} : undefined)(is_valid_email(email)))(email.length);

const validation_css_class = (result) => result.valid ? "field-valid" : result.value.length === 0 ? "field-empty" : "field-invalid";

const toggle_flip = (state) => !state;

const toggle_label = (state, onLabel, offLabel) => state ? onLabel : offLabel;

const toggle_css_class = (state, baseClass) => state ? `${baseClass} ${baseClass}--on` : `${baseClass} ${baseClass}--off`;

const theme_class = (name) => `theme-${name}`;

const theme_next = (current, available) => available[(available.indexOf(current) + 1) % available.length];

/**
 * @param {ThemeName} name
 * @returns {string}
 */
const theme_label = (name) => ((_m) => (_m === "light") ? "Light" : (_m === "dark") ? "Dark" : (_m === "synthwave") ? "Synthwave" : name)(name);

const modal_open = (title, body) => ({open: true, title, body});

const modal_close = (state) => ({...state, open: false});

/**
 * @param {EmailAddress} email
 * @param {NonEmptyString} name
 * @returns {string}
 */
const send_welcome = (email, name) => {
  if (!__validate_EmailAddress(email)) throw new Error("SynthConstraintError: email violates EmailAddress constraint (got " + JSON.stringify(email) + ")");
  if (!__validate_NonEmptyString(name)) throw new Error("SynthConstraintError: name violates NonEmptyString constraint (got " + JSON.stringify(name) + ")");
  return `Welcome, ${name}! A confirmation has been sent to ${email}.`;
};

/**
 * @param {NonEmptyString} label
 * @param {Score} value
 * @returns {string}
 */
const format_score = (label, value) => {
  if (!__validate_NonEmptyString(label)) throw new Error("SynthConstraintError: label violates NonEmptyString constraint (got " + JSON.stringify(label) + ")");
  if (!__validate_Score(value)) throw new Error("SynthConstraintError: value violates Score constraint (got " + JSON.stringify(value) + ")");
  return `${label}: ${value}/100`;
};

/**
 * @param {CounterState} states
 * @returns {number}
 */
const counter_history_total = (states) => $sum($map(states, (__x) => __x.count));

/**
 * @param {Player} players
 * @returns {string}
 */
const top_players = (players) => $map($filter(players, (__x) => __x.active), (__x) => __x.name);

/**
 * @param {Player} players
 * @returns {number}
 */
const total_score = (players) => $sum($map(players, (__x) => __x.score));

const fibonacci = (() => {
  const __cache = new Map();
  return (n) => {
    const __key = JSON.stringify([n]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      return ((_m) => (_m === 0) ? 0 : (_m === 1) ? 1 : fibonacci(n - 1) + fibonacci(n - 2))(n);
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();

const triangle_number = (() => {
  const __cache = new Map();
  return (n) => {
    const __key = JSON.stringify([n]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      return n * (n + 1) / 2;
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();

/**
 * @param {string} emails
 * @returns {ValidationResult}
 */
const validate_email_batch = (emails) => $map(emails, validate_email);

/**
 * @param {string} emails
 * @returns {number}
 */
const count_valid_emails = (emails) => $count($filter(emails, is_valid_email));

/**
 * @param {string} emails
 * @returns {string}
 */
const first_invalid_email = (emails) => $find(emails, (e) => !is_valid_email(e)) ?? "";

/**
 * @param {string} themes
 * @returns {string}
 */
const theme_options = (themes) => $map(themes, theme_label);

/**
 * @param {CounterState} states
 * @returns {boolean}
 */
const any_at_max = (states) => $any(states, (s) => s.count === s.max);

/**
 * @param {string} email
 * @returns {boolean}
 */
const debug_validate = (email) => {
  let result = is_valid_email(email);
  console.log("debug_validate:", email, "->", result);
  return result;
};

/**
 * @param {string} tag
 * @param {object} attrs
 * @param {*} ...children
 * @returns {Element}
 */
const el = (tag, attrs, ...children) => {
  let e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => (() => {
    if (k === "class") {
      return e.className = v;
    } else if (k === "disabled") {
      return e.disabled = v;
    } else if (k === "checked") {
      return e.checked = v;
    } else if (k.startsWith("on")) {
      return e.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === "placeholder") {
      return e.placeholder = v;
    } else if (k === "type") {
      return e.type = v;
    } else if (k === "value") {
      return e.value = v;
    } else if (k === "id") {
      return e.id = v;
    } else if (k === "for") {
      return e.setAttribute("for", v);
    } else {
      return e.setAttribute(k, String(v));
    }
})());
  $flat(children).forEach((child) => (() => {
    if (typeof child === "string") {
      return e.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      return e.appendChild(child);
    }
})());
  return e;
};

/**
 * @param {string} containerId
 * @param {Element} child
 * @returns {void}
 */
const mount = (containerId, child) => {
  let container = document.getElementById(containerId);
  return container.appendChild(child);
};

/**
 * @param {string} containerId
 * @returns {void}
 */
const render_counter = (containerId) => {
  let state = counter_make(-10, 10, 0);
  let display = el("span", {class: "counter-value"}, counter_display(state));
  let decBtn = el("button", {class: "btn btn-ghost"}, "−");
  let incBtn = el("button", {class: "btn btn-ghost"}, "+");
  decBtn.addEventListener("click", () => (() => {
    state = counter_dec(state);
    display.textContent = counter_display(state);
    decBtn.disabled = !counter_can_dec(state);
    return incBtn.disabled = !counter_can_inc(state);
})());
  incBtn.addEventListener("click", () => (() => {
    state = counter_inc(state);
    display.textContent = counter_display(state);
    decBtn.disabled = !counter_can_dec(state);
    return incBtn.disabled = !counter_can_inc(state);
})());
  return mount(containerId, el("div", {class: "counter-widget"}, decBtn, display, incBtn));
};

/**
 * @param {string} containerId
 * @returns {void}
 */
const render_email_validator = (containerId) => {
  let input = el("input", {type: "email", class: "input-field", placeholder: "you@example.com", id: "email-input"});
  let feedback = el("span", {class: "field-empty feedback-msg"}, "Enter your email");
  input.addEventListener("input", () => (() => {
    let result = validate_email(input.value);
    feedback.textContent = result.message;
    feedback.className = validation_css_class(result) + " feedback-msg";
    return input.className = "input-field " + validation_css_class(result);
})());
  return mount(containerId, el("div", {class: "validator-widget"}, el("label", {for: "email-input", class: "field-label"}, "Email Address"), input, feedback));
};

/**
 * @param {string} containerId
 * @param {string} onLabel
 * @param {string} offLabel
 * @returns {void}
 */
const render_toggle = (containerId, onLabel, offLabel) => {
  let state = false;
  let track = el("div", {class: toggle_css_class(state, "toggle-track")});
  let thumb = el("div", {class: "toggle-thumb"});
  let label = el("span", {class: "toggle-label"}, toggle_label(state, onLabel, offLabel));
  track.appendChild(thumb);
  let btn = el("button", {class: "toggle-btn"}, track, label);
  btn.addEventListener("click", () => (() => {
    state = toggle_flip(state);
    track.className = toggle_css_class(state, "toggle-track");
    return label.textContent = toggle_label(state, onLabel, offLabel);
})());
  return mount(containerId, btn);
};

let THEMES = ["light", "dark", "synthwave"];

/**
 * @param {string} containerId
 * @returns {void}
 */
const render_theme_switcher = (containerId) => {
  let themes = THEMES;
  let labels = theme_options(themes);
  let current = 0;
  document.body.className = theme_class(themes[current]);
  let lbl = el("span", {class: "theme-label"}, labels[current]);
  let ico = el("span", {class: "theme-icon"}, "◐");
  let btn = el("button", {class: "btn btn-theme"}, ico, lbl);
  btn.addEventListener("click", () => (() => {
    current = (current + 1) % themes.length;
    document.body.className = theme_class(themes[current]);
    return lbl.textContent = labels[current];
})());
  return mount(containerId, btn);
};

/**
 * @param {string} containerId
 * @returns {void}
 */
const render_modal_demo = (containerId) => {
  let state = modal_close({open: false, title: "", body: ""});
  let closeBtn = el("button", {class: "btn btn-primary modal-close-btn"}, "Close");
  let overlay = el("div", {class: "modal-overlay"}, el("div", {class: "modal-box"}, el("h3", {class: "modal-title"}, "Hello from Synth"), el("p", {class: "modal-body"}, "This modal state is managed by pure Synth functions. " + "Opening and closing are just state transitions — no framework needed."), closeBtn));
  let openBtn = el("button", {class: "btn btn-primary", id: "modal-open"}, "Open Modal");
  openBtn.addEventListener("click", () => (() => {
    state = modal_open("Hello from Synth", "Pure state logic");
    return overlay.style.display = "flex";
})());
  closeBtn.addEventListener("click", () => (() => {
    state = modal_close(state);
    return overlay.style.display = "none";
})());
  overlay.addEventListener("click", (e) => (() => {
    if (e.target === overlay) {
      state = modal_close(state);
      return overlay.style.display = "none";
    }
})());
  document.body.appendChild(overlay);
  return mount(containerId, openBtn);
};

