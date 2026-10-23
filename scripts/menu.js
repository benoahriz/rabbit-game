// rabbit-game v0.2 — settings menu (ESC toggles). Minimal vanilla module.
// Hosts the Setting picker (garden ⇄ pink room, user direction 2026-10-23);
// future settings join as .menu-row blocks. Keyboard + click-outside + focus-light handling.
export class SettingsMenu {
  constructor(rootEl, { onSettingChange, getSetting } = {}) {
    this.root = rootEl;
    this.onSettingChange = onSettingChange ?? (() => {});
    this.getSetting = getSetting ?? (() => "garden");
    this._escBound = false;
  }

  init() {
    this.root.querySelectorAll(".setting-opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.onSettingChange(btn.dataset.setting);
        this.sync();
      });
    });
    // click on the dimmed backdrop closes
    this.root.addEventListener("click", (e) => { if (e.target === this.root) this.close(); });
    this.sync();
  }

  get isOpen() { return !this.root.hidden; }

  toggle() { this.isOpen ? this.close() : this.open(); }

  open() {
    this.root.hidden = false;
    if (!this._escBound) {
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.isOpen) { e.preventDefault(); this.close(); }
      });
      this._escBound = true;
    }
    const first = this.root.querySelector(".setting-opt");
    if (first) first.focus();
  }

  close() {
    this.root.hidden = true;
  }

  /** Reflect the current setting onto the option buttons' aria-pressed state. */
  sync() {
    const current = this.getSetting();
    this.root.querySelectorAll(".setting-opt").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.setting === current));
    });
  }
}
