import { Fragment, h } from "preact"
import { resolveRelative } from "@quartz-community/utils/path"
import atlasRuntime from "../runtime.js"

const DEFAULT_PASSWORD_HASH = "8546caeab1389bb18a5ffd7923802fe181434e69ca868010f83d92c65f7b4cb4"
const DEFAULT_STORAGE_KEY = "nutriwork-atlas-access"
const SUPPORT_CONTACTS = {
  whatsapp: {
    label: "WhatsApp / telefone",
    value: "(12) 99750-5188",
    href: "https://wa.me/5512997505188?text=Ol%C3%A1%20Nutriwork%2C%20preciso%20de%20ajuda%20com%20o%20Atlas.",
  },
  email: {
    label: "E-mail",
    value: "equipenutriwork@gmail.com",
    href: "mailto:equipenutriwork@gmail.com",
  },
  instagram: {
    label: "Instagram",
    value: "@gruponutriwork",
    href: "https://www.instagram.com/gruponutriwork",
  },
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

function logoPath(fileData) {
  return resolveRelative(String(fileData?.slug || "index"), "static/atlas-symbol.png")
}

export const AtlasAccess = (userOptions = {}) => {
  const options = {
    passwordHash: userOptions.passwordHash || DEFAULT_PASSWORD_HASH,
    storageKey: userOptions.storageKey || DEFAULT_STORAGE_KEY,
  }

  const AtlasAccessComponent = ({ fileData }) =>
    h(
      "section",
      {
        id: "atlas-access",
        class: "atlas-access",
        "aria-labelledby": "atlas-access-title",
        role: "dialog",
        "aria-modal": "true",
      },
      h(
        "div",
        { class: "atlas-access-card" },
        h("img", {
          class: "atlas-access-logo",
          src: logoPath(fileData),
          alt: "Nutriwork",
          width: 56,
          height: 56,
        }),
        h("p", { class: "atlas-access-kicker" }, "NUTRIWORK / ATLAS"),
        h("h1", { id: "atlas-access-title" }, "O grafo é o Atlas."),
        h(
          "p",
          { class: "atlas-access-description" },
          "Entre para explorar conceitos e notas de Nutrição Baseada em Evidências.",
        ),
        h(
          "form",
          { id: "atlas-access-form", class: "atlas-access-form", novalidate: true },
          h("label", { for: "atlas-access-password" }, "Senha"),
          h(
            "div",
            { class: "atlas-password-field" },
            h("input", {
              id: "atlas-access-password",
              name: "password",
              type: "password",
              autocomplete: "current-password",
              required: true,
              inputmode: "text",
              "aria-describedby": "atlas-access-status",
            }),
            h(
              "button",
              {
                id: "atlas-access-password-toggle",
                class: "atlas-password-toggle",
                type: "button",
                "aria-label": "Mostrar senha",
                "aria-pressed": "false",
              },
              h("span", { class: "atlas-password-eye", "aria-hidden": "true" }),
            ),
          ),
          h("button", { type: "submit", class: "atlas-access-submit" }, "Entrar no Atlas"),
          h("p", {
            id: "atlas-access-status",
            class: "atlas-access-status",
            role: "status",
            "aria-live": "polite",
          }),
        ),
      ),
    )

  AtlasAccessComponent.css = `
html[data-atlas-access="locked"] .atlas-frame {
  visibility: hidden;
}

#atlas-access {
  align-items: center;
  background: rgba(1, 2, 6, .86);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  visibility: visible;
  z-index: 10000;
  backdrop-filter: blur(20px);
}

html[data-atlas-access="unlocked"] #atlas-access {
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}

.atlas-access-card {
  background: rgba(7, 16, 35, .86);
  border: 1px solid rgba(142, 185, 255, .2);
  border-radius: 26px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, .38);
  color: #F5F7FF;
  max-width: 26rem;
  padding: clamp(1.6rem, 5vw, 2.6rem);
  width: min(100%, 26rem);
}

.atlas-access-logo {
  display: block;
  height: 3.5rem;
  margin-bottom: 1.4rem;
  object-fit: contain;
  width: 3.5rem;
}

.atlas-access-kicker,
.atlas-preview-kicker {
  color: #8EB9FF;
  font-family: var(--codeFont);
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .14em;
  margin: 0 0 .8rem;
}

.atlas-access-card h1 {
  font-size: clamp(1.8rem, 7vw, 2.7rem);
  letter-spacing: -.045em;
  line-height: 1.04;
  margin: 0 0 .8rem;
}

.atlas-access-description {
  color: #C8D2E5;
  line-height: 1.55;
  margin: 0;
}

.atlas-access-form {
  display: grid;
  gap: .6rem;
  margin-top: 1.6rem;
}

.atlas-access-form label {
  color: #F5F7FF;
  font-size: .86rem;
  font-weight: 600;
}

.atlas-password-field {
  position: relative;
}

.atlas-access-form input {
  background: rgba(1, 2, 6, .62);
  border: 1px solid rgba(142, 185, 255, .3);
  border-radius: 12px;
  box-sizing: border-box;
  color: #F5F7FF;
  font: inherit;
  min-height: 3rem;
  padding: .7rem 3.25rem .7rem .85rem;
  width: 100%;
}

.atlas-password-toggle {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 9px;
  color: #8EB9FF;
  cursor: pointer;
  display: inline-flex;
  height: 2.3rem;
  justify-content: center;
  padding: 0;
  position: absolute;
  right: .35rem;
  top: 50%;
  transform: translateY(-50%);
  transition: background-color 160ms ease, color 160ms ease;
  width: 2.3rem;
}

.atlas-password-toggle:hover,
.atlas-password-toggle:focus-visible {
  background: rgba(142, 185, 255, .12);
  color: #F5F7FF;
}

.atlas-password-eye {
  border: 1.5px solid currentColor;
  border-radius: 70% 20%;
  display: block;
  height: .78rem;
  position: relative;
  transform: rotate(45deg);
  width: 1.15rem;
}

.atlas-password-eye::after {
  background: currentColor;
  border-radius: 50%;
  content: "";
  height: .28rem;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: .28rem;
}

.atlas-password-toggle[aria-pressed="true"] .atlas-password-eye::before {
  background: currentColor;
  content: "";
  height: 1.35rem;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  width: 1.5px;
}

.atlas-access-submit {
  background: #1263FF;
  border: 1px solid #1263FF;
  border-radius: 999px;
  color: white;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  min-height: 3rem;
  padding: .7rem 1.1rem;
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.atlas-access-submit:hover {
  background: #29A8FF;
  border-color: #29A8FF;
  transform: translateY(-1px);
}

.atlas-access-submit:focus-visible,
.atlas-access-form input:focus-visible {
  outline: 3px solid #8EB9FF;
  outline-offset: 3px;
}

.atlas-access-status {
  color: #8EB9FF;
  min-height: 1.3rem;
  margin: .15rem 0 0;
}

.atlas-access-status[data-state="error"] {
  color: #FFB4AB;
}

#atlas-preview {
  -webkit-backdrop-filter: blur(26px) saturate(148%);
  backdrop-filter: blur(26px) saturate(148%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .075), transparent 46%), var(--atlas-glass, rgba(7, 16, 35, .4));
  border: 1px solid var(--atlas-glass-line, rgba(220, 235, 255, .16));
  border-radius: 18px;
  box-shadow: var(--atlas-glass-shadow, 0 20px 50px rgba(0, 0, 0, .3));
  color: #F5F7FF;
  max-width: calc(100vw - 2rem);
  opacity: 0;
  padding: 1rem;
  pointer-events: none;
  position: fixed;
  transform: translateY(6px);
  transition: opacity 140ms ease, transform 140ms ease;
  z-index: 9000;
}

#atlas-preview .atlas-preview-open {
  pointer-events: auto;
}

#atlas-preview.is-open {
  opacity: 1;
  pointer-events: none;
  transform: translateY(0);
}

#atlas-preview[hidden] {
  display: none;
}

.atlas-preview-kicker {
  margin-bottom: .5rem;
}

.atlas-preview-title {
  font-size: 1.1rem;
  letter-spacing: -.02em;
  line-height: 1.2;
  margin: 0;
}

.atlas-preview-area {
  color: #8EB9FF;
  font-size: .74rem;
  margin: .3rem 0 .75rem;
}

.atlas-preview-excerpt {
  color: #C8D2E5;
  font-size: .82rem;
  line-height: 1.5;
  margin: 0;
}

.atlas-preview-open {
  background: #1263FF;
  border: 1px solid #1263FF;
  border-radius: 999px;
  color: white;
  cursor: pointer;
  font: inherit;
  font-size: .78rem;
  font-weight: 700;
  margin-top: .9rem;
  min-height: 2.45rem;
  padding: .55rem .9rem;
}

.atlas-preview-open:hover {
  background: #29A8FF;
  border-color: #29A8FF;
}

#atlas-onboarding {
  align-items: center;
  display: flex;
  inset: 0;
  justify-content: center;
  opacity: 0;
  padding: 1rem;
  pointer-events: none;
  position: fixed;
  z-index: 8000;
  transition: opacity 220ms ease;
}

#atlas-onboarding.is-open {
  opacity: 1;
  pointer-events: auto;
}

#atlas-onboarding[hidden] {
  display: none;
}

.atlas-onboarding-backdrop {
  background: rgba(1, 2, 6, .68);
  inset: 0;
  position: absolute;
  backdrop-filter: blur(8px);
}

.atlas-onboarding-card {
  -webkit-backdrop-filter: blur(28px) saturate(145%);
  backdrop-filter: blur(28px) saturate(145%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .075), transparent 46%), var(--atlas-glass-strong, rgba(7, 16, 35, .58));
  border: 1px solid var(--atlas-glass-line, rgba(220, 235, 255, .16));
  border-radius: 24px;
  box-shadow: var(--atlas-glass-shadow, 0 24px 90px rgba(0, 0, 0, .36));
  color: #F5F7FF;
  max-width: 34rem;
  padding: clamp(1.2rem, 4vw, 2rem);
  position: relative;
  transform: translateY(8px) scale(.975);
  transition: opacity 220ms ease, transform 300ms cubic-bezier(.22, .8, .2, 1);
  width: min(100%, 34rem);
}

#atlas-onboarding.is-open .atlas-onboarding-card {
  transform: none;
}

.atlas-onboarding-header,
.atlas-onboarding-footer {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.atlas-onboarding-header {
  color: #8EB9FF;
  font-family: var(--codeFont);
  font-size: .7rem;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.atlas-onboarding-mark {
  height: 1.7rem;
  object-fit: contain;
  width: 1.7rem;
}

.atlas-onboarding-skip,
.atlas-onboarding-next {
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  min-height: 2.65rem;
  padding: .6rem 1rem;
}

.atlas-onboarding-skip {
  background: transparent;
  border: 1px solid rgba(142, 185, 255, .25);
  color: #C8D2E5;
}

.atlas-onboarding-next {
  background: #1263FF;
  border: 1px solid #1263FF;
  color: white;
}

.atlas-onboarding-skip:hover,
.atlas-onboarding-next:hover {
  border-color: #29A8FF;
}

.atlas-onboarding-body {
  min-height: 12rem;
  padding: 3rem 0 2.2rem;
}

.atlas-onboarding-step h2 {
  font-size: clamp(1.45rem, 5vw, 2rem);
  letter-spacing: -.035em;
  line-height: 1.1;
  margin: 0 0 .7rem;
}

.atlas-onboarding-step p {
  color: #C8D2E5;
  line-height: 1.65;
  margin: 0;
}

.atlas-onboarding-progress {
  background: rgba(142, 185, 255, .16);
  border-radius: 999px;
  height: 3px;
  overflow: hidden;
  position: relative;
  width: 7rem;
}

.atlas-onboarding-progress::before {
  background: #29A8FF;
  content: "";
  display: block;
  height: 100%;
  transform: scaleX(calc(var(--atlas-onboarding-progress, 1) / 6));
  transform-origin: left;
  transition: transform 180ms ease;
  width: 100%;
}

:root[data-theme="light"] #atlas-preview,
:root[data-theme="light"] .atlas-onboarding-card {
  color: #07152A;
}

:root[data-theme="light"] .atlas-preview-excerpt,
:root[data-theme="light"] .atlas-onboarding-step p,
:root[data-theme="light"] .atlas-onboarding-skip {
  color: #526277;
}

:root[data-theme="light"] .atlas-preview-kicker,
:root[data-theme="light"] .atlas-preview-area,
:root[data-theme="light"] .atlas-onboarding-header {
  color: #1263FF;
}

#atlas-help {
  align-items: center;
  display: flex;
  inset: 0;
  justify-content: center;
  opacity: 0;
  padding: 1rem;
  pointer-events: none;
  position: fixed;
  transition: opacity 220ms ease;
  z-index: 8100;
}

#atlas-help.is-open {
  opacity: 1;
  pointer-events: auto;
}

#atlas-help[hidden] {
  display: none;
}

.atlas-help-backdrop {
  background: rgba(1, 2, 6, .62);
  border: 0;
  cursor: default;
  inset: 0;
  padding: 0;
  position: absolute;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.atlas-help-card {
  -webkit-backdrop-filter: blur(28px) saturate(150%);
  backdrop-filter: blur(28px) saturate(150%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .1), transparent 48%), var(--atlas-glass-strong, rgba(7, 16, 35, .62));
  border: 1px solid var(--atlas-glass-line, rgba(220, 235, 255, .17));
  border-radius: 22px;
  box-shadow: var(--atlas-glass-shadow, 0 24px 90px rgba(0, 0, 0, .36));
  color: #F5F7FF;
  max-width: 27rem;
  padding: 1.25rem;
  position: relative;
  transform: translateY(8px) scale(.975);
  transition: transform 300ms cubic-bezier(.22, .8, .2, 1);
  width: min(100%, 27rem);
}

#atlas-help.is-open .atlas-help-card {
  transform: none;
}

.atlas-help-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.atlas-help-kicker {
  color: #8EB9FF;
  font-family: var(--codeFont);
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .14em;
  margin: 0;
}

.atlas-help-close {
  align-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  color: #C8D2E5;
  cursor: pointer;
  display: inline-flex;
  font-size: 1.35rem;
  height: 2.2rem;
  justify-content: center;
  line-height: 1;
  width: 2.2rem;
}

.atlas-help-close:hover,
.atlas-help-close:focus-visible {
  background: rgba(255, 255, 255, .08);
  border-color: var(--atlas-glass-line, rgba(220, 235, 255, .17));
  color: #F5F7FF;
}

.atlas-help-card h2 {
  font-size: clamp(1.45rem, 5vw, 2rem);
  letter-spacing: -.035em;
  line-height: 1.1;
  margin: 1.2rem 0 .45rem;
}

.atlas-help-copy {
  color: #C8D2E5;
  line-height: 1.5;
  margin: 0;
}

.atlas-help-contacts {
  display: grid;
  gap: .45rem;
  margin-top: 1.25rem;
}

.atlas-help-contacts a {
  align-items: center;
  background: rgba(255, 255, 255, .045);
  border: 1px solid rgba(220, 235, 255, .11);
  border-radius: 13px;
  color: #F5F7FF;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: .7rem .8rem;
  text-decoration: none;
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.atlas-help-contacts a:hover,
.atlas-help-contacts a:focus-visible {
  background: rgba(255, 255, 255, .1);
  border-color: rgba(142, 185, 255, .3);
  transform: translateY(-1px);
}

.atlas-help-contact-label {
  color: #94A3B8;
  font-size: .74rem;
}

.atlas-help-contacts strong {
  font-size: .78rem;
  font-weight: 600;
  text-align: right;
}

:root[data-theme="light"] .atlas-help-card {
  color: #07152A;
}

:root[data-theme="light"] .atlas-help-copy {
  color: #526277;
}

:root[data-theme="light"] .atlas-help-kicker {
  color: #1263FF;
}

:root[data-theme="light"] .atlas-help-close {
  color: #526277;
}

:root[data-theme="light"] .atlas-help-contacts a {
  color: #07152A;
  background: rgba(255, 255, 255, .25);
  border-color: rgba(18, 99, 255, .12);
}

:root[data-theme="light"] .atlas-help-contact-label {
  color: #6E7F95;
}

.atlas-visually-hidden {
  border: 0;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}

@media (prefers-color-scheme: light) {
  html[data-atlas-access="locked"] #atlas-access {
    background: rgba(244, 247, 252, .9);
  }
}

@media all and (max-width: 560px) {
  .atlas-onboarding-body {
    min-height: 14rem;
    padding-block: 2.4rem;
  }
}
`

  AtlasAccessComponent.beforeDOMLoaded =
    "(() => {\n" +
    "  const expectedHash = " +
    safeJson(options.passwordHash) +
    ";\n" +
    "  const storageKey = " +
    safeJson(options.storageKey) +
    ";\n" +
    "  let unlocked = false;\n" +
    "  try { unlocked = window.localStorage.getItem(storageKey) === expectedHash; } catch {}\n" +
    '  document.documentElement.dataset.atlasAccess = unlocked ? "unlocked" : "locked";\n' +
    "})();\n"

  AtlasAccessComponent.afterDOMLoaded = `
(() => {
  const expectedHash = ${safeJson(options.passwordHash)};
  const storageKey = ${safeJson(options.storageKey)};
  const runtimeKey = "__nutriworkAtlasAccessRuntime";
  const root = document.documentElement;

  if (window[runtimeKey]) return;

  const digest = async (value) => {
    const bytes = new TextEncoder().encode(value);
    const buffer = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(buffer)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  };

  const readState = () => {
    try {
      return window.localStorage.getItem(storageKey) === expectedHash;
    } catch {
      return false;
    }
  };

  const announce = (message, state = "") => {
    const status = document.getElementById("atlas-access-status");
    if (!status) return;
    status.textContent = message;
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
  };

  const setState = (unlocked) => {
    const nextState = unlocked ? "unlocked" : "locked";
    const changed = root.dataset.atlasAccess !== nextState;
    root.dataset.atlasAccess = nextState;
    if (changed) document.dispatchEvent(new CustomEvent("atlas-access"));
    if (!unlocked) {
      window.requestAnimationFrame(() => document.getElementById("atlas-access-password")?.focus());
    }
  };

  const onSubmit = async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== "atlas-access-form") return;
    event.preventDefault();
    const input = document.getElementById("atlas-access-password");
    if (!(input instanceof HTMLInputElement) || !input.value) {
      announce("Informe a senha.", "error");
      input?.focus();
      return;
    }
    try {
      if ((await digest(input.value)) !== expectedHash) {
        announce("Senha incorreta.", "error");
        input.select();
        return;
      }
      window.localStorage.setItem(storageKey, expectedHash);
      input.value = "";
      announce("");
      setState(true);
    } catch {
      announce("Não foi possível validar a senha neste navegador.", "error");
    }
  };

  const onClick = (event) => {
    const toggle =
      event.target instanceof Element ? event.target.closest("#atlas-access-password-toggle") : null;
    if (toggle) {
      const input = document.getElementById("atlas-access-password");
      if (!(input instanceof HTMLInputElement)) return;
      const visible = input.type === "text";
      input.type = visible ? "password" : "text";
      toggle.setAttribute("aria-pressed", String(!visible));
      toggle.setAttribute("aria-label", visible ? "Mostrar senha" : "Ocultar senha");
      input.focus({ preventScroll: true });
      return;
    }
    const target =
      event.target instanceof Element ? event.target.closest("#atlas-access-logout") : null;
    if (!target) return;
    try {
      window.localStorage.removeItem(storageKey);
    } finally {
      announce("Sessão encerrada.");
      setState(false);
    }
  };

  window[runtimeKey] = true;
  document.addEventListener("submit", onSubmit);
  document.addEventListener("click", onClick);
  document.addEventListener("nav", () => setState(readState()));
  if (readState()) setState(true);
  else window.requestAnimationFrame(() => document.getElementById("atlas-access-password")?.focus());
})();
`

  return AtlasAccessComponent
}

export const AtlasApp = () => {
  const AtlasAppComponent = ({ fileData }) => {
    const asset = logoPath(fileData)
    return h(
      Fragment,
      null,
      h("div", { id: "atlas-runtime-anchor", "aria-hidden": "true" }),
      h("div", {
        id: "atlas-preview",
        role: "dialog",
        "aria-label": "Prévia do conceito",
        "aria-hidden": "true",
        hidden: true,
      }),
      h(
        "div",
        {
          id: "atlas-onboarding",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "atlas-onboarding-title",
          hidden: true,
        },
        h("div", { class: "atlas-onboarding-backdrop", "aria-hidden": "true" }),
        h(
          "section",
          { class: "atlas-onboarding-card" },
          h(
            "header",
            { class: "atlas-onboarding-header" },
            h("img", { class: "atlas-onboarding-mark", src: asset, alt: "" }),
            h("span", { "data-onboarding-count": "" }, "01 / 06"),
            h(
              "button",
              {
                class: "atlas-onboarding-skip",
                type: "button",
                "data-atlas-action": "onboarding-skip",
              },
              "Pular",
            ),
          ),
          h(
            "div",
            { class: "atlas-onboarding-body" },
            h(
              "div",
              { class: "atlas-onboarding-step", "data-onboarding-step": "0" },
              h("h2", { id: "atlas-onboarding-title" }, "O mapa é o ponto de partida."),
              h(
                "p",
                null,
                "Arraste para navegar pela rede e use o scroll ou o gesto de pinça para aproximar e afastar.",
              ),
            ),
            h(
              "div",
              { class: "atlas-onboarding-step", "data-onboarding-step": "1", hidden: true },
              h("h2", null, "Passe sobre um conceito."),
              h(
                "p",
                null,
                "O hover abre uma única preview com o contexto essencial. Mova o cursor para outro ponto para continuar descobrindo.",
              ),
            ),
            h(
              "div",
              { class: "atlas-onboarding-step", "data-onboarding-step": "2", hidden: true },
              h("h2", null, "Clique para entrar na nota."),
              h(
                "p",
                null,
                "A nota assume o foco e o mesmo grafo se transforma em minimapa. A leitura acontece sem perder o espaço que você explorava.",
              ),
            ),
            h(
              "div",
              { class: "atlas-onboarding-step", "data-onboarding-step": "3", hidden: true },
              h("h2", null, "Leia e volte naturalmente."),
              h(
                "p",
                null,
                "Links dentro da nota abrem outros conceitos. Use Voltar ou Expandir grafo para recuperar o contexto da rede.",
              ),
            ),
            h(
              "div",
              { class: "atlas-onboarding-step", "data-onboarding-step": "4", hidden: true },
              h("h2", null, "Conceitos em desenvolvimento."),
              h(
                "p",
                null,
                "Termos acinzentados já aparecem no grafo porque foram citados, mas ainda estão em desenvolvimento. Eles não têm uma nota publicada.",
              ),
            ),
            h(
              "div",
              { class: "atlas-onboarding-step", "data-onboarding-step": "5", hidden: true },
              h("h2", null, "Filtre a rede."),
              h(
                "p",
                null,
                "Busque um conceito ou escolha uma área. O filtro atualiza nós e conexões imediatamente para deixar só o contexto que você quer explorar.",
              ),
            ),
          ),
          h(
            "footer",
            { class: "atlas-onboarding-footer" },
            h("span", {
              class: "atlas-onboarding-progress",
              "data-atlas-onboarding-progress": "",
            }),
            h(
              "button",
              {
                class: "atlas-onboarding-next",
                type: "button",
                "data-atlas-action": "onboarding-next",
              },
              "Continuar",
            ),
          ),
        ),
      ),
      h(
        "div",
        {
          id: "atlas-help",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "atlas-help-title",
          hidden: true,
        },
        h("button", {
          class: "atlas-help-backdrop",
          type: "button",
          "aria-label": "Fechar ajuda",
          "data-atlas-action": "close-help",
        }),
        h(
          "section",
          { class: "atlas-help-card" },
          h(
            "header",
            { class: "atlas-help-header" },
            h("p", { class: "atlas-help-kicker" }, "AJUDA"),
            h(
              "button",
              {
                class: "atlas-help-close",
                type: "button",
                "data-atlas-action": "close-help",
                "aria-label": "Fechar ajuda",
              },
              "×",
            ),
          ),
          h("h2", { id: "atlas-help-title" }, "Alguma dúvida ou problema?"),
          h("p", { class: "atlas-help-copy" }, "Fale com o Nutriwork."),
          h(
            "div",
            { class: "atlas-help-contacts" },
            ...Object.values(SUPPORT_CONTACTS).map((contact) =>
              h(
                "a",
                { href: contact.href, target: "_blank", rel: "noreferrer" },
                h("span", { class: "atlas-help-contact-label" }, contact.label),
                h("strong", null, contact.value),
              ),
            ),
          ),
        ),
      ),
    )
  }

  AtlasAppComponent.afterDOMLoaded = atlasRuntime
  return AtlasAppComponent
}
