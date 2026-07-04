// ═══════════════════════════════════════════════════════════════════════════════
// TypeScript — Web Controls Demo (comparison file)
// Equivalent functionality to controls.axn
// ═══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────────
// TypeScript has no semantic constraint types — we use branded types as an idiom,
// but they require explicit casting and do not document intent at the type level.

type NonEmptyString = string
type EmailAddress = string
type PositiveInt = number
type CSSClass = string
type ThemeName = "light" | "dark" | "synthwave"

// ── Interfaces ─────────────────────────────────────────────────────────────────

interface CounterState {
  count: number
  min: number
  max: number
}

interface ValidationResult {
  valid: boolean
  message: string
  value: string
}

interface ModalState {
  open: boolean
  title: string
  body: string
}

// ══════════════════════════════════════════════════════════════════════════════
// COUNTER
// ══════════════════════════════════════════════════════════════════════════════

function counter_make(min: number, max: number, initial: number): CounterState {
  return { count: Math.max(min, Math.min(max, initial)), min, max }
}

function counter_inc(state: CounterState): CounterState {
  return { ...state, count: Math.min(state.count + 1, state.max) }
}

function counter_dec(state: CounterState): CounterState {
  return { ...state, count: Math.max(state.count - 1, state.min) }
}

function counter_can_inc(state: CounterState): boolean {
  return state.count < state.max
}

function counter_can_dec(state: CounterState): boolean {
  return state.count > state.min
}

function counter_display(state: CounterState): string {
  if (state.count > 0) return `+${state.count}`
  if (state.count < 0) return String(state.count)
  return "0"
}

// ══════════════════════════════════════════════════════════════════════════════
// EMAIL VALIDATOR
// ══════════════════════════════════════════════════════════════════════════════

function is_valid_email(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validate_email(email: string): ValidationResult {
  if (email.length === 0) {
    return { valid: false, message: "Email is required", value: email }
  }
  if (is_valid_email(email)) {
    return { valid: true, message: "Looks good!", value: email }
  }
  return { valid: false, message: "Enter a valid email address", value: email }
}

function validation_css_class(result: ValidationResult): CSSClass {
  if (result.valid) return "field-valid"
  if (result.value.length === 0) return "field-empty"
  return "field-invalid"
}

// ══════════════════════════════════════════════════════════════════════════════
// TOGGLE
// ══════════════════════════════════════════════════════════════════════════════

function toggle_flip(state: boolean): boolean {
  return !state
}

function toggle_label(state: boolean, onLabel: string, offLabel: string): string {
  return state ? onLabel : offLabel
}

function toggle_css_class(state: boolean, baseClass: string): CSSClass {
  return state ? `${baseClass} ${baseClass}--on` : `${baseClass} ${baseClass}--off`
}

// ══════════════════════════════════════════════════════════════════════════════
// THEME
// ══════════════════════════════════════════════════════════════════════════════

const THEME_LABELS: Record<ThemeName, string> = {
  light: "Light",
  dark: "Dark",
  synthwave: "Synthwave",
}

function theme_class(name: ThemeName): CSSClass {
  return `theme-${name}`
}

function theme_next(current: ThemeName, available: ThemeName[]): ThemeName {
  const idx = available.indexOf(current)
  return available[(idx + 1) % available.length]
}

function theme_label(name: ThemeName): string {
  return THEME_LABELS[name] ?? name
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════════════════════════════════════

function modal_open(title: string, body: string): ModalState {
  return { open: true, title, body }
}

function modal_close(state: ModalState): ModalState {
  return { ...state, open: false }
}

// ══════════════════════════════════════════════════════════════════════════════
// DOM BUILDER
// ══════════════════════════════════════════════════════════════════════════════

type AttrMap = Record<string, string | boolean | number | EventListener>

function el(tag: string, attrs: AttrMap, ...children: (string | Node)[]): HTMLElement {
  const e = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class")       { e.className = String(v) }
    else if (k === "disabled") { (e as HTMLButtonElement).disabled = Boolean(v) }
    else if (k === "checked")  { (e as HTMLInputElement).checked = Boolean(v) }
    else if (k.startsWith("on")) { e.addEventListener(k.slice(2).toLowerCase(), v as EventListener) }
    else if (k === "placeholder") { (e as HTMLInputElement).placeholder = String(v) }
    else if (k === "type")   { (e as HTMLInputElement).type = String(v) }
    else if (k === "value")  { (e as HTMLInputElement).value = String(v) }
    else if (k === "id")     { e.id = String(v) }
    else if (k === "for")    { e.setAttribute("for", String(v)) }
    else { e.setAttribute(k, String(v)) }
  }
  children.flat().forEach(child => {
    if (typeof child === "string") e.appendChild(document.createTextNode(child))
    else if (child instanceof Node) e.appendChild(child)
  })
  return e
}

function mount(containerId: string, child: HTMLElement): void {
  const container = document.getElementById(containerId)
  if (container) container.appendChild(child)
}

// ══════════════════════════════════════════════════════════════════════════════
// COUNTER WIDGET
// ══════════════════════════════════════════════════════════════════════════════

function render_counter(containerId: string): void {
  let state = counter_make(-10, 10, 0)
  const display = el("span", { class: "counter-value" }, counter_display(state))
  const decBtn = el("button", { class: "btn btn-ghost", id: "dec-btn" }, "−")
  const incBtn = el("button", { class: "btn btn-ghost", id: "inc-btn" }, "+")

  decBtn.addEventListener("click", () => {
    state = counter_dec(state)
    display.textContent = counter_display(state)
    ;(decBtn as HTMLButtonElement).disabled = !counter_can_dec(state)
    ;(incBtn as HTMLButtonElement).disabled = !counter_can_inc(state)
  })

  incBtn.addEventListener("click", () => {
    state = counter_inc(state)
    display.textContent = counter_display(state)
    ;(decBtn as HTMLButtonElement).disabled = !counter_can_dec(state)
    ;(incBtn as HTMLButtonElement).disabled = !counter_can_inc(state)
  })

  const widget = el("div", { class: "counter-widget" }, decBtn, display, incBtn)
  mount(containerId, widget)
}

// ══════════════════════════════════════════════════════════════════════════════
// EMAIL VALIDATOR WIDGET
// ══════════════════════════════════════════════════════════════════════════════

function render_email_validator(containerId: string): void {
  const input = el("input", {
    type: "email",
    class: "input-field",
    placeholder: "you@example.com",
    id: "email-input",
  }) as HTMLInputElement

  const feedback = el("span", { class: "field-empty feedback-msg" }, "Enter your email")

  input.addEventListener("input", () => {
    const result = validate_email(input.value)
    feedback.textContent = result.message
    feedback.className = `${validation_css_class(result)} feedback-msg`
    input.className = `input-field ${validation_css_class(result)}`
  })

  const widget = el("div", { class: "validator-widget" },
    el("label", { for: "email-input", class: "field-label" }, "Email Address"),
    input,
    feedback
  )
  mount(containerId, widget)
}

// ══════════════════════════════════════════════════════════════════════════════
// TOGGLE WIDGET
// ══════════════════════════════════════════════════════════════════════════════

function render_toggle(containerId: string, onLabel: string, offLabel: string): void {
  let state = false
  const track = el("div", { class: toggle_css_class(state, "toggle-track") })
  const thumb = el("div", { class: "toggle-thumb" })
  const label = el("span", { class: "toggle-label" }, toggle_label(state, onLabel, offLabel))
  track.appendChild(thumb)
  const btn = el("button", { class: "toggle-btn" }, track, label)
  btn.addEventListener("click", () => {
    state = toggle_flip(state)
    track.className = toggle_css_class(state, "toggle-track")
    label.textContent = toggle_label(state, onLabel, offLabel)
  })
  mount(containerId, btn)
}

// ══════════════════════════════════════════════════════════════════════════════
// THEME SWITCHER WIDGET
// ══════════════════════════════════════════════════════════════════════════════

function render_theme_switcher(containerId: string): void {
  const themes: ThemeName[] = ["light", "dark", "synthwave"]
  let current: ThemeName = "light"
  document.body.className = theme_class(current)

  const label = el("span", { class: "theme-label" }, theme_label(current))
  const icon = el("span", { class: "theme-icon" }, "◐")
  const btn = el("button", { class: "btn btn-theme" }, icon, label)

  btn.addEventListener("click", () => {
    current = theme_next(current, themes)
    document.body.className = theme_class(current)
    label.textContent = theme_label(current)
  })

  mount(containerId, btn)
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL WIDGET
// ══════════════════════════════════════════════════════════════════════════════

function render_modal_demo(containerId: string): void {
  let state = modal_close({ open: false, title: "", body: "" })

  const overlay = el("div", { class: "modal-overlay", id: "modal-overlay" },
    el("div", { class: "modal-box" },
      el("h3", { class: "modal-title" }, "Hello from TypeScript"),
      el("p",  { class: "modal-body" },  "This modal is the TypeScript equivalent of the Axon demo."),
      el("button", { class: "btn btn-primary modal-close-btn", id: "modal-close-ts" }, "Close")
    )
  )

  const openBtn = el("button", { class: "btn btn-primary" }, "Open Modal")

  openBtn.addEventListener("click", () => {
    state = modal_open("Hello from TypeScript", "Pure state logic")
    overlay.style.display = "flex"
  })

  document.getElementById("modal-close-ts")?.addEventListener("click", () => {
    state = modal_close(state)
    overlay.style.display = "none"
  })

  overlay.addEventListener("click", (e: Event) => {
    if (e.target === overlay) {
      state = modal_close(state)
      overlay.style.display = "none"
    }
  })

  document.body.appendChild(overlay)
  mount(containerId, openBtn)
}
