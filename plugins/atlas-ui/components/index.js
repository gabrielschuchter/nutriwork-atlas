import { Fragment, h } from "preact"
import { resolveRelative, simplifySlug } from "@quartz-community/utils/path"

const DEFAULT_PASSWORD_HASH = "8546caeab1389bb18a5ffd7923802fe181434e69ca868010f83d92c65f7b4cb4"
const DEFAULT_STORAGE_KEY = "nutriwork-atlas-access"

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

function titleOf(file) {
  return file?.frontmatter?.title ?? file?.slug ?? "Nota sem título"
}

function normalizeSlug(value) {
  return simplifySlug(String(value ?? ""))
}

function unique(values) {
  return [...new Set(values)]
}

export const AtlasAccess = (userOptions = {}) => {
  const options = {
    passwordHash: userOptions.passwordHash || DEFAULT_PASSWORD_HASH,
    storageKey: userOptions.storageKey || DEFAULT_STORAGE_KEY,
  }

  const AtlasAccessComponent = () =>
    h(
      Fragment,
      null,
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
          h("p", { class: "atlas-access-kicker" }, "NUTRIWORK ATLAS"),
          h("h1", { id: "atlas-access-title" }, "Acesso ao Atlas"),
          h(
            "p",
            { class: "atlas-access-description" },
            "Este espaço de estudo requer a senha global compartilhada.",
          ),
          h(
            "form",
            { id: "atlas-access-form", class: "atlas-access-form", novalidate: true },
            h(
              "label",
              { for: "atlas-access-username", class: "atlas-visually-hidden" },
              "Identificador",
            ),
            h("input", {
              id: "atlas-access-username",
              name: "username",
              type: "text",
              autocomplete: "username",
              value: "atlas",
              readonly: true,
              tabindex: -1,
              class: "atlas-visually-hidden",
            }),
            h("label", { for: "atlas-access-password" }, "Senha global"),
            h("input", {
              id: "atlas-access-password",
              name: "password",
              type: "password",
              autocomplete: "current-password",
              required: true,
              inputmode: "text",
            }),
            h("button", { type: "submit", class: "atlas-access-submit" }, "Entrar"),
            h("p", {
              id: "atlas-access-status",
              class: "atlas-access-status",
              role: "status",
              "aria-live": "polite",
            }),
          ),
          h(
            "p",
            { class: "atlas-access-note" },
            "Barreira client-side para uso privado casual; não substitui controle de acesso server-side.",
          ),
        ),
      ),
      h(
        "button",
        {
          id: "atlas-access-logout",
          class: "atlas-access-logout",
          type: "button",
          "aria-label": "Sair do Nutriwork Atlas",
        },
        "Sair",
      ),
    )

  AtlasAccessComponent.css = `
#atlas-access {
  align-items: center;
  background: color-mix(in srgb, var(--light) 94%, transparent);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  visibility: visible;
  z-index: 10000;
  backdrop-filter: blur(18px);
}

html[data-atlas-access="unlocked"] #atlas-access {
  display: none;
}

.atlas-access-card {
  background: color-mix(in srgb, var(--light) 88%, white 12%);
  border: 1px solid var(--lightgray);
  border-radius: 24px;
  box-shadow: 0 24px 70px color-mix(in srgb, var(--dark) 18%, transparent);
  max-width: 28rem;
  padding: clamp(1.5rem, 5vw, 2.5rem);
  width: min(100%, 28rem);
}

.atlas-access-kicker {
  color: var(--secondary);
  font-family: var(--codeFont);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin: 0 0 0.75rem;
}

.atlas-access-card h1 {
  font-size: clamp(1.8rem, 5vw, 2.5rem);
  margin: 0 0 0.75rem;
}

.atlas-access-description,
.atlas-access-note {
  line-height: 1.55;
  margin: 0;
}

.atlas-access-note {
  color: var(--gray);
  font-size: 0.82rem;
  margin-top: 1rem;
}

.atlas-access-form {
  display: grid;
  gap: 0.65rem;
  margin-top: 1.5rem;
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

.atlas-access-form label {
  color: var(--dark);
  font-weight: 600;
}

.atlas-access-form input {
  background: var(--light);
  border: 1px solid var(--lightgray);
  border-radius: 12px;
  box-sizing: border-box;
  color: var(--dark);
  font: inherit;
  min-height: 2.75rem;
  padding: 0.65rem 0.8rem;
  width: 100%;
}

.atlas-access-submit,
.atlas-access-logout {
  align-items: center;
  background: var(--secondary);
  border: 1px solid var(--secondary);
  border-radius: 999px;
  color: white;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-weight: 600;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.65rem 1.1rem;
}

.atlas-access-submit:hover,
.atlas-access-logout:hover {
  background: var(--tertiary);
  border-color: var(--tertiary);
}

.atlas-access-submit:focus-visible,
.atlas-access-form input:focus-visible,
.atlas-access-logout:focus-visible {
  outline: 3px solid var(--secondary);
  outline-offset: 3px;
}

.atlas-access-status {
  color: var(--secondary);
  min-height: 1.4rem;
  margin: 0;
}

.atlas-access-status[data-state="error"] {
  color: #b42318;
}

.atlas-access-logout {
  bottom: 1rem;
  display: none;
  position: fixed;
  right: 1rem;
  z-index: 9999;
}

html[data-atlas-access="unlocked"] .atlas-access-logout {
  display: inline-flex;
}

@media (prefers-reduced-motion: reduce) {
  #atlas-access,
  .atlas-access-submit,
  .atlas-access-logout {
    transition: none;
  }
}

@media all and (max-width: 800px) {
  .atlas-access-logout {
    bottom: 0.75rem;
    right: 0.75rem;
  }
}
`

  AtlasAccessComponent.beforeDOMLoaded = `
(() => {
  const expectedHash = ${safeJson(options.passwordHash)};
  const storageKey = ${safeJson(options.storageKey)};
  let unlocked = false;
  try {
    unlocked = window.localStorage.getItem(storageKey) === expectedHash;
  } catch {
    unlocked = false;
  }
  document.documentElement.dataset.atlasAccess = unlocked ? "unlocked" : "locked";
})();
`

  AtlasAccessComponent.afterDOMLoaded = `
(() => {
  const expectedHash = ${safeJson(options.passwordHash)};
  const storageKey = ${safeJson(options.storageKey)};
  const runtimeKey = "__nutriworkAtlasAccessRuntime";
  const root = document.documentElement;

  if (!window[runtimeKey]) {
    const digest = async (value) => {
      const bytes = new TextEncoder().encode(value);
      const buffer = await crypto.subtle.digest("SHA-256", bytes);
      return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    };

    const setState = (unlocked) => {
      root.dataset.atlasAccess = unlocked ? "unlocked" : "locked";
      const input = document.getElementById("atlas-access-password");
      if (!unlocked && input && document.activeElement !== input) input.focus();
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

    const onSubmit = async (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.id !== "atlas-access-form") return;
      event.preventDefault();
      const input = document.getElementById("atlas-access-password");
      if (!(input instanceof HTMLInputElement) || !input.value) {
        announce("Informe a senha global.", "error");
        input?.focus();
        return;
      }
      try {
        const matches = (await digest(input.value)) === expectedHash;
        if (!matches) {
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
      const target = event.target;
      if (!(target instanceof Element) || target.id !== "atlas-access-logout") return;
      try {
        window.localStorage.removeItem(storageKey);
      } finally {
        setState(false);
        announce("Sessão encerrada.");
      }
    };

    const runtime = { apply: () => setState(readState()) };
    window[runtimeKey] = runtime;
    document.addEventListener("submit", onSubmit);
    document.addEventListener("click", onClick);
    document.addEventListener("nav", runtime.apply);
    document.addEventListener("render", runtime.apply);
  }

  window[runtimeKey].apply();
})();
`

  return AtlasAccessComponent
}

export const AtlasGraphFallback = () => {
  const AtlasGraphFallbackComponent = ({ fileData, allFiles }) => {
    const files = Array.isArray(allFiles) ? allFiles : []
    const currentSlug = normalizeSlug(fileData?.slug)
    const bySlug = new Map(
      files.filter((file) => file?.slug).map((file) => [normalizeSlug(file.slug), file]),
    )
    const outgoingSlugs = unique(
      Array.isArray(fileData?.links)
        ? fileData.links.map(normalizeSlug).filter((slug) => slug && slug !== currentSlug)
        : [],
    )
    const outgoing = outgoingSlugs.map((slug) => bySlug.get(slug) ?? { slug })
    const backlinks = files.filter(
      (file) =>
        file?.unlisted !== true &&
        Array.isArray(file?.links) &&
        file.links.map(normalizeSlug).includes(currentSlug),
    )
    const renderRelation = (file, key) => {
      const slug = normalizeSlug(file.slug)
      const title = titleOf(file)
      if (!bySlug.has(slug))
        return h("li", { key }, h("span", { class: "atlas-graph-missing" }, title))
      return h(
        "li",
        { key },
        h(
          "a",
          {
            class: "internal atlas-graph-link",
            href: resolveRelative(fileData.slug, file.slug),
          },
          title,
        ),
      )
    }

    return h(
      "section",
      { class: "atlas-graph-fallback", "aria-labelledby": "atlas-graph-fallback-title" },
      h(
        "div",
        { class: "atlas-graph-fallback-heading" },
        h("h3", { id: "atlas-graph-fallback-title" }, "Mapa de relações"),
        h(
          "p",
          null,
          "Lista textual para navegação por teclado e para situações em que o gráfico interativo não carregar.",
        ),
      ),
      h(
        "div",
        { class: "atlas-graph-fallback-columns" },
        h(
          "div",
          null,
          h("h4", null, "Links desta nota"),
          outgoing.length
            ? h("ul", null, outgoing.map(renderRelation))
            : h("p", { class: "atlas-graph-empty" }, "Nenhum link interno identificado."),
        ),
        h(
          "div",
          null,
          h("h4", null, "Backlinks"),
          backlinks.length
            ? h(
                "ul",
                null,
                backlinks.map((file, index) => renderRelation(file, `backlink-${index}`)),
              )
            : h("p", { class: "atlas-graph-empty" }, "Nenhum backlink identificado."),
        ),
      ),
    )
  }

  AtlasGraphFallbackComponent.css = `
.atlas-graph-fallback {
  border: 1px solid var(--lightgray);
  border-radius: 18px;
  margin: 2rem 0 0;
  padding: 1.1rem 1.25rem 1.25rem;
}

.atlas-graph-fallback-heading h3 {
  margin: 0;
}

.atlas-graph-fallback-heading p,
.atlas-graph-empty {
  color: var(--gray);
  font-size: 0.9rem;
  line-height: 1.45;
  margin: 0.45rem 0 0;
}

.atlas-graph-fallback-columns {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 1rem;
}

.atlas-graph-fallback h4 {
  font-size: 0.95rem;
  margin: 0 0 0.4rem;
}

.atlas-graph-fallback ul {
  margin: 0;
  padding-left: 1.15rem;
}

.atlas-graph-fallback li {
  line-height: 1.45;
  margin: 0.2rem 0;
}

.atlas-graph-fallback .atlas-graph-link {
  background: transparent;
  padding: 0;
}

.atlas-graph-missing {
  color: var(--gray);
}

@media all and (max-width: 800px) {
  .atlas-graph-fallback-columns {
    grid-template-columns: 1fr;
  }
}
`

  return AtlasGraphFallbackComponent
}
