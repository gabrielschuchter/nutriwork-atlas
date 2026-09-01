import { Fragment, h } from "preact"
import { resolveRelative, simplifySlug } from "@quartz-community/utils/path"
import atlasRuntime from "../runtime.js"

const DEFAULT_PASSWORD_HASH = "8546caeab1389bb18a5ffd7923802fe181434e69ca868010f83d92c65f7b4cb4"
const DEFAULT_STORAGE_KEY = "nutriwork-atlas-access"

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

function titleOf(file) {
  if (file?.frontmatter?.title) return file.frontmatter.title
  const slug = String(file?.slug ?? "")
  if (!slug) return "Nota sem título"
  let label = slug
  try {
    label = decodeURIComponent(slug)
  } catch {}
  label = label
    .replace(/^atlas\//i, "")
    .replace(/[-_]+/g, " ")
    .trim()
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : "Nota sem título"
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
      document.querySelectorAll(".explorer .folder-title, .explorer .nav-file-title, .breadcrumb-element a").forEach((label) => {
        if (label.textContent?.trim() === "atlas") label.textContent = "Atlas";
      });
      document.querySelectorAll(".binder-tab .binder-label").forEach((label) => {
        const title = label.textContent?.trim() === "atlas" ? "Atlas" : label.textContent?.trim();
        if (title && label.textContent !== title) label.textContent = title;
        const close = label.closest(".binder-tab")?.querySelector(".binder-close");
        if (title && close && close.getAttribute("aria-label") !== "Fechar " + title) {
          close.setAttribute("aria-label", "Fechar " + title);
        }
      });
      if (["atlas", "atlas/index"].includes(document.body?.dataset.slug)) {
        document.querySelectorAll(".article-title").forEach((title) => {
          if (title.textContent?.trim() === "atlas") title.textContent = "Atlas";
        });
        if (document.title === "atlas") document.title = "Atlas";
      }
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
                {
                  type: "button",
                  class: "atlas-button atlas-button-primary",
                  "data-atlas-action": "start-study",
                },
                "Estudar este conceito",
              ),
              h(
                "button",
                { type: "button", class: "atlas-button", "data-atlas-action": "compare" },
                "Comparar",
              ),
              h(
                "button",
                { type: "button", class: "atlas-button", "data-atlas-action": "add-to-list" },
                "Adicionar à lista",
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
              role: "combobox",
              "aria-autocomplete": "list",
              "aria-controls": "atlas-command-results",
              "aria-expanded": "true",
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
      h(
        "div",
        {
          id: "atlas-onboarding",
          class: "atlas-overlay atlas-onboarding-overlay",
          hidden: true,
          "aria-hidden": "true",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "atlas-onboarding-title",
        },
        h(
          "div",
          { class: "atlas-overlay-backdrop" },
          h(
            "section",
            { class: "atlas-onboarding-card", onClick: (event) => event.stopPropagation() },
            h(
              "div",
              { class: "atlas-onboarding-header" },
              h(
                "div",
                null,
                h("p", { class: "atlas-kicker" }, "UM GUIA RÁPIDO"),
                h(
                  "p",
                  { class: "atlas-onboarding-count", id: "atlas-onboarding-count" },
                  "01 / 05",
                ),
              ),
              h(
                "button",
                {
                  type: "button",
                  class: "atlas-icon-button",
                  "data-atlas-action": "close-onboarding",
                  "aria-label": "Fechar apresentação",
                },
                "×",
              ),
            ),
            h(
              "div",
              { class: "atlas-onboarding-slides" },
              h(
                "article",
                { class: "atlas-onboarding-slide is-active", "data-onboarding-slide": "0" },
                h(
                  "div",
                  {
                    class: "atlas-onboarding-visual atlas-onboarding-visual-orbit",
                    "aria-hidden": "true",
                  },
                  h("span"),
                  h("span"),
                  h("span"),
                  h("i"),
                ),
                h("p", { class: "atlas-kicker" }, "NUTRIWORK ATLAS"),
                h("h2", { id: "atlas-onboarding-title" }, "Bem-vindo a uma rede de ideias."),
                h(
                  "p",
                  null,
                  "Um espaço vivo para estudar Nutrição e ciência pelas relações que conectam cada conceito.",
                ),
              ),
              h(
                "article",
                { class: "atlas-onboarding-slide", "data-onboarding-slide": "1" },
                h(
                  "div",
                  {
                    class: "atlas-onboarding-visual atlas-onboarding-visual-search",
                    "aria-hidden": "true",
                  },
                  h("span", null, "⌕"),
                  h("i", null, "ATP"),
                  h("i", null, "energia"),
                  h("i", null, "vias"),
                ),
                h("p", { class: "atlas-kicker" }, "01 · ENCONTRE"),
                h("h2", null, "Explore os conceitos."),
                h(
                  "p",
                  null,
                  "Busque por palavras, filtre por área e siga os links até encontrar o próximo ponto que faz sentido para você.",
                ),
              ),
              h(
                "article",
                { class: "atlas-onboarding-slide", "data-onboarding-slide": "2" },
                h(
                  "div",
                  {
                    class: "atlas-onboarding-visual atlas-onboarding-visual-graph",
                    "aria-hidden": "true",
                  },
                  h(
                    "svg",
                    { viewBox: "0 0 420 190" },
                    h("path", {
                      d: "M74 104 145 56 221 120 300 66 362 124M145 56l76 64M221 120l79-54",
                    }),
                    h("circle", { cx: "74", cy: "104", r: "11" }),
                    h("circle", { cx: "145", cy: "56", r: "8" }),
                    h("circle", { cx: "221", cy: "120", r: "13" }),
                    h("circle", { cx: "300", cy: "66", r: "8" }),
                    h("circle", { cx: "362", cy: "124", r: "9" }),
                  ),
                ),
                h("p", { class: "atlas-kicker" }, "02 · CONECTE"),
                h("h2", null, "Navegue pelo conhecimento."),
                h(
                  "p",
                  null,
                  "Arraste os pontos, aproxime a câmera, passe por um nó para ver um contexto e clique quando quiser entrar na nota.",
                ),
              ),
              h(
                "article",
                { class: "atlas-onboarding-slide", "data-onboarding-slide": "3" },
                h(
                  "div",
                  {
                    class: "atlas-onboarding-visual atlas-onboarding-visual-recall",
                    "aria-hidden": "true",
                  },
                  h("span", null, "Lembrar"),
                  h("span", null, "Revelar"),
                  h("span", null, "Relacionar"),
                ),
                h("p", { class: "atlas-kicker" }, "03 · APRENDA"),
                h("h2", null, "Estude ativamente."),
                h(
                  "p",
                  null,
                  "Monte sessões, tente explicar antes de ler, registre o que foi difícil e volte aos conceitos no momento certo.",
                ),
              ),
              h(
                "article",
                { class: "atlas-onboarding-slide", "data-onboarding-slide": "4" },
                h(
                  "div",
                  {
                    class: "atlas-onboarding-visual atlas-onboarding-visual-start",
                    "aria-hidden": "true",
                  },
                  h("strong", null, "seu ritmo"),
                  h("span", null, "sua rede"),
                  h("i", null, "seu Atlas"),
                ),
                h("p", { class: "atlas-kicker" }, "04 · COMEÇAR"),
                h("h2", null, "A próxima conexão é sua."),
                h(
                  "p",
                  null,
                  "Comece com uma sessão curta ou percorra o grafo. O Atlas guarda seu caminho neste navegador.",
                ),
              ),
            ),
            h(
              "div",
              {
                class: "atlas-onboarding-progress",
                role: "tablist",
                "aria-label": "Etapas da apresentação",
              },
              [0, 1, 2, 3, 4].map((step) =>
                h("button", {
                  type: "button",
                  class: "atlas-onboarding-dot" + (step === 0 ? " is-active" : ""),
                  "data-onboarding-step": String(step),
                  role: "tab",
                  "aria-label": "Ir para etapa " + (step + 1),
                  "aria-selected": step === 0 ? "true" : "false",
                }),
              ),
            ),
            h(
              "div",
              { class: "atlas-onboarding-footer" },
              h(
                "button",
                {
                  type: "button",
                  class: "atlas-text-button",
                  "data-atlas-action": "skip-onboarding",
                },
                "Pular apresentação",
              ),
              h(
                "div",
                { class: "atlas-onboarding-nav" },
                h(
                  "button",
                  {
                    type: "button",
                    class: "atlas-button",
                    "data-atlas-action": "onboarding-prev",
                    disabled: true,
                  },
                  "Voltar",
                ),
                h(
                  "button",
                  {
                    type: "button",
                    class: "atlas-button atlas-button-primary",
                    "data-atlas-action": "onboarding-next",
                  },
                  "Avançar",
                ),
              ),
            ),
          ),
        ),
      ),
      h("div", { id: "atlas-modal-root" }),
      h(
        "div",
        {
          id: "atlas-selection-tools",
          class: "atlas-selection-tools",
          hidden: true,
          role: "toolbar",
          "aria-label": "Ações para o trecho selecionado",
        },
        h("button", { type: "button", "data-atlas-action": "save-highlight" }, "Destacar"),
        h("button", { type: "button", "data-atlas-action": "annotate-selection" }, "Anotar"),
        h(
          "button",
          { type: "button", "data-atlas-action": "create-card-selection" },
          "Criar cartão",
        ),
      ),
      h("div", {
        id: "atlas-toast-region",
        class: "atlas-toast-region",
        role: "status",
        "aria-live": "polite",
        "aria-atomic": "true",
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

.atlas-card-actions {
  display: flex;
  justify-content: flex-end;
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

.atlas-advanced-search-results > * {
  box-sizing: border-box;
  max-width: 100%;
  min-width: 0;
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
  flex-wrap: wrap;
  justify-content: flex-start;
  max-width: 100%;
  min-width: 0;
}

.atlas-search-result-heading > * {
  min-width: 0;
}

.atlas-search-result-heading .atlas-badge {
  white-space: normal;
}

.atlas-overlay {
  inset: 0;
  position: fixed;
  z-index: 1000;
}

body.atlas-overlay-open {
  overflow: hidden;
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
.atlas-command-item:focus-visible,
.atlas-command-item.is-active {
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
  box-sizing: border-box;
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
  box-sizing: border-box;
  inset: 0;
  overflow: auto;
  padding: clamp(1rem, 3vw, 2rem);
  position: fixed;
  width: 100vw;
  height: 100vh;
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
  cursor: grab;
  display: block;
  height: 100%;
  min-height: 20rem;
  touch-action: none;
  width: 100%;
}

.atlas-graph-canvas svg.is-panning {
  cursor: grabbing;
}

.atlas-graph-canvas > .atlas-graph-empty {
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

.atlas-graph-enhanced.is-dense .atlas-graph-node text {
  display: none;
}

.atlas-graph-enhanced.is-dense .atlas-graph-node.is-current text,
.atlas-graph-enhanced.is-dense .atlas-graph-node.is-match text {
  display: block;
  font-size: 10px;
}

.atlas-graph-enhanced.is-dense .atlas-graph-node.is-hub:not(.is-current):not(.is-match) text {
  display: none;
}

.atlas-graph-enhanced.is-dense .atlas-graph-node:hover text,
.atlas-graph-enhanced.is-dense .atlas-graph-node:focus-visible text {
  display: block;
  font-size: 10px;
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
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-between;
}

.atlas-context-heading h3 {
  overflow-wrap: anywhere;
  margin: 0;
}

.atlas-context-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.atlas-context-tab {
  align-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  color: var(--gray);
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 0.75rem;
  min-height: 2.75rem;
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

/* Atlas product layer */
.atlas-frame:has(#atlas-home-dashboard) .atlas-before-body .breadcrumb-container,
.atlas-frame:has(#atlas-home-dashboard) .atlas-before-body .article-title,
.atlas-frame:has(#atlas-home-dashboard) .atlas-before-body .content-meta {
  display: none;
}

.atlas-frame:has(#atlas-home-dashboard) .atlas-context-rail {
  display: none;
}

.atlas-frame:has(#atlas-home-dashboard) .atlas-graph-fallback {
  display: none;
}

.atlas-frame:has(#atlas-view[data-view="graph"]) .atlas-context-rail {
  display: none;
}

.atlas-frame:has(#atlas-view[data-view="graph"]) .atlas-graph-fallback {
  display: none;
}

/* Stacked Pages is useful while reading concepts, but its binder chrome should
   not compete with the Atlas product surfaces and dashboards. */
body:has(#atlas-home-dashboard) .page,
body:has(#atlas-view) .page {
  padding-left: 0;
  padding-right: 0;
}

body:has(#atlas-home-dashboard) #stacked-pages-container,
body:has(#atlas-view) #stacked-pages-container {
  display: none !important;
}

html:not(.atlas-focus-mode) .atlas-focus-exit {
  display: none !important;
}

html.atlas-focus-mode .atlas-frame {
  grid-template-columns: minmax(0, 1fr) !important;
}

html.atlas-focus-mode .atlas-sidebar,
html.atlas-focus-mode .atlas-topbar,
html.atlas-focus-mode .atlas-context-rail {
  display: none !important;
}

html.atlas-onboarding-open #atlas-access-logout,
html.atlas-overlay-open #atlas-access-logout,
html.atlas-modal-open #atlas-access-logout {
  display: none !important;
}

html.atlas-focus-mode .atlas-content-column {
  padding-top: clamp(2rem, 7vw, 5rem);
}

html[data-atlas-access="unlocked"] .atlas-access-logout {
  align-items: center;
  background: color-mix(in srgb, var(--atlas-surface-strong) 72%, transparent);
  border-color: var(--atlas-line);
  color: var(--atlas-muted);
  font-size: .64rem;
  min-height: 2.15rem;
  padding: .4rem .7rem;
  transition: background 220ms ease, border-color 220ms ease, color 220ms ease, opacity 220ms ease, transform 220ms ease;
}

html[data-atlas-access="unlocked"] .atlas-access-logout:hover,
html[data-atlas-access="unlocked"] .atlas-access-logout:focus-visible {
  background: color-mix(in srgb, var(--atlas-blue) 9%, var(--atlas-surface-strong));
  border-color: var(--atlas-line-strong);
  color: var(--atlas-ink);
  transform: translateY(-1px);
}

@media all and (min-width: 801px) {
  html[data-atlas-access="unlocked"] .atlas-access-logout {
    bottom: 1.05rem !important;
    left: 1rem !important;
    position: fixed !important;
    right: auto !important;
  }
}

@media all and (max-width: 800px) {
  html[data-atlas-access="unlocked"] body:not(.atlas-sidebar-open) .atlas-access-logout {
    opacity: 0 !important;
    pointer-events: none !important;
    transform: translateY(5px);
  }

  html[data-atlas-access="unlocked"] body.atlas-sidebar-open .atlas-access-logout {
    bottom: 1rem !important;
    left: 1rem !important;
    position: fixed !important;
    right: auto !important;
  }
}

.atlas-content-column > article:has(#atlas-home-dashboard),
.atlas-content-column > article:has(#atlas-view) {
  max-width: 92rem;
}

.atlas-home,
.atlas-dashboard-view,
#atlas-view {
  animation: atlas-page-enter 560ms cubic-bezier(.22, 1, .36, 1) both;
}

.atlas-home {
  margin: 0 auto;
  max-width: 92rem;
  padding: clamp(2rem, 4vw, 4.7rem) 0 2rem;
}

.atlas-home-hero {
  align-items: center;
  display: grid;
  gap: clamp(2rem, 6vw, 7rem);
  grid-template-columns: minmax(0, 1.1fr) minmax(16rem, .9fr);
  min-height: 25rem;
  overflow: hidden;
  padding: clamp(1.5rem, 4vw, 3.5rem) 0;
  position: relative;
}

.atlas-home-hero::after {
  background: linear-gradient(90deg, var(--atlas-blue), transparent);
  bottom: 0;
  content: "";
  height: 1px;
  left: 0;
  opacity: .45;
  position: absolute;
  width: min(34rem, 80%);
}

.atlas-home-hero-copy {
  max-width: 42rem;
  position: relative;
  z-index: 1;
}

.atlas-home-hero h1 {
  color: var(--atlas-ink);
  font-size: clamp(2.7rem, 5.2vw, 5.4rem);
  letter-spacing: -.075em;
  line-height: .94;
  margin: 1rem 0 1.4rem;
  max-width: 12ch;
}

.atlas-home-lede {
  color: var(--atlas-copy);
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  line-height: 1.65;
  margin: 0;
  max-width: 36rem;
}

.atlas-home-hero .atlas-action-row {
  margin-top: 2rem;
}

.atlas-home-hero-orb {
  align-items: center;
  aspect-ratio: 1;
  display: flex;
  justify-content: center;
  justify-self: center;
  max-width: 24rem;
  min-width: 15rem;
  position: relative;
  width: min(100%, 24rem);
}

.atlas-home-hero-orb::before,
.atlas-home-hero-orb::after {
  border: 1px solid var(--atlas-line-strong);
  border-radius: 50%;
  content: "";
  inset: 7%;
  position: absolute;
  transform: rotate(-24deg) scaleX(1.18);
}

.atlas-home-hero-orb::after {
  border-color: color-mix(in srgb, var(--atlas-blue-bright) 55%, transparent);
  inset: 16%;
  transform: rotate(40deg) scaleX(1.2);
}

.atlas-home-hero-orb > i {
  background: var(--atlas-blue-bright);
  border-radius: 50%;
  box-shadow: 0 0 0 .4rem var(--atlas-glow), 0 0 2.8rem var(--atlas-blue-bright);
  height: .46rem;
  position: absolute;
  width: .46rem;
}

.atlas-home-hero-orb > i:nth-child(1) { left: 14%; top: 31%; }
.atlas-home-hero-orb > i:nth-child(2) { right: 17%; top: 24%; transform: scale(.7); }
.atlas-home-hero-orb > i:nth-child(3) { bottom: 18%; left: 25%; transform: scale(.8); }
.atlas-home-hero-orb > i:nth-child(4) { bottom: 30%; right: 13%; transform: scale(1.35); }
.atlas-home-hero-orb > i:nth-child(5) { left: 50%; top: 8%; transform: scale(.55); }

.atlas-home-hero-orb strong {
  align-items: center;
  color: var(--atlas-ink);
  display: flex;
  flex-direction: column;
  font-family: var(--codeFont);
  font-size: clamp(2.2rem, 5vw, 4.5rem);
  letter-spacing: -.09em;
  line-height: 1;
  position: relative;
  z-index: 1;
}

.atlas-home-hero-orb strong span {
  color: var(--atlas-muted);
  font-family: var(--bodyFont);
  font-size: .65rem;
  font-weight: 500;
  letter-spacing: .04em;
  margin-top: .5rem;
}

.atlas-home-metrics,
.atlas-metric-grid,
.atlas-structure-grid {
  display: grid;
  gap: .8rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 1.25rem 0;
}

.atlas-metric-card {
  background: color-mix(in srgb, var(--atlas-surface-strong) 72%, transparent);
  border: 1px solid var(--atlas-line);
  border-radius: 1.1rem;
  display: flex;
  flex-direction: column;
  min-height: 6.3rem;
  padding: 1rem 1.05rem;
  transition: border-color 220ms ease, transform 220ms ease, box-shadow 220ms ease;
}

.atlas-metric-card:hover {
  border-color: var(--atlas-line-strong);
  box-shadow: 0 16px 36px var(--atlas-glow);
  transform: translateY(-2px);
}

.atlas-metric-value {
  color: var(--atlas-ink);
  font-family: var(--codeFont);
  font-size: clamp(1.55rem, 3vw, 2.25rem);
  letter-spacing: -.08em;
  line-height: 1;
}

.atlas-metric-label {
  color: var(--atlas-copy);
  font-size: .78rem;
  margin-top: .65rem;
}

.atlas-metric-detail,
.atlas-card-stat,
.atlas-card-area,
.atlas-list-meta {
  color: var(--atlas-muted);
  font-size: .68rem;
}

.atlas-home-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1.45fr) minmax(18rem, .55fr);
  margin-top: 1.5rem;
}

.atlas-home-main,
.atlas-home-side {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.atlas-home-section,
.atlas-home-side-card,
.atlas-view-section,
.atlas-note-card,
.atlas-dashboard-summary,
.atlas-paths-intro {
  background: color-mix(in srgb, var(--atlas-surface) 88%, transparent);
  border: 1px solid var(--atlas-line);
  border-radius: 1.35rem;
  padding: clamp(1.05rem, 2.5vw, 1.7rem);
}

.atlas-section-heading {
  align-items: end;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 1.1rem;
}

.atlas-section-heading h2 {
  color: var(--atlas-ink);
  font-size: clamp(1.15rem, 2vw, 1.55rem);
  letter-spacing: -.04em;
  margin: .25rem 0 0;
}

.atlas-resume-card,
.atlas-recommendation-card {
  background: linear-gradient(135deg, color-mix(in srgb, var(--atlas-blue) 13%, var(--atlas-surface-strong)), color-mix(in srgb, var(--atlas-blue-bright) 5%, var(--atlas-surface-strong)));
  border: 1px solid var(--atlas-line-strong);
  border-radius: 1.05rem;
  padding: 1.2rem;
  position: relative;
  overflow: hidden;
}

.atlas-resume-card::after,
.atlas-recommendation-card::after {
  border: 1px solid var(--atlas-line-strong);
  border-radius: 50%;
  content: "";
  height: 12rem;
  position: absolute;
  right: -5rem;
  top: -6rem;
  width: 12rem;
}

.atlas-resume-eyebrow,
.atlas-preview-eyebrow,
.atlas-onboarding-count {
  color: var(--atlas-blue);
  display: block;
  font-family: var(--codeFont);
  font-size: .64rem;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.atlas-resume-title,
.atlas-recommendation-title {
  color: var(--atlas-ink);
  display: block;
  font-size: clamp(1.4rem, 3vw, 2.2rem);
  font-weight: 700;
  letter-spacing: -.06em;
  line-height: 1.05;
  margin: .7rem 0 .5rem;
  max-width: 15ch;
  position: relative;
  text-decoration: none;
  z-index: 1;
}

.atlas-resume-card p,
.atlas-recommendation-card p,
.atlas-note-card p,
.atlas-dashboard-summary span,
.atlas-paths-intro p {
  color: var(--atlas-copy);
  line-height: 1.55;
}

.atlas-card-grid,
.atlas-path-grid,
.atlas-card-grid-wide {
  display: grid;
  gap: .8rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.atlas-path-grid-large {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 1.2rem;
}

.atlas-concept-card,
.atlas-path-card,
.atlas-personal-list,
.atlas-flashcard,
.atlas-highlight-card {
  background: color-mix(in srgb, var(--atlas-surface-strong) 62%, transparent);
  border: 1px solid var(--atlas-line);
  border-radius: 1rem;
  min-width: 0;
  padding: 1rem;
  transition: border-color 220ms ease, box-shadow 220ms ease, transform 220ms ease;
}

.atlas-concept-card:hover,
.atlas-path-card:hover,
.atlas-personal-list:hover,
.atlas-flashcard:hover,
.atlas-highlight-card:hover {
  border-color: var(--atlas-line-strong);
  box-shadow: 0 18px 40px var(--atlas-glow);
  transform: translateY(-3px);
}

.atlas-concept-card-top,
.atlas-path-card-top,
.atlas-card-footer,
.atlas-personal-list-header,
.atlas-preview-footer,
.atlas-session-progress,
.atlas-modal-footer,
.atlas-dashboard-summary,
.atlas-review-summary,
.atlas-paths-intro {
  align-items: center;
  display: flex;
  gap: .75rem;
  justify-content: space-between;
}

.atlas-concept-card-copy {
  min-width: 0;
}

.atlas-card-title,
.atlas-study-link {
  color: var(--atlas-ink);
  text-decoration: none;
}

.atlas-card-title {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
}

.atlas-card-title:hover,
.atlas-study-link:hover {
  color: var(--atlas-blue);
}

.atlas-card-excerpt {
  color: var(--atlas-copy);
  display: -webkit-box;
  font-size: .78rem;
  line-height: 1.55;
  margin: .85rem 0;
  max-height: 3.7em;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.atlas-card-footer {
  border-top: 1px solid var(--atlas-line);
  margin-top: 1rem;
  padding-top: .75rem;
}

.atlas-status-chip,
.atlas-badge {
  background: color-mix(in srgb, var(--atlas-blue) 10%, transparent);
  border: 1px solid var(--atlas-line);
  border-radius: 999px;
  color: var(--atlas-blue);
  display: inline-flex;
  font-family: var(--codeFont);
  font-size: .59rem;
  letter-spacing: .03em;
  padding: .28rem .5rem;
  white-space: nowrap;
}

.atlas-status-chip.is-due { background: rgba(239, 102, 84, .12); border-color: rgba(239, 102, 84, .3); color: #f28370; }
.atlas-status-chip.is-mastered { background: rgba(66, 190, 151, .12); border-color: rgba(66, 190, 151, .3); color: #42be97; }
.atlas-status-chip.is-learning { background: rgba(247, 184, 74, .12); border-color: rgba(247, 184, 74, .3); color: #e7ad3d; }

.atlas-card-action,
.atlas-text-button,
.atlas-graph-action,
.atlas-graph-recall-action {
  background: transparent;
  border: 0;
  color: var(--atlas-blue);
  cursor: pointer;
  font: inherit;
  font-size: .72rem;
  font-weight: 700;
  padding: .3rem 0;
  text-decoration: none;
  transition: color 180ms ease, transform 180ms ease;
}

.atlas-card-action:hover,
.atlas-text-button:hover,
.atlas-graph-action:hover,
.atlas-graph-recall-action:hover {
  color: var(--atlas-blue-bright);
  transform: translateX(2px);
}

.atlas-button,
.atlas-icon-button {
  align-items: center;
  background: color-mix(in srgb, var(--atlas-surface-strong) 82%, transparent);
  border: 1px solid var(--atlas-line);
  border-radius: 999px;
  color: var(--atlas-ink);
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: .75rem;
  font-weight: 650;
  gap: .45rem;
  justify-content: center;
  min-height: 2.55rem;
  padding: .55rem 1rem;
  transition: background 220ms ease, border-color 220ms ease, box-shadow 220ms ease, color 220ms ease, transform 220ms ease;
}

.atlas-button:hover,
.atlas-icon-button:hover,
.atlas-button:focus-visible,
.atlas-icon-button:focus-visible {
  border-color: var(--atlas-line-strong);
  box-shadow: 0 10px 25px var(--atlas-glow);
  transform: translateY(-1px);
}

.atlas-button-primary {
  background: linear-gradient(120deg, var(--atlas-blue), var(--atlas-blue-bright));
  border-color: transparent;
  color: #fff;
}

.atlas-button-quiet {
  background: color-mix(in srgb, var(--atlas-blue) 8%, transparent);
  color: var(--atlas-blue);
}

.atlas-icon-button {
  border-radius: 50%;
  min-height: 2.45rem;
  min-width: 2.45rem;
  padding: .55rem;
}

.atlas-icon {
  height: 1.05rem;
  width: 1.05rem;
}

.atlas-empty-state {
  align-items: flex-start;
  background: color-mix(in srgb, var(--atlas-blue) 5%, transparent);
  border: 1px dashed var(--atlas-line-strong);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  gap: .45rem;
  padding: 1.25rem;
}

.atlas-empty-state h3 {
  color: var(--atlas-ink);
  margin: .25rem 0 0;
}

.atlas-empty-state p,
.atlas-empty-copy,
.atlas-search-summary {
  color: var(--atlas-muted);
  font-size: .8rem;
  line-height: 1.55;
  margin: 0;
}

.atlas-empty-orbit {
  align-items: center;
  border: 1px solid var(--atlas-line-strong);
  border-radius: 50%;
  color: var(--atlas-blue);
  display: inline-flex;
  height: 2rem;
  justify-content: center;
  width: 2rem;
}

.atlas-home-side-card .atlas-section-heading { align-items: start; }
.atlas-side-number {
  color: var(--atlas-ink);
  display: block;
  font-family: var(--codeFont);
  font-size: 4rem;
  letter-spacing: -.1em;
  line-height: .9;
  margin: 1.5rem 0 .7rem;
}

.atlas-home-side-card p { color: var(--atlas-copy); font-size: .8rem; line-height: 1.55; }
.atlas-mini-list { display: grid; gap: .2rem; }
.atlas-mini-row { align-items: center; border-bottom: 1px solid var(--atlas-line); display: flex; gap: .6rem; justify-content: space-between; padding: .58rem 0; }
.atlas-mini-row > a { font-size: .75rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.atlas-mini-row > span { color: var(--atlas-muted); font-size: .62rem; white-space: nowrap; }

.atlas-area-grid {
  display: grid;
  gap: .45rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.atlas-area-card {
  align-items: flex-start;
  background: color-mix(in srgb, var(--atlas-surface-strong) 42%, transparent);
  border: 1px solid var(--atlas-line);
  border-radius: .75rem;
  color: var(--atlas-ink);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: .25rem;
  min-height: 4.4rem;
  padding: .7rem;
  text-align: left;
  transition: background 180ms ease, border-color 180ms ease, transform 180ms ease;
}

.atlas-area-card:hover { background: color-mix(in srgb, var(--atlas-blue) 10%, transparent); border-color: var(--atlas-line-strong); transform: translateY(-2px); }
.atlas-area-card strong { font-size: .73rem; line-height: 1.25; }
.atlas-area-card span { color: var(--atlas-muted); font-size: .61rem; }

.atlas-home-graph-section { margin-top: 1rem; }
.atlas-dashboard-summary { align-items: center; margin: 1.2rem 0; }
.atlas-dashboard-summary strong { color: var(--atlas-ink); font-size: 1.15rem; }
.atlas-dashboard-summary span { font-size: .78rem; margin-left: auto; }
.atlas-review-summary { align-items: stretch; gap: .8rem; margin: 1.3rem 0; }
.atlas-review-summary .atlas-metric-card { flex: 1; }
.atlas-review-summary > .atlas-button { align-self: center; }
.atlas-paths-intro { align-items: center; margin-top: 1rem; }
.atlas-paths-intro p { margin: 0; max-width: 45rem; }
.atlas-path-index { color: var(--atlas-blue); font-family: var(--codeFont); font-size: 1.8rem; letter-spacing: -.08em; }
.atlas-path-card h3 { color: var(--atlas-ink); font-size: 1.25rem; letter-spacing: -.045em; margin: 1.1rem 0 .3rem; }
.atlas-path-card p { min-height: 3.7em; }
.atlas-progress-bar { background: color-mix(in srgb, var(--atlas-ink) 9%, transparent); border-radius: 999px; height: .32rem; overflow: hidden; width: 100%; }
.atlas-progress-bar span { background: linear-gradient(90deg, var(--atlas-blue), var(--atlas-blue-bright)); border-radius: inherit; display: block; height: 100%; transition: width 500ms cubic-bezier(.22, 1, .36, 1); }

.atlas-graph-shell {
  background: color-mix(in srgb, var(--atlas-surface) 88%, transparent);
  border: 1px solid var(--atlas-line);
  border-radius: 1.35rem;
  min-width: 0;
  overflow: hidden;
  padding: clamp(.8rem, 2vw, 1.3rem);
  position: relative;
}

.atlas-graph-header { align-items: flex-start; display: flex; gap: 1rem; justify-content: space-between; padding: .45rem .2rem 1rem; }
.atlas-graph-header h2 { color: var(--atlas-ink); font-size: clamp(1.3rem, 2.5vw, 2rem); letter-spacing: -.06em; margin: .25rem 0 .4rem; }
.atlas-graph-subtitle { color: var(--atlas-muted); font-size: .76rem; line-height: 1.45; margin: 0; max-width: 32rem; }
.atlas-graph-actions { align-items: center; display: flex; flex-wrap: wrap; gap: .4rem; justify-content: flex-end; }
.atlas-graph-action { border: 1px solid var(--atlas-line); border-radius: 999px; padding: .5rem .75rem; }
.atlas-graph-icon-action { min-height: 2.2rem; min-width: 2.2rem; }
.atlas-graph-recall-action { background: color-mix(in srgb, var(--atlas-blue) 9%, transparent); border-radius: 999px; padding: .5rem .75rem; }
.atlas-graph-control-panel { border-top: 1px solid var(--atlas-line); display: grid; gap: .9rem; padding: 1rem .2rem; }
.atlas-graph-control-heading { align-items: baseline; display: flex; gap: .7rem; }
.atlas-graph-control-hint { color: var(--atlas-muted); font-size: .68rem; }
.atlas-graph-selects { display: grid; gap: .6rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.atlas-graph-select-field,
.atlas-form-field { display: grid; gap: .35rem; min-width: 0; }
.atlas-graph-select-field > span,
.atlas-form-field > span,
.atlas-form-label { color: var(--atlas-muted); font-family: var(--codeFont); font-size: .64rem; letter-spacing: .06em; text-transform: uppercase; }
.atlas-graph-select-field select,
.atlas-form-field select,
.atlas-form-field input,
.atlas-form-field textarea,
.atlas-search-input,
.atlas-command-input { background: color-mix(in srgb, var(--atlas-surface-strong) 80%, transparent); border: 1px solid var(--atlas-line); border-radius: .65rem; box-sizing: border-box; color: var(--atlas-ink); font: inherit; min-height: 2.45rem; padding: .55rem .7rem; width: 100%; }
.atlas-form-field textarea { min-height: 8rem; resize: vertical; }
.atlas-graph-sliders { display: grid; gap: .65rem .9rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.atlas-graph-slider { display: grid; gap: .35rem; }
.atlas-graph-slider-label { align-items: center; color: var(--atlas-copy); display: flex; font-size: .67rem; justify-content: space-between; }
.atlas-graph-slider-label output { color: var(--atlas-blue); font-family: var(--codeFont); }
.atlas-graph-slider input[type="range"] { appearance: none; background: color-mix(in srgb, var(--atlas-ink) 13%, transparent); border-radius: 999px; cursor: pointer; height: .3rem; margin: .3rem 0; outline: none; width: 100%; }
.atlas-graph-slider input[type="range"]::-webkit-slider-thumb { appearance: none; background: var(--atlas-blue-bright); border: 2px solid var(--atlas-bg); border-radius: 50%; box-shadow: 0 0 0 .2rem var(--atlas-glow); height: .85rem; width: .85rem; }
.atlas-graph-slider input[type="range"]::-moz-range-thumb { background: var(--atlas-blue-bright); border: 2px solid var(--atlas-bg); border-radius: 50%; box-shadow: 0 0 0 .2rem var(--atlas-glow); height: .85rem; width: .85rem; }
.atlas-graph-slider input[type="range"]:focus-visible { box-shadow: 0 0 0 3px var(--atlas-glow); }
.atlas-graph-canvas { background: radial-gradient(circle at 50% 45%, var(--atlas-glow), transparent 36%), color-mix(in srgb, var(--atlas-bg) 50%, transparent); border: 1px solid var(--atlas-line); border-radius: 1rem; min-height: clamp(23rem, 48vw, 39rem); overflow: hidden; position: relative; }
.atlas-graph-svg { display: block; height: 100%; min-height: inherit; overflow: visible; touch-action: none; user-select: none; width: 100%; }
.atlas-graph-canvas:focus-visible { box-shadow: inset 0 0 0 2px var(--atlas-blue); outline: none; }
.atlas-graph-shell.is-reheating .atlas-graph-canvas { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--atlas-blue) 25%, transparent), inset 0 0 5rem color-mix(in srgb, var(--atlas-blue) 7%, transparent); }
.atlas-graph-edge { fill: none; opacity: var(--atlas-edge-opacity, .72); stroke: var(--atlas-blue-soft); stroke-linecap: round; stroke-width: 1.25; transition: opacity 240ms ease, stroke 240ms ease, stroke-width 240ms ease; vector-effect: non-scaling-stroke; }
.atlas-graph-edge.is-entering { opacity: 0; }
.atlas-graph-edge.is-exiting { opacity: 0; }
.atlas-graph-edge.is-related { opacity: 1; stroke: var(--atlas-blue-bright); stroke-width: 2.8; }
.atlas-graph-node { cursor: grab; outline: none; transition: opacity 240ms ease; }
.atlas-graph-node:active { cursor: grabbing; }
.atlas-graph-node.is-entering { opacity: 0; }
.atlas-graph-node.is-exiting { opacity: 0; pointer-events: none; }
.atlas-graph-node.is-dragging { cursor: grabbing; opacity: 1; }
.atlas-graph-node-dot { fill: var(--atlas-blue); stroke: var(--atlas-bg); stroke-width: 3; transition: fill 220ms ease, r 220ms ease, stroke 220ms ease; }
.atlas-graph-node-halo { fill: var(--atlas-glow); opacity: 0; transition: opacity 220ms ease, r 220ms ease; }
.atlas-graph-node-pin { fill: var(--atlas-blue-bright); opacity: 0; stroke: var(--atlas-bg); stroke-width: 2; transition: opacity 220ms ease, r 220ms ease; }
.atlas-graph-node-label { fill: var(--atlas-copy); font-family: var(--bodyFont); font-size: 15px; font-weight: 600; pointer-events: none; text-anchor: middle; transition: fill 220ms ease, opacity 220ms ease; }
.atlas-graph-node:hover .atlas-graph-node-halo,
.atlas-graph-node:focus .atlas-graph-node-halo,
.atlas-graph-node.is-selected .atlas-graph-node-halo { opacity: 1; }
.atlas-graph-node:hover .atlas-graph-node-dot,
.atlas-graph-node:focus .atlas-graph-node-dot,
.atlas-graph-node.is-selected .atlas-graph-node-dot { fill: var(--atlas-blue-bright); stroke: #fff; }
.atlas-graph-node.is-dimmed { opacity: .14; }
.atlas-graph-node.is-related .atlas-graph-node-label { fill: var(--atlas-ink); }
.atlas-graph-node.is-current .atlas-graph-node-dot { fill: var(--atlas-blue-bright); }
.atlas-graph-node.is-mastered .atlas-graph-node-dot { fill: #42be97; }
.atlas-graph-node.is-due .atlas-graph-node-dot { fill: #f28370; }
.atlas-graph-node.is-learning .atlas-graph-node-dot { fill: #e7ad3d; }
.atlas-graph-node.is-hub .atlas-graph-node-dot { stroke-width: 4; }
.atlas-graph-node.is-pinned .atlas-graph-node-pin { opacity: 1; }
.atlas-graph-node.is-pinned .atlas-graph-node-dot { stroke-dasharray: 2 2; }
.atlas-graph-node.is-dragging .atlas-graph-node-halo { opacity: 1; }
.atlas-graph-node.is-dragging .atlas-graph-node-dot { fill: var(--atlas-blue-bright); stroke: #fff; stroke-width: 4; }
.atlas-graph-shell.is-dense .atlas-graph-edge { opacity: calc(var(--atlas-edge-opacity, .72) * .26); stroke-width: .9; }
.atlas-graph-shell.is-dense .atlas-graph-node-label { opacity: 0; }
.atlas-graph-shell.is-dense .atlas-graph-node.is-current .atlas-graph-node-label,
.atlas-graph-shell.is-dense .atlas-graph-node.is-hub .atlas-graph-node-label,
.atlas-graph-shell.is-dense .atlas-graph-node.is-selected .atlas-graph-node-label,
.atlas-graph-shell.is-dense .atlas-graph-node.is-related .atlas-graph-node-label,
.atlas-graph-shell.is-dense .atlas-graph-node:hover .atlas-graph-node-label,
.atlas-graph-shell.is-dense .atlas-graph-node:focus-visible .atlas-graph-node-label { opacity: 1; }
.atlas-graph-shell.is-dense .atlas-graph-edge.is-related { opacity: 1; stroke-width: 2.8; }
.atlas-graph-footer { align-items: center; display: flex; gap: 1rem; justify-content: space-between; padding: .8rem .2rem .1rem; }
.atlas-graph-legend { display: flex; flex-wrap: wrap; gap: .65rem; }
.atlas-graph-legend-item { align-items: center; color: var(--atlas-muted); display: inline-flex; font-size: .62rem; gap: .3rem; }
.atlas-graph-legend-dot { background: var(--atlas-blue); border-radius: 50%; display: block; height: .42rem; width: .42rem; }
.atlas-graph-legend-dot.is-learning { background: #e7ad3d; }
.atlas-graph-legend-dot.is-due { background: #f28370; }
.atlas-graph-legend-dot.is-mastered { background: #42be97; }
.atlas-graph-help { color: var(--atlas-muted); font-size: .63rem; }
.atlas-graph-loader { align-items: center; backdrop-filter: blur(6px); background: color-mix(in srgb, var(--atlas-bg) 85%, transparent); display: flex; flex-direction: column; gap: .55rem; inset: 0; justify-content: center; position: absolute; transition: opacity 420ms ease, visibility 420ms ease; z-index: 2; }
.atlas-graph-loader span { background: var(--atlas-blue); border-radius: 50%; box-shadow: 0 0 0 .35rem var(--atlas-glow); height: .45rem; opacity: .25; width: .45rem; }
.atlas-graph-loader span:nth-child(1) { animation: atlas-loader-pulse 1s .05s infinite; }
.atlas-graph-loader span:nth-child(2) { animation: atlas-loader-pulse 1s .2s infinite; }
.atlas-graph-loader span:nth-child(3) { animation: atlas-loader-pulse 1s .35s infinite; }
.atlas-graph-loader p { color: var(--atlas-muted); font-family: var(--codeFont); font-size: .65rem; margin: .4rem 0 0; }
.atlas-graph-loader.is-complete { opacity: 0; pointer-events: none; visibility: hidden; }
.atlas-graph-shell.is-fullscreen { background: var(--atlas-bg); border-radius: 0; inset: 0; overflow: auto; padding: clamp(1rem, 3vw, 2rem); position: fixed; z-index: 1100; }
.atlas-graph-shell.is-fullscreen .atlas-graph-canvas { min-height: calc(100vh - 15rem); }

.atlas-link-preview { background: color-mix(in srgb, var(--atlas-surface-strong) 94%, transparent); border: 1px solid var(--atlas-line-strong); border-radius: 1rem; box-shadow: 0 22px 70px rgba(0, 0, 0, .22); max-width: 21rem; opacity: 0; padding: 1rem; pointer-events: none; position: fixed; transform: translateY(7px) scale(.97); transition: opacity 220ms ease, transform 260ms cubic-bezier(.22, 1, .36, 1); width: calc(100vw - 28px); z-index: 1400; }
.atlas-link-preview.is-open { opacity: 1; pointer-events: auto; transform: translateY(0) scale(1); }
.atlas-link-preview h3 { color: var(--atlas-ink); font-size: 1.1rem; letter-spacing: -.04em; margin: .45rem 0 .2rem; }
.atlas-preview-excerpt { color: var(--atlas-copy); font-size: .75rem; line-height: 1.55; margin: .8rem 0; }
.atlas-preview-relations { border-top: 1px solid var(--atlas-line); display: grid; gap: .3rem; margin-top: .8rem; padding-top: .65rem; }
.atlas-preview-relations a { font-size: .7rem; }
.atlas-preview-footer { border-top: 1px solid var(--atlas-line); margin-top: .8rem; padding-top: .7rem; }

.atlas-overlay,
.atlas-modal-overlay { align-items: flex-start; background: rgba(1, 2, 6, .56); display: flex; inset: 0; justify-content: center; opacity: 0; overflow: auto; padding: clamp(1rem, 6vh, 5rem) 1rem 2rem; pointer-events: none; position: fixed; transition: opacity 240ms ease, visibility 240ms ease; visibility: hidden; z-index: 1200; }
.atlas-overlay.is-open,
.atlas-modal-overlay { opacity: 1; pointer-events: auto; visibility: visible; }
.atlas-overlay-backdrop { align-items: flex-start; display: flex; inset: 0; justify-content: center; padding: inherit; position: absolute; }
.atlas-command-card,
.atlas-advanced-card,
.atlas-onboarding-card,
.atlas-modal-card { background: color-mix(in srgb, var(--atlas-surface-strong) 97%, transparent); border: 1px solid var(--atlas-line-strong); border-radius: 1.4rem; box-shadow: 0 30px 100px rgba(0, 0, 0, .28); max-height: calc(100vh - 4rem); overflow: auto; position: relative; transform: translateY(14px) scale(.98); transition: transform 360ms cubic-bezier(.22, 1, .36, 1); width: min(100%, 43rem); z-index: 1; }
.atlas-overlay.is-open .atlas-command-card,
.atlas-overlay.is-open .atlas-advanced-card,
.atlas-overlay.is-open .atlas-onboarding-card,
.atlas-modal-overlay .atlas-modal-card { transform: translateY(0) scale(1); }
.atlas-command-card,
.atlas-advanced-card { padding: clamp(1rem, 3vw, 1.6rem); }
.atlas-overlay-heading,
.atlas-modal-header,
.atlas-onboarding-header { align-items: flex-start; display: flex; justify-content: space-between; }
.atlas-overlay-heading h2,
.atlas-modal-header h2 { color: var(--atlas-ink); font-size: clamp(1.4rem, 4vw, 2.1rem); letter-spacing: -.06em; margin: .3rem 0 1rem; }
.atlas-command-input { font-size: 1rem; margin-bottom: .8rem; min-height: 3.2rem; }
.atlas-command-results { display: grid; gap: .28rem; max-height: 25rem; overflow-y: auto; }
.atlas-palette-command { align-items: center; background: transparent; border: 1px solid transparent; border-radius: .8rem; color: var(--atlas-ink); cursor: pointer; display: flex; gap: .75rem; padding: .7rem; text-align: left; transition: background 160ms ease, border-color 160ms ease; width: 100%; }
.atlas-palette-command:hover,
.atlas-palette-command.is-selected { background: color-mix(in srgb, var(--atlas-blue) 9%, transparent); border-color: var(--atlas-line); }
.atlas-palette-command-icon { align-items: center; border: 1px solid var(--atlas-line); border-radius: .6rem; color: var(--atlas-blue); display: inline-flex; height: 2rem; justify-content: center; width: 2rem; }
.atlas-palette-command-copy { display: grid; gap: .15rem; }
.atlas-palette-command-copy strong { font-size: .8rem; }
.atlas-palette-command-copy small { color: var(--atlas-muted); font-size: .66rem; }
.atlas-overlay-hint { color: var(--atlas-muted); font-size: .65rem; margin: 1rem 0 0; }
.atlas-modal-overlay { padding-top: clamp(1rem, 8vh, 6rem); }
.atlas-modal-card { padding: clamp(1.1rem, 3vw, 2rem); width: min(100%, 54rem); }
.atlas-modal-header { margin-bottom: .8rem; }
.atlas-modal-form { display: grid; gap: 1rem; }
.atlas-modal-lede { color: var(--atlas-copy); font-size: .85rem; line-height: 1.6; margin: 0 0 .3rem; }
.atlas-card-format-help { color: var(--atlas-muted); font-size: .7rem; line-height: 1.45; margin: -.35rem 0 0; }
.atlas-form-grid,
.atlas-compare-selectors,
.atlas-settings-grid { display: grid; gap: .75rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.atlas-duration-options { display: grid; gap: .55rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.atlas-duration-option { background: color-mix(in srgb, var(--atlas-surface-strong) 45%, transparent); border: 1px solid var(--atlas-line); border-radius: .8rem; cursor: pointer; display: grid; gap: .15rem; padding: .75rem; transition: border-color 180ms ease, background 180ms ease, transform 180ms ease; }
.atlas-duration-option:hover,
.atlas-duration-option.is-selected { background: color-mix(in srgb, var(--atlas-blue) 10%, transparent); border-color: var(--atlas-line-strong); transform: translateY(-2px); }
.atlas-duration-option input { position: absolute; opacity: 0; }
.atlas-duration-option strong { color: var(--atlas-ink); font-size: .9rem; }
.atlas-duration-option span { color: var(--atlas-muted); font-size: .65rem; }
.atlas-modal-footer { border-top: 1px solid var(--atlas-line); margin-top: .4rem; padding-top: 1rem; }
.atlas-modal-hint { color: var(--atlas-muted); font-size: .68rem; }
.atlas-session-progress { color: var(--atlas-muted); font-family: var(--codeFont); font-size: .66rem; gap: 1rem; }
.atlas-session-progress .atlas-progress-bar { max-width: 20rem; }
.atlas-session-content { margin: 1.8rem auto 1rem; max-width: 43rem; }
.atlas-session-title { color: var(--atlas-ink); font-size: clamp(2rem, 6vw, 4rem); letter-spacing: -.08em; line-height: .98; margin: .5rem 0 1.8rem; }
.atlas-recall-prompt,
.atlas-session-reveal,
.atlas-recall-reveal { background: color-mix(in srgb, var(--atlas-blue) 7%, transparent); border: 1px solid var(--atlas-line); border-radius: 1rem; padding: 1rem; }
.atlas-recall-prompt p,
.atlas-session-excerpt { color: var(--atlas-ink); font-size: 1rem; line-height: 1.55; margin: .55rem 0 .8rem; }
.atlas-recall-input { background: color-mix(in srgb, var(--atlas-surface-strong) 78%, transparent); border: 1px solid var(--atlas-line); border-radius: .7rem; box-sizing: border-box; color: var(--atlas-ink); font: inherit; min-height: 6rem; padding: .75rem; resize: vertical; width: 100%; }
.atlas-session-reveal { animation: atlas-reveal-enter 420ms cubic-bezier(.22, 1, .36, 1) both; margin-top: .8rem; }
.atlas-session-related { border-top: 1px solid var(--atlas-line); display: flex; flex-wrap: wrap; gap: .4rem .7rem; margin-top: 1rem; padding-top: .8rem; }
.atlas-session-related .atlas-resume-eyebrow { flex-basis: 100%; }
.atlas-session-related a { font-size: .7rem; }
.atlas-rating-button { border-radius: .7rem; font-size: .65rem; min-height: 2.2rem; padding-inline: .65rem; }
.atlas-rating-button.is-again { color: #f28370; }
.atlas-rating-button.is-easy { color: #42be97; }
.atlas-complete-content { padding: 2rem 0 1rem; text-align: center; }
.atlas-complete-mark { align-items: center; border: 1px solid var(--atlas-line-strong); border-radius: 50%; color: var(--atlas-blue-bright); display: inline-flex; font-size: 2rem; height: 4rem; justify-content: center; width: 4rem; }
.atlas-complete-content h3 { color: var(--atlas-ink); font-size: 2rem; letter-spacing: -.07em; margin: 1rem 0 .5rem; }
.atlas-complete-content p { color: var(--atlas-copy); margin: 0 auto 1.5rem; max-width: 30rem; }
.atlas-complete-content .atlas-action-row { justify-content: center; }
.atlas-comparison-table { border-top: 1px solid var(--atlas-line); margin-top: 1.3rem; }
.atlas-comparison-row { border-bottom: 1px solid var(--atlas-line); padding: 1rem 0; }
.atlas-comparison-row h3 { color: var(--atlas-blue); font-size: .78rem; margin: 0 0 .7rem; }
.atlas-comparison-cells { display: grid; gap: .6rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.atlas-comparison-cell { color: var(--atlas-copy); font-size: .74rem; line-height: 1.6; min-width: 0; }
.atlas-choice-list { display: grid; gap: .4rem; margin: 1rem 0; }
.atlas-choice-row { align-items: center; border-radius: .7rem; justify-content: space-between; text-align: left; width: 100%; }
.atlas-choice-row span { color: var(--atlas-muted); font-size: .65rem; }
.atlas-library-tabs { align-items: center; border-bottom: 1px solid var(--atlas-line); display: flex; flex-wrap: wrap; gap: .7rem; margin: 1rem 0; padding-bottom: .75rem; }
.atlas-library-tab { background: transparent; border: 0; border-bottom: 2px solid transparent; border-radius: 0; color: var(--atlas-muted); cursor: pointer; font: inherit; font-size: .75rem; padding: .55rem .1rem; }
.atlas-library-tab.is-active { border-color: var(--atlas-blue); color: var(--atlas-ink); }
.atlas-library-tabs > .atlas-button-primary { margin-left: auto; }
.atlas-library-body { min-height: 20rem; }
.atlas-highlight-list,
.atlas-list-collection { display: grid; gap: .75rem; }
.atlas-highlight-card blockquote,
.atlas-selection-quote { border-left: 2px solid var(--atlas-blue); color: var(--atlas-ink); font-size: 1rem; line-height: 1.55; margin: 0 0 .9rem; padding-left: .9rem; }
.atlas-highlight-card .atlas-study-link { display: block; font-size: .75rem; margin-bottom: .5rem; }
.atlas-highlight-note { color: var(--atlas-copy); font-size: .78rem; line-height: 1.55; }
.atlas-flashcard-back { border-top: 1px dashed var(--atlas-line); color: var(--atlas-copy); font-size: .78rem; line-height: 1.55; margin: 1rem 0 .8rem; padding-top: .8rem; }
.atlas-personal-list-header h3 { color: var(--atlas-ink); margin: 0; }
.atlas-personal-list .atlas-mini-list a { border-bottom: 1px solid var(--atlas-line); font-size: .75rem; padding: .5rem 0; }
.atlas-search-form { display: flex; gap: .5rem; margin: 1.3rem 0; }
.atlas-search-form .atlas-search-input { flex: 1; }
.atlas-search-results { margin-top: 1rem; }
.atlas-inline-result { align-items: center; border-bottom: 1px solid var(--atlas-line); display: flex; justify-content: space-between; padding: .7rem 0; }
.atlas-ranked-list { display: grid; gap: .45rem; }
.atlas-ranked-row { align-items: center; background: color-mix(in srgb, var(--atlas-surface-strong) 48%, transparent); border: 1px solid var(--atlas-line); border-radius: .85rem; display: grid; gap: 1rem; grid-template-columns: 2.4rem minmax(0, 1fr) auto; padding: .85rem 1rem; }
.atlas-rank { color: var(--atlas-blue); font-family: var(--codeFont); font-size: .8rem; }
.atlas-ranked-copy { display: grid; gap: .2rem; min-width: 0; }
.atlas-ranked-copy .atlas-study-link { font-weight: 700; }
.atlas-ranked-value { color: var(--atlas-ink); font-family: var(--codeFont); font-size: 1.4rem; }
.atlas-map-columns { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 1rem; }
.atlas-map-list-row { align-items: center; border-bottom: 1px solid var(--atlas-line); color: var(--atlas-copy); display: flex; font-size: .78rem; justify-content: space-between; padding: .65rem 0; }
.atlas-map-list-row strong { color: var(--atlas-ink); font-family: var(--codeFont); }
.atlas-gap-list { display: grid; gap: .7rem; margin-top: 1rem; }
.atlas-gap-row { background: color-mix(in srgb, var(--atlas-surface-strong) 48%, transparent); border: 1px solid var(--atlas-line); border-radius: .9rem; padding: 1rem; }
.atlas-gap-heading { align-items: center; display: flex; gap: .7rem; justify-content: space-between; }
.atlas-gap-heading h2 { color: var(--atlas-ink); font-size: 1rem; margin: 0; }
.atlas-gap-sources { display: flex; flex-wrap: wrap; gap: .4rem .7rem; }
.atlas-gap-sources a { font-size: .7rem; }
.atlas-note-card h2 { color: var(--atlas-ink); letter-spacing: -.05em; margin: .4rem 0 .6rem; }
.atlas-selection-tools { align-items: center; background: var(--atlas-surface-strong); border: 1px solid var(--atlas-line-strong); border-radius: 999px; box-shadow: 0 15px 38px rgba(0, 0, 0, .22); display: flex; gap: .2rem; opacity: 0; padding: .25rem; pointer-events: none; position: absolute; transform: translateY(6px) scale(.96); transition: opacity 180ms ease, transform 220ms cubic-bezier(.22, 1, .36, 1); z-index: 1300; }
.atlas-selection-tools.is-open { opacity: 1; pointer-events: auto; transform: translateY(0) scale(1); }
.atlas-selection-tools button { background: transparent; border: 0; border-radius: 999px; color: var(--atlas-ink); cursor: pointer; font: inherit; font-size: .65rem; padding: .45rem .65rem; }
.atlas-selection-tools button:hover { background: color-mix(in srgb, var(--atlas-blue) 10%, transparent); color: var(--atlas-blue); }
.atlas-toast-region { bottom: 1rem; display: grid; gap: .45rem; max-width: min(24rem, calc(100vw - 2rem)); position: fixed; right: 1rem; z-index: 1600; }
.atlas-toast { animation: atlas-toast-enter 300ms cubic-bezier(.22, 1, .36, 1) both; background: var(--atlas-surface-strong); border: 1px solid var(--atlas-line-strong); border-radius: .75rem; box-shadow: 0 16px 40px rgba(0, 0, 0, .2); color: var(--atlas-ink); font-size: .72rem; padding: .75rem .9rem; }
.atlas-toast.is-leaving { opacity: 0; transform: translateY(5px); transition: opacity 260ms ease, transform 260ms ease; }
.atlas-toast.is-error { border-color: rgba(239, 102, 84, .5); }
.atlas-settings-grid { margin-top: 1rem; }
.atlas-settings-item { border: 1px solid var(--atlas-line); border-radius: .9rem; padding: 1rem; }
.atlas-settings-item h3 { color: var(--atlas-ink); font-size: .95rem; margin: 0 0 .4rem; }
.atlas-settings-item p { color: var(--atlas-copy); font-size: .75rem; line-height: 1.5; min-height: 2.5em; }

.atlas-onboarding-overlay { align-items: center; padding: 1rem; }
.atlas-onboarding-card { max-width: 46rem; overflow: hidden; padding: clamp(1rem, 3vw, 1.7rem); }
.atlas-onboarding-header { align-items: center; }
.atlas-onboarding-count { margin: 0; }
.atlas-onboarding-slides { min-height: 27rem; position: relative; }
.atlas-onboarding-slide { display: none; padding: .8rem 1rem 0; }
.atlas-onboarding-slide.is-active { animation: atlas-slide-enter 500ms cubic-bezier(.22, 1, .36, 1) both; display: block; }
.atlas-onboarding-slide h2 { color: var(--atlas-ink); font-size: clamp(2rem, 5vw, 3.6rem); letter-spacing: -.08em; line-height: .98; margin: .55rem 0 .7rem; max-width: 10ch; }
.atlas-onboarding-slide > p:last-child { color: var(--atlas-copy); font-size: .95rem; line-height: 1.65; margin: 0; max-width: 35rem; }
.atlas-onboarding-visual { align-items: center; background: radial-gradient(circle at 50% 50%, var(--atlas-glow), transparent 70%), color-mix(in srgb, var(--atlas-blue) 5%, transparent); border: 1px solid var(--atlas-line); border-radius: 1rem; display: flex; height: 10rem; justify-content: center; margin-bottom: 1.5rem; overflow: hidden; position: relative; }
.atlas-onboarding-visual-orbit::before,
.atlas-onboarding-visual-orbit::after { border: 1px solid var(--atlas-line-strong); border-radius: 50%; content: ""; height: 12rem; position: absolute; transform: rotate(-25deg) scaleX(1.8); width: 5rem; }
.atlas-onboarding-visual-orbit::after { transform: rotate(65deg) scaleX(1.8); }
.atlas-onboarding-visual-orbit span,
.atlas-onboarding-visual-orbit i { background: var(--atlas-blue-bright); border-radius: 50%; box-shadow: 0 0 0 .4rem var(--atlas-glow), 0 0 1.5rem var(--atlas-blue-bright); height: .45rem; position: absolute; width: .45rem; }
.atlas-onboarding-visual-orbit span:nth-child(1) { left: 27%; top: 33%; }
.atlas-onboarding-visual-orbit span:nth-child(2) { right: 28%; top: 26%; transform: scale(.7); }
.atlas-onboarding-visual-orbit span:nth-child(3) { bottom: 24%; left: 36%; transform: scale(1.2); }
.atlas-onboarding-visual-orbit i { height: 1.3rem; position: relative; width: 1.3rem; }
.atlas-onboarding-visual-search { gap: .45rem; padding: 1rem; }
.atlas-onboarding-visual-search > span { border: 1px solid var(--atlas-line-strong); border-radius: .7rem; color: var(--atlas-blue); font-size: 2.4rem; height: 4rem; line-height: 3.5rem; text-align: center; width: 4rem; }
.atlas-onboarding-visual-search i { background: color-mix(in srgb, var(--atlas-blue) 9%, transparent); border: 1px solid var(--atlas-line); border-radius: 999px; color: var(--atlas-ink); font-family: var(--codeFont); font-size: .65rem; font-style: normal; padding: .45rem .65rem; }
.atlas-onboarding-visual-graph svg { height: 100%; width: 100%; }
.atlas-onboarding-visual-graph path { fill: none; stroke: var(--atlas-blue-soft); stroke-width: 2; }
.atlas-onboarding-visual-graph circle { fill: var(--atlas-blue); stroke: var(--atlas-bg); stroke-width: 3; }
.atlas-onboarding-visual-recall { gap: .5rem; }
.atlas-onboarding-visual-recall span { border: 1px solid var(--atlas-line-strong); border-radius: .7rem; color: var(--atlas-ink); font-size: .7rem; padding: .75rem .9rem; transform: rotate(-4deg); }
.atlas-onboarding-visual-recall span:nth-child(2) { background: color-mix(in srgb, var(--atlas-blue) 12%, transparent); transform: translateY(-1rem) rotate(4deg); }
.atlas-onboarding-visual-recall span:nth-child(3) { transform: rotate(-1deg); }
.atlas-onboarding-visual-start { align-items: flex-start; flex-direction: column; padding: 2rem 15%; }
.atlas-onboarding-visual-start strong { color: var(--atlas-ink); font-size: 2.5rem; letter-spacing: -.09em; }
.atlas-onboarding-visual-start span,
.atlas-onboarding-visual-start i { color: var(--atlas-blue); font-family: var(--codeFont); font-size: .7rem; font-style: normal; margin-left: 2rem; }
.atlas-onboarding-visual-start i { color: var(--atlas-muted); margin-left: 5rem; }
.atlas-onboarding-progress { display: flex; gap: .35rem; padding: .8rem 1rem; }
.atlas-onboarding-dot { background: var(--atlas-line); border: 0; border-radius: 999px; cursor: pointer; height: .3rem; padding: 0; transition: background 240ms ease, width 240ms ease; width: 1.2rem; }
.atlas-onboarding-dot.is-active { background: var(--atlas-blue); width: 2.7rem; }
.atlas-onboarding-footer { align-items: center; border-top: 1px solid var(--atlas-line); display: flex; justify-content: space-between; padding: 1rem; }
.atlas-onboarding-nav { display: flex; gap: .45rem; }

html.atlas-theme-transition *,
html.atlas-theme-transition *::before,
html.atlas-theme-transition *::after { transition-duration: 350ms !important; }
html.atlas-overlay-open,
html.atlas-modal-open,
html.atlas-sidebar-scroll-lock { overflow: hidden; }

/* This toggle follows the official Nutriwork control's geometry, depth and thumb behavior. */
.theme-toggle { align-items: center; background: transparent; border: 0; color: var(--atlas-ink); cursor: pointer; display: inline-grid; height: 38px; padding: 0; place-items: center; width: 76px; }
.theme-toggle__track { background: linear-gradient(135deg, rgba(18, 35, 72, .96), rgba(3, 5, 12, .94)); border: 1px solid rgba(119, 170, 255, .32); border-radius: 999px; box-shadow: inset 0 1px rgba(255, 255, 255, .12), 0 10px 28px rgba(0, 0, 0, .28), 0 0 22px rgba(30, 98, 255, .18); display: block; height: 34px; overflow: hidden; position: relative; transition: border-color .28s ease, box-shadow .28s ease, background .28s ease; width: 68px; }
.theme-toggle__track::before { background: radial-gradient(circle at 24% 28%, rgba(255, 255, 255, .18), transparent 32%), radial-gradient(circle at 76% 72%, rgba(30, 98, 255, .16), transparent 40%); content: ""; inset: -1px; opacity: .72; pointer-events: none; position: absolute; transition: opacity .28s ease; }
.theme-toggle__icon { align-items: center; color: rgba(178, 198, 234, .52); display: grid; height: 18px; justify-content: center; position: absolute; top: 50%; transform: translateY(-50%); transition: color .24s ease, opacity .24s ease, transform .24s ease; width: 18px; z-index: 1; }
.theme-toggle__icon .atlas-icon { height: 16px; width: 16px; }
.theme-toggle__icon--sun { left: 9px; }
.theme-toggle__icon--moon { right: 9px; }
.theme-toggle__thumb { align-items: center; background: linear-gradient(145deg, #f7fbff, #8abaff 45%, #236fff); border-radius: 50%; box-shadow: 0 8px 20px rgba(0, 0, 0, .38), 0 0 18px rgba(64, 145, 255, .38); color: #07152f; display: grid; height: 26px; justify-content: center; left: 4px; position: absolute; top: 4px; transform: translateX(34px); transition: transform .28s cubic-bezier(.22, 1, .36, 1), background .28s ease, box-shadow .28s ease, color .28s ease; width: 26px; z-index: 2; }
.theme-toggle__thumb .atlas-icon { height: 15px; width: 15px; }
.theme-toggle[data-theme="light"] .theme-toggle__track { background: linear-gradient(135deg, rgba(255, 255, 255, .96), rgba(224, 235, 255, .92)); border-color: rgba(24, 85, 190, .2); box-shadow: inset 0 1px rgba(255, 255, 255, .9), 0 12px 28px rgba(37, 74, 132, .13); }
.theme-toggle[data-theme="light"] .theme-toggle__track::before { background: radial-gradient(circle at 24% 28%, rgba(255, 255, 255, .88), transparent 32%), radial-gradient(circle at 76% 72%, rgba(18, 99, 255, .1), transparent 40%); }
.theme-toggle[data-theme="light"] .theme-toggle__thumb { background: linear-gradient(145deg, #fff9d4, #ffd56c 52%, #ffb328); box-shadow: 0 8px 18px rgba(170, 115, 10, .2), 0 0 18px rgba(255, 191, 64, .24); color: #3d2800; transform: translateX(0); }
.theme-toggle[data-theme="light"] .theme-toggle__icon--sun,
.theme-toggle[data-theme="dark"] .theme-toggle__icon--moon { color: var(--atlas-ink); opacity: .9; }
.theme-toggle[data-theme="light"] .theme-toggle__icon--moon,
.theme-toggle[data-theme="dark"] .theme-toggle__icon--sun { opacity: .58; }
.theme-toggle:hover .theme-toggle__track,
.theme-toggle:focus-visible .theme-toggle__track { border-color: var(--atlas-blue); box-shadow: 0 10px 28px rgba(0, 0, 0, .28), 0 0 0 4px rgba(18, 99, 255, .1); }
.theme-toggle:focus-visible { border-radius: 20px; outline: 2px solid var(--atlas-blue); outline-offset: 3px; }

@keyframes atlas-page-enter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes atlas-slide-enter { from { opacity: 0; transform: translateX(18px) scale(.985); } to { opacity: 1; transform: translateX(0) scale(1); } }
@keyframes atlas-reveal-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes atlas-loader-pulse { 0%, 100% { opacity: .25; transform: scale(.8); } 50% { opacity: 1; transform: scale(1.3); } }
@keyframes atlas-toast-enter { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

@media all and (max-width: 900px) {
  .atlas-home-hero { gap: 1rem; grid-template-columns: minmax(0, 1.2fr) minmax(12rem, .8fr); }
  .atlas-home-metrics, .atlas-metric-grid, .atlas-structure-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .atlas-home-grid { grid-template-columns: 1fr; }
  .atlas-home-side { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .atlas-graph-sliders { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media all and (max-width: 620px) {
  .atlas-home { padding-top: 1rem; }
  .atlas-home-hero { display: block; min-height: 0; padding-bottom: 1.8rem; }
  .atlas-home-hero h1 { font-size: clamp(2.7rem, 13vw, 4.6rem); max-width: 11ch; }
  .atlas-home-hero-orb { margin: 2rem auto 0; max-width: 15rem; }
  .atlas-home-side, .atlas-card-grid, .atlas-path-grid, .atlas-path-grid-large, .atlas-map-columns, .atlas-form-grid, .atlas-compare-selectors, .atlas-settings-grid { grid-template-columns: 1fr; }
  .atlas-home-metrics, .atlas-metric-grid, .atlas-structure-grid { gap: .5rem; }
  .atlas-metric-card { min-height: 5.3rem; padding: .75rem; }
  .atlas-metric-value { font-size: 1.35rem; }
  .atlas-metric-label { font-size: .67rem; }
  .atlas-dashboard-summary, .atlas-review-summary, .atlas-paths-intro { align-items: flex-start; flex-direction: column; }
  .atlas-dashboard-summary span { margin-left: 0; }
  .atlas-graph-header, .atlas-graph-footer { align-items: flex-start; flex-direction: column; }
  .atlas-graph-actions { justify-content: flex-start; }
  .atlas-graph-selects, .atlas-graph-sliders, .atlas-duration-options { grid-template-columns: 1fr 1fr; }
  .atlas-graph-select-field:last-child { grid-column: 1 / -1; }
  .atlas-graph-canvas { min-height: 23rem; }
  .atlas-graph-node-label { font-size: 12px; }
  .atlas-graph-help { display: none; }
  .atlas-comparison-cells { grid-template-columns: 1fr; }
  .atlas-comparison-cell { border-left: 2px solid var(--atlas-line); padding-left: .7rem; }
  .atlas-search-form { align-items: stretch; flex-direction: column; }
  .atlas-search-form .atlas-button { width: 100%; }
  .atlas-onboarding-slides { min-height: 29rem; }
  .atlas-onboarding-footer { align-items: stretch; flex-direction: column; gap: .7rem; }
  .atlas-onboarding-nav { justify-content: space-between; }
  .atlas-onboarding-nav .atlas-button { flex: 1; }
  .atlas-onboarding-visual { height: 9rem; }
  .atlas-overlay, .atlas-modal-overlay { align-items: flex-end; padding: 0; }
  .atlas-command-card, .atlas-advanced-card, .atlas-onboarding-card, .atlas-modal-card { border-radius: 1.25rem 1.25rem 0 0; max-height: 92vh; width: 100%; }
  .atlas-command-card, .atlas-advanced-card, .atlas-onboarding-card, .atlas-modal-card { padding: 1rem; }
  .atlas-selection-tools { bottom: .8rem !important; left: .6rem !important; position: fixed !important; right: .6rem; top: auto !important; justify-content: space-around; }
  .atlas-selection-tools button { flex: 1; }
}
`

  AtlasStudyShellComponent.beforeDOMLoaded = `
(() => {
  const root = document.documentElement;
  let theme = "dark";
  try {
    const stored = window.localStorage.getItem("nutriwork-theme");
    if (stored === "light" || stored === "dark") theme = stored;
  } catch {}
  root.setAttribute("saved-theme", theme);
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
})();
`

  AtlasStudyShellComponent.afterDOMLoaded = atlasRuntime
  return AtlasStudyShellComponent
}

export const AtlasEnhancedGraph = () => {
  const AtlasEnhancedGraphComponent = ({ fileData }) => {
    const slug = String(fileData?.slug ?? "")
    if (["index", "atlas/index", "grafo"].includes(slug)) return null
    return h("div", { class: "atlas-graph-mount", "aria-label": "Grafo do Atlas" })
  }
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
          {
            type: "button",
            class: "atlas-text-button",
            "data-atlas-action": "toggle-context",
            "aria-expanded": "false",
            "aria-controls": "atlas-context-tabs atlas-context-content",
          },
          "Mostrar painel",
        ),
      ),
      h(
        "div",
        {
          id: "atlas-context-tabs",
          class: "atlas-context-tabs",
          role: "tablist",
          "aria-label": "Modos do painel",
        },
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
              id: "atlas-context-tab-" + value,
              class: "atlas-context-tab",
              role: "tab",
              "aria-selected": value === "summary" ? "true" : "false",
              "aria-controls": "atlas-context-content-" + value,
              tabIndex: value === "summary" ? 0 : -1,
              "data-atlas-context-tab": value,
            },
            label,
          ),
        ),
      ),
      h(
        "div",
        { id: "atlas-context-content", class: "atlas-context-content" },
        ["summary", "backlinks", "relations", "graph", "recent", "favorites"].map((value) =>
          h("div", {
            id: "atlas-context-content-" + value,
            role: "tabpanel",
            "aria-labelledby": "atlas-context-tab-" + value,
            "data-atlas-context-content": value,
            hidden: value !== "summary",
          }),
        ),
      ),
    )

  return AtlasContextPanelComponent
}
