import { Fragment, h } from "preact"
import { resolveRelative, simplifySlug } from "@quartz-community/utils/path"
import atlasRuntime from "../runtime.js"

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
          h("h2", { id: "atlas-access-title" }, "Acesso ao Atlas"),
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
          h("p", { class: "atlas-access-note" }, "Acesso protegido por senha para uso reservado."),
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

.atlas-access-card h1,
.atlas-access-card h2 {
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

    const applyPublicLabels = () => {
      document.querySelectorAll(".global-graph-icon").forEach((button) => {
        if (button.getAttribute("aria-label") !== "Abrir grafo global") {
          button.setAttribute("aria-label", "Abrir grafo global");
        }
      });
      document.querySelectorAll(".search-button svg title").forEach((title) => {
        if (title.textContent !== "Pesquisar") title.textContent = "Pesquisar";
      });
      document.querySelectorAll(".search-layout .result-card.no-match h3").forEach((title) => {
        if (title.textContent !== "Nenhum resultado.") title.textContent = "Nenhum resultado.";
      });
      document.querySelectorAll(".search-layout .result-card.no-match p").forEach((hint) => {
        if (hint.textContent !== "Tente outra busca?") hint.textContent = "Tente outra busca?";
      });
      document.querySelectorAll(".search .results-container").forEach((results) => {
        if (results.getAttribute("aria-label") !== "Resultados da busca") {
          results.setAttribute("aria-label", "Resultados da busca");
        }
      });
      document.querySelectorAll(".search .tag-suggestions").forEach((suggestions) => {
        if (suggestions.getAttribute("aria-label") !== "Sugestões de tags") {
          suggestions.setAttribute("aria-label", "Sugestões de tags");
        }
      });
    };

    const publicLabelObserver = new MutationObserver(applyPublicLabels);
    publicLabelObserver.observe(document.body, { childList: true, subtree: true });

    const runtime = { apply: () => setState(readState()) };
    window[runtimeKey] = runtime;
    document.addEventListener("submit", onSubmit);
    document.addEventListener("click", onClick);
    document.addEventListener("nav", runtime.apply);
    document.addEventListener("render", runtime.apply);
    document.addEventListener("nav", applyPublicLabels);
    document.addEventListener("render", applyPublicLabels);
    if (typeof window.addCleanup === "function") {
      window.addCleanup(() => publicLabelObserver.disconnect());
    }
    applyPublicLabels();
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
          h("h4", null, "Notas relacionadas"),
          backlinks.length
            ? h(
                "ul",
                null,
                backlinks.map((file, index) => renderRelation(file, `backlink-${index}`)),
              )
            : h("p", { class: "atlas-graph-empty" }, "Nenhuma nota relacionada identificada."),
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

export const AtlasStudyShell = () => {
  const AtlasStudyShellComponent = ({ fileData }) => {
    const currentSlug = normalizeSlug(fileData?.slug)
    const showActions = currentSlug.startsWith("atlas/")

    return h(
      Fragment,
      null,
      showActions
        ? h(
            "section",
            { class: "atlas-study-actions", "aria-label": "Ações de estudo" },
            h("p", { class: "atlas-kicker" }, "ESTUDO"),
            h(
              "div",
              { class: "atlas-action-row" },
              h(
                "button",
                { type: "button", class: "atlas-button", "data-atlas-action": "favorite" },
                "Salvar nos favoritos",
              ),
              h(
                "button",
                { type: "button", class: "atlas-button", "data-atlas-action": "focus" },
                "Modo foco",
              ),
              h(
                "button",
                { type: "button", class: "atlas-button", "data-atlas-action": "palette" },
                "Abrir comandos",
              ),
              h(
                "button",
                { type: "button", class: "atlas-button", "data-atlas-action": "random" },
                "Conceito aleatório",
              ),
            ),
          )
        : null,
      h(
        "button",
        {
          type: "button",
          class: "atlas-focus-exit atlas-button",
          "data-atlas-action": "focus",
          "aria-label": "Sair do modo foco",
        },
        "Sair do modo foco",
      ),
      h(
        "div",
        {
          id: "atlas-command-palette",
          class: "atlas-overlay",
          hidden: true,
          "aria-hidden": "true",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "atlas-command-title",
        },
        h(
          "div",
          { class: "atlas-overlay-backdrop", "data-atlas-action": "close-palette" },
          h(
            "section",
            { class: "atlas-command-card", onClick: (event) => event.stopPropagation() },
            h(
              "div",
              { class: "atlas-overlay-heading" },
              h(
                "div",
                null,
                h("p", { class: "atlas-kicker" }, "NAVEGAÇÃO"),
                h("h2", { id: "atlas-command-title" }, "Comandos"),
              ),
              h(
                "button",
                {
                  type: "button",
                  class: "atlas-icon-button",
                  "data-atlas-action": "close-palette",
                  "aria-label": "Fechar comandos",
                },
                "×",
              ),
            ),
            h(
              "label",
              { class: "atlas-visually-hidden", for: "atlas-command-input" },
              "Buscar comando",
            ),
            h("input", {
              id: "atlas-command-input",
              class: "atlas-command-input",
              type: "search",
              placeholder: "Buscar comando ou nota",
            }),
            h("div", {
              id: "atlas-command-results",
              class: "atlas-command-results",
              role: "listbox",
            }),
            h("p", { class: "atlas-overlay-hint" }, "Ctrl/Cmd + K para abrir · Esc para fechar"),
          ),
        ),
      ),
      h(
        "div",
        {
          id: "atlas-advanced-search-modal",
          class: "atlas-overlay",
          hidden: true,
          "aria-hidden": "true",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "atlas-advanced-search-title",
        },
        h(
          "div",
          { class: "atlas-overlay-backdrop", "data-atlas-action": "close-advanced" },
          h(
            "section",
            { class: "atlas-advanced-card", onClick: (event) => event.stopPropagation() },
            h(
              "div",
              { class: "atlas-overlay-heading" },
              h(
                "div",
                null,
                h("p", { class: "atlas-kicker" }, "BUSCA"),
                h("h2", { id: "atlas-advanced-search-title" }, "Busca avançada"),
              ),
              h(
                "button",
                {
                  type: "button",
                  class: "atlas-icon-button",
                  "data-atlas-action": "close-advanced",
                  "aria-label": "Fechar busca",
                },
                "×",
              ),
            ),
            h("div", { id: "atlas-advanced-search-modal-content" }),
          ),
        ),
      ),
      h("div", {
        id: "atlas-link-preview",
        class: "atlas-link-preview",
        hidden: true,
        role: "dialog",
        "aria-label": "Prévia do conceito",
      }),
    )
  }

  AtlasStudyShellComponent.css = `
.atlas-kicker {
  color: var(--secondary);
  font-family: var(--codeFont);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin: 0;
}

.atlas-button,
.atlas-text-button,
.atlas-icon-button {
  align-items: center;
  background: color-mix(in srgb, var(--light) 78%, var(--secondary) 22%);
  border: 1px solid var(--lightgray);
  border-radius: 999px;
  color: var(--dark);
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 600;
  justify-content: center;
  min-height: 2.5rem;
  padding: 0.55rem 0.9rem;
  text-decoration: none;
}

.atlas-button:hover,
.atlas-text-button:hover,
.atlas-icon-button:hover {
  border-color: var(--secondary);
  color: var(--secondary);
}

.atlas-button-primary {
  background: var(--secondary);
  border-color: var(--secondary);
  color: white;
}

.atlas-button-small {
  min-height: 2.2rem;
  padding: 0.4rem 0.7rem;
}

.atlas-text-button {
  background: transparent;
  border: 0;
  color: var(--secondary);
  min-height: 2rem;
  padding: 0.2rem 0;
}

.atlas-icon-button {
  border-radius: 50%;
  font-size: 1.4rem;
  line-height: 1;
  min-height: 2.4rem;
  padding: 0;
  width: 2.4rem;
}

.atlas-action-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.atlas-focus-exit {
  display: none;
}

.atlas-study-actions {
  border: 1px solid var(--lightgray);
  border-radius: 18px;
  display: grid;
  gap: 0.7rem;
  margin: 2rem 0 0;
  padding: 1rem 1.1rem;
}

.atlas-home-dashboard,
.atlas-view {
  margin: 2rem 0 0;
}

.atlas-dashboard-intro {
  background:
    radial-gradient(circle at 90% 10%, color-mix(in srgb, var(--tertiary) 24%, transparent), transparent 38%),
    color-mix(in srgb, var(--light) 88%, var(--secondary) 12%);
  border: 1px solid var(--lightgray);
  border-radius: 24px;
  display: grid;
  gap: 0.8rem;
  padding: clamp(1.1rem, 3vw, 1.7rem);
}

.atlas-dashboard-intro h2,
.atlas-view-title {
  letter-spacing: -0.035em;
  margin: 0;
}

.atlas-dashboard-intro > p:not(.atlas-kicker),
.atlas-view-description {
  color: var(--darkgray);
  line-height: 1.55;
  margin: 0;
  max-width: 66ch;
}

.atlas-dashboard-section,
.atlas-dashboard-footer {
  display: grid;
  gap: 0.8rem;
  margin-top: 2rem;
}

.atlas-section-heading,
.atlas-overlay-heading,
.atlas-graph-heading,
.atlas-search-result-heading,
.atlas-gap-heading {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.atlas-section-heading h2,
.atlas-overlay-heading h2,
.atlas-graph-heading h3 {
  margin: 0;
}

.atlas-card-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.atlas-card-grid-wide {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.atlas-concept-card,
.atlas-metric-card,
.atlas-map-columns > section,
.atlas-ranked-row,
.atlas-gap-row,
.atlas-search-result,
.atlas-dashboard-footer {
  background: color-mix(in srgb, var(--light) 90%, var(--secondary) 10%);
  border: 1px solid var(--lightgray);
  border-radius: 16px;
}

.atlas-concept-card,
.atlas-search-result,
.atlas-gap-row,
.atlas-dashboard-footer {
  display: grid;
  gap: 0.55rem;
  padding: 0.9rem 1rem;
}

.atlas-concept-card-top {
  align-items: flex-start;
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
}

.atlas-concept-card a,
.atlas-ranked-row a,
.atlas-search-result a,
.atlas-gap-source a,
.atlas-list-row a,
.atlas-map-list-row a,
.atlas-context-item a,
.atlas-context-list a,
.atlas-chip-list a {
  color: var(--secondary);
  font-weight: 700;
}

.atlas-card-area,
.atlas-card-stat,
.atlas-list-meta,
.atlas-metric-label,
.atlas-metric-detail,
.atlas-ranked-counts span,
.atlas-ranked-counts small,
.atlas-preview-label {
  color: var(--gray);
  font-size: 0.76rem;
}

.atlas-card-area,
.atlas-card-excerpt,
.atlas-context-snippet,
.atlas-preview-excerpt,
.atlas-empty,
.atlas-search-summary {
  margin: 0;
}

.atlas-card-excerpt,
.atlas-context-snippet,
.atlas-preview-excerpt {
  color: var(--darkgray);
  font-size: 0.87rem;
  line-height: 1.48;
}

.atlas-card-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.8rem;
}

.atlas-card-stat {
  white-space: nowrap;
}

.atlas-badge {
  background: color-mix(in srgb, var(--secondary) 13%, transparent);
  border-radius: 999px;
  color: var(--secondary);
  font-size: 0.7rem;
  padding: 0.22rem 0.5rem;
  white-space: nowrap;
}

.atlas-list-grid,
.atlas-map-list,
.atlas-context-list,
.atlas-gap-sources,
.atlas-ranked-list,
.atlas-gap-list,
.atlas-advanced-search-results {
  display: grid;
  gap: 0.55rem;
}

.atlas-list-row,
.atlas-map-list-row {
  align-items: center;
  border-bottom: 1px solid var(--lightgray);
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  padding: 0.55rem 0;
}

.atlas-list-row:last-child,
.atlas-map-list-row:last-child {
  border-bottom: 0;
}

.atlas-component-row {
  align-items: flex-start;
}

.atlas-area-grid {
  display: grid;
  gap: 0.7rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.atlas-area-card {
  align-items: flex-start;
  background: transparent;
  border: 1px solid var(--lightgray);
  border-radius: 14px;
  color: var(--dark);
  cursor: pointer;
  display: grid;
  gap: 0.2rem;
  justify-items: start;
  padding: 0.8rem;
  text-align: left;
}

.atlas-area-card:hover {
  border-color: var(--secondary);
}

.atlas-area-card span {
  color: var(--gray);
  font-size: 0.8rem;
}

.atlas-dashboard-footer {
  margin-bottom: 1rem;
}

.atlas-view-header {
  display: grid;
  gap: 0.6rem;
  margin-bottom: 1.2rem;
}

.atlas-metric-grid {
  display: grid;
  gap: 0.7rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 1.2rem 0;
}

.atlas-metric-grid-large {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.atlas-metric-card {
  display: grid;
  gap: 0.2rem;
  padding: 0.9rem;
}

.atlas-metric-value {
  color: var(--secondary);
  font-size: clamp(1.4rem, 4vw, 2rem);
  line-height: 1;
}

.atlas-metric-label {
  color: var(--dark);
  font-weight: 700;
}

.atlas-map-columns {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.atlas-map-columns > section {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
}

.atlas-ranked-row {
  align-items: center;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 3rem minmax(0, 1fr) auto;
  padding: 0.8rem 1rem;
}

.atlas-rank {
  color: var(--tertiary);
  font-family: var(--codeFont);
  font-size: 1.1rem;
  font-weight: 700;
}

.atlas-ranked-copy,
.atlas-ranked-counts {
  display: grid;
  gap: 0.15rem;
}

.atlas-ranked-counts {
  justify-items: end;
  text-align: right;
}

.atlas-ranked-counts strong {
  color: var(--secondary);
  font-size: 1.3rem;
}

.atlas-gap-heading {
  justify-content: flex-start;
}

.atlas-gap-source {
  border-left: 2px solid var(--lightgray);
  display: grid;
  gap: 0.25rem;
  padding-left: 0.7rem;
}

.atlas-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.atlas-chip-list a {
  border: 1px solid var(--lightgray);
  border-radius: 999px;
  padding: 0.4rem 0.65rem;
}

.atlas-advanced-search-form {
  align-items: end;
  background: color-mix(in srgb, var(--light) 90%, var(--secondary) 10%);
  border: 1px solid var(--lightgray);
  border-radius: 16px;
  display: grid;
  gap: 0.7rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 1rem;
}

.atlas-field {
  display: grid;
  gap: 0.3rem;
}

.atlas-field span {
  color: var(--darkgray);
  font-size: 0.76rem;
  font-weight: 700;
}

.atlas-field input,
.atlas-field select,
.atlas-command-input,
.atlas-graph-control input,
.atlas-graph-control select,
.atlas-explorer-controls input,
.atlas-explorer-controls select {
  background: var(--light);
  border: 1px solid var(--lightgray);
  border-radius: 10px;
  box-sizing: border-box;
  color: var(--dark);
  font: inherit;
  min-height: 2.5rem;
  padding: 0.5rem 0.65rem;
  width: 100%;
}

.atlas-field-wide {
  grid-column: span 2;
}

.atlas-search-summary {
  color: var(--gray);
  font-size: 0.86rem;
  margin-top: 1rem;
}

.atlas-search-result-heading {
  justify-content: flex-start;
}

.atlas-overlay {
  inset: 0;
  position: fixed;
  z-index: 1000;
}

.atlas-overlay[hidden],
.atlas-link-preview[hidden] {
  display: none !important;
}

.atlas-overlay-backdrop {
  align-items: start;
  background: color-mix(in srgb, var(--dark) 64%, transparent);
  display: flex;
  inset: 0;
  justify-content: center;
  overflow: auto;
  padding: clamp(1rem, 5vw, 4rem) 1rem;
}

.atlas-command-card,
.atlas-advanced-card {
  background: var(--light);
  border: 1px solid var(--lightgray);
  border-radius: 20px;
  box-shadow: 0 24px 80px color-mix(in srgb, var(--dark) 25%, transparent);
  height: max-content;
  max-width: 58rem;
  padding: 1rem;
  width: min(100%, 58rem);
}

.atlas-command-card {
  max-width: 42rem;
}

.atlas-overlay-heading {
  margin-bottom: 0.9rem;
}

.atlas-command-results {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.7rem;
  max-height: min(60vh, 28rem);
  overflow: auto;
}

.atlas-command-item {
  align-items: flex-start;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 12px;
  display: grid;
  gap: 0.15rem;
  justify-items: start;
  padding: 0.7rem;
  text-align: left;
}

.atlas-command-item:hover,
.atlas-command-item:focus-visible {
  background: color-mix(in srgb, var(--secondary) 10%, transparent);
  border-color: var(--lightgray);
}

.atlas-command-item span,
.atlas-overlay-hint {
  color: var(--gray);
  font-size: 0.78rem;
  margin: 0;
}

.atlas-overlay-hint {
  margin-top: 0.8rem;
}

.atlas-link-preview {
  background: var(--light);
  border: 1px solid var(--secondary);
  border-radius: 16px;
  box-shadow: 0 16px 50px color-mix(in srgb, var(--dark) 24%, transparent);
  display: grid;
  gap: 0.65rem;
  max-height: min(22rem, calc(100vh - 24px));
  overflow: auto;
  padding: 0.9rem;
  position: fixed;
  z-index: 1001;
}

.atlas-preview-heading {
  display: grid;
  gap: 0.2rem;
}

.atlas-preview-heading strong {
  font-size: 1.1rem;
}

.atlas-preview-relations {
  border-top: 1px solid var(--lightgray);
  display: grid;
  gap: 0.25rem;
  padding-top: 0.6rem;
}

.atlas-preview-relations a {
  color: var(--secondary);
  font-size: 0.84rem;
  font-weight: 700;
}

.atlas-graph-mount {
  margin-top: 1rem;
}

.atlas-graph-enhanced {
  background: color-mix(in srgb, var(--light) 88%, var(--secondary) 12%);
  border: 1px solid var(--lightgray);
  border-radius: 18px;
  display: grid;
  gap: 0.7rem;
  overflow: hidden;
  padding: 0.9rem;
  min-width: 0;
  max-width: 100%;
}

.atlas-graph-enhanced.is-fullscreen {
  background: var(--light);
  border-radius: 0;
  inset: 0;
  overflow: auto;
  padding: clamp(1rem, 3vw, 2rem);
  position: fixed;
  z-index: 999;
}

.atlas-graph-heading > div {
  display: grid;
  gap: 0.2rem;
}

.atlas-graph-heading,
.atlas-graph-controls,
.atlas-graph-control,
.atlas-graph-depth,
.atlas-graph-canvas {
  min-width: 0;
  max-width: 100%;
}

.atlas-graph-controls {
  align-items: end;
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.atlas-graph-control,
.atlas-graph-depth {
  display: grid;
  gap: 0.25rem;
}

.atlas-graph-control > span,
.atlas-graph-depth > span {
  color: var(--gray);
  font-size: 0.72rem;
  font-weight: 700;
}

.atlas-graph-depth {
  grid-template-columns: repeat(3, 2rem);
}

.atlas-graph-depth > span {
  grid-column: 1 / -1;
}

.atlas-graph-depth-button {
  border-radius: 8px;
  min-height: 2.5rem;
  padding: 0;
}

.atlas-graph-depth-button.is-active {
  background: var(--secondary);
  border-color: var(--secondary);
  color: white;
}

.atlas-graph-canvas {
  background: color-mix(in srgb, var(--light) 72%, var(--secondary) 28%);
  border: 1px solid var(--lightgray);
  border-radius: 14px;
  min-height: 20rem;
  overflow: hidden;
  position: relative;
}

.atlas-graph-canvas svg {
  display: block;
  height: 100%;
  min-height: 20rem;
  width: 100%;
}

.atlas-graph-empty {
  color: var(--gray);
  inset: 50% 1rem auto;
  margin: 0;
  position: absolute;
  text-align: center;
  transform: translateY(-50%);
}

.atlas-graph-edge {
  stroke: color-mix(in srgb, var(--secondary) 44%, transparent);
  stroke-width: 1.2;
}

.atlas-graph-node {
  cursor: pointer;
  outline: none;
}

.atlas-graph-node circle {
  fill: var(--tertiary);
  stroke: var(--light);
  stroke-width: 2;
}

.atlas-graph-node text {
  fill: var(--dark);
  font-family: var(--bodyFont);
  font-size: 12px;
  pointer-events: none;
}

.atlas-graph-node.is-current circle {
  fill: var(--secondary);
  stroke: var(--dark);
  stroke-width: 3;
}

.atlas-graph-node.is-hub circle {
  fill: #f59e0b;
}

.atlas-graph-node.is-match circle {
  filter: drop-shadow(0 0 5px var(--secondary));
}

.atlas-graph-node:focus-visible circle {
  stroke: var(--dark);
  stroke-width: 4;
}

.atlas-graph-legend {
  align-items: center;
  color: var(--gray);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.72rem;
  gap: 0.5rem 0.8rem;
}

.atlas-legend-item::before {
  background: var(--tertiary);
  border: 1px solid var(--dark);
  border-radius: 50%;
  content: "";
  display: inline-block;
  height: 0.55rem;
  margin-right: 0.25rem;
  vertical-align: -0.05rem;
  width: 0.55rem;
}

.atlas-legend-current::before {
  background: var(--secondary);
}

.atlas-legend-hub::before {
  background: #f59e0b;
}

.atlas-context-panel {
  background: color-mix(in srgb, var(--light) 90%, var(--secondary) 10%);
  border: 1px solid var(--lightgray);
  border-radius: 18px;
  display: grid;
  gap: 0.7rem;
  margin-top: 1rem;
  padding: 0.9rem;
}

.atlas-context-panel[data-open="false"] .atlas-context-tabs,
.atlas-context-panel[data-open="false"] .atlas-context-content {
  display: none;
}

.atlas-context-heading {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.atlas-context-heading h3 {
  margin: 0;
}

.atlas-context-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.atlas-context-tab {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  color: var(--gray);
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
  padding: 0.35rem 0.55rem;
}

.atlas-context-tab.is-active,
.atlas-context-tab:hover {
  background: color-mix(in srgb, var(--secondary) 12%, transparent);
  border-color: var(--lightgray);
  color: var(--secondary);
}

.atlas-context-content {
  display: grid;
  gap: 0.55rem;
  max-height: 22rem;
  overflow: auto;
}

.atlas-context-item {
  border-bottom: 1px solid var(--lightgray);
  display: grid;
  gap: 0.2rem;
  padding: 0.5rem 0;
}

.atlas-context-item:last-child {
  border-bottom: 0;
}

.atlas-explorer-controls {
  display: grid;
  gap: 0.35rem;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  margin: 0.7rem 0;
}

.atlas-explorer-controls input {
  grid-column: 1 / -1;
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

html.atlas-focus-mode .sidebar,
html.atlas-focus-mode .atlas-study-actions,
html.atlas-focus-mode .atlas-graph-fallback,
html.atlas-focus-mode .atlas-graph-mount,
html.atlas-focus-mode .atlas-context-panel,
html.atlas-focus-mode .atlas-footer,
html.atlas-focus-mode footer {
  display: none !important;
}

html.atlas-focus-mode .atlas-focus-exit {
  display: inline-flex;
  position: fixed;
  right: 1rem;
  top: 1rem;
  z-index: 1002;
}

html.atlas-focus-mode .page > #quartz-body {
  grid-template-columns: minmax(0, 1fr);
}

html.atlas-focus-mode .center > article {
  margin-left: auto;
  margin-right: auto;
  max-width: 78ch;
}

@media all and (max-width: 900px) {
  .atlas-card-grid,
  .atlas-card-grid-wide,
  .atlas-map-columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .atlas-metric-grid-large {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .atlas-graph-controls {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .atlas-graph-node-search,
  .atlas-graph-area {
    grid-column: span 1;
  }
}

@media all and (max-width: 600px) {
  .atlas-card-grid,
  .atlas-card-grid-wide,
  .atlas-map-columns,
  .atlas-metric-grid,
  .atlas-metric-grid-large,
  .atlas-advanced-search-form {
    grid-template-columns: 1fr;
  }

  .atlas-field-wide {
    grid-column: auto;
  }

  .atlas-area-grid {
    grid-template-columns: 1fr;
  }

  .atlas-ranked-row {
    align-items: start;
    grid-template-columns: 2.2rem minmax(0, 1fr);
  }

  .atlas-ranked-counts {
    grid-column: 2;
    justify-items: start;
    text-align: left;
  }

  .atlas-graph-controls {
    grid-template-columns: 1fr 1fr;
  }

  .atlas-graph-node-search,
  .atlas-graph-area,
  .atlas-graph-controls > .atlas-button {
    grid-column: 1 / -1;
  }

  .atlas-graph-canvas,
  .atlas-graph-canvas svg {
    min-height: 17rem;
  }

  .atlas-graph-node text {
    display: none;
  }

  .atlas-graph-node.is-current text,
  .atlas-graph-node.is-hub text,
  .atlas-graph-node.is-match text {
    display: block;
    font-size: 10px;
  }

  .atlas-overlay-backdrop {
    padding: 0.6rem;
  }
}

@media all and (min-width: 801px) {
  .right.sidebar {
    max-height: 100vh;
    overflow-y: auto;
  }
}
`

  AtlasStudyShellComponent.afterDOMLoaded = atlasRuntime
  return AtlasStudyShellComponent
}

export const AtlasEnhancedGraph = () => {
  const AtlasEnhancedGraphComponent = () =>
    h("div", { class: "atlas-graph-mount", "aria-label": "Grafo do Atlas" })
  AtlasEnhancedGraphComponent.css = ""
  return AtlasEnhancedGraphComponent
}

export const AtlasContextPanel = () => {
  const AtlasContextPanelComponent = () =>
    h(
      "aside",
      {
        id: "atlas-context-panel",
        class: "atlas-context-panel",
        "aria-labelledby": "atlas-context-title",
        "data-open": "false",
      },
      h(
        "div",
        { class: "atlas-context-heading" },
        h("h3", { id: "atlas-context-title" }, "Painel de estudo"),
        h(
          "button",
          { type: "button", class: "atlas-text-button", "data-atlas-action": "toggle-context" },
          "Mostrar painel",
        ),
      ),
      h(
        "div",
        { class: "atlas-context-tabs", role: "tablist", "aria-label": "Modos do painel" },
        [
          ["summary", "Sumário"],
          ["backlinks", "Links recebidos"],
          ["relations", "Relações"],
          ["graph", "Grafo local"],
          ["recent", "Recentes"],
          ["favorites", "Favoritos"],
        ].map(([value, label]) =>
          h(
            "button",
            {
              type: "button",
              class: "atlas-context-tab",
              role: "tab",
              "aria-selected": value === "summary" ? "true" : "false",
              "data-atlas-context-tab": value,
            },
            label,
          ),
        ),
      ),
      h(
        "div",
        { class: "atlas-context-content" },
        ["summary", "backlinks", "relations", "graph", "recent", "favorites"].map((value) =>
          h("div", { "data-atlas-context-content": value, hidden: value !== "summary" }),
        ),
      ),
    )

  return AtlasContextPanelComponent
}
