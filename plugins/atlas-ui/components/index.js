import { Fragment, h } from "preact"
import { resolveRelative } from "@quartz-community/utils/path"
import atlasRuntime from "../runtime.js"

const DEFAULT_PASSWORD_HASH = "8546caeab1389bb18a5ffd7923802fe181434e69ca868010f83d92c65f7b4cb4"
const DEFAULT_STORAGE_KEY = "nutriwork-atlas-access"

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

function logoPath(fileData) {
  return resolveRelative(String(fileData?.slug || "index"), "static/icon.png")
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
          h("input", {
            id: "atlas-access-password",
            name: "password",
            type: "password",
            autocomplete: "current-password",
            required: true,
            inputmode: "text",
          }),
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

.atlas-access-form input {
  background: rgba(1, 2, 6, .62);
  border: 1px solid rgba(142, 185, 255, .3);
  border-radius: 12px;
  box-sizing: border-box;
  color: #F5F7FF;
  font: inherit;
  min-height: 3rem;
  padding: .7rem .85rem;
  width: 100%;
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
  background: rgba(7, 16, 35, .92);
  border: 1px solid rgba(142, 185, 255, .25);
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, .3);
  color: #F5F7FF;
  max-width: calc(100vw - 2rem);
  opacity: 0;
  padding: 1rem;
  pointer-events: none;
  position: fixed;
  transform: translateY(6px);
  transition: opacity 140ms ease, transform 140ms ease;
  z-index: 9000;
  backdrop-filter: blur(16px);
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
  padding: 1rem;
  position: fixed;
  z-index: 8000;
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
  background: rgba(7, 16, 35, .94);
  border: 1px solid rgba(142, 185, 255, .24);
  border-radius: 24px;
  box-shadow: 0 24px 90px rgba(0, 0, 0, .36);
  color: #F5F7FF;
  max-width: 34rem;
  padding: clamp(1.2rem, 4vw, 2rem);
  position: relative;
  width: min(100%, 34rem);
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
  transform: scaleX(calc(var(--atlas-onboarding-progress, 1) / 5));
  transform-origin: left;
  transition: transform 180ms ease;
  width: 100%;
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
    const current = String(fileData?.slug || "index")
    const graphRoute = current === "index"
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
      graphRoute
        ? h(
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
                h("span", { "data-onboarding-count": "" }, "01 / 05"),
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
                    "A nota é a leitura completa. Os links dentro dela levam a outros conceitos sem tirar você da rede.",
                  ),
                ),
                h(
                  "div",
                  { class: "atlas-onboarding-step", "data-onboarding-step": "3", hidden: true },
                  h("h2", null, "Leia sem perder o lugar."),
                  h(
                    "p",
                    null,
                    "Na nota, o minimapa preserva o mesmo espaço do grafo. Use Expandir grafo para voltar ao mapa ou Voltar para retornar ao conceito anterior.",
                  ),
                ),
                h(
                  "div",
                  { class: "atlas-onboarding-step", "data-onboarding-step": "4", hidden: true },
                  h("h2", null, "Filtre a rede."),
                  h(
                    "p",
                    null,
                    "Busque um conceito ou escolha uma área. O filtro deixa visível apenas o contexto que você quer explorar.",
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
          )
        : null,
    )
  }

  AtlasAppComponent.afterDOMLoaded = atlasRuntime
  return AtlasAppComponent
}
