import { FullSlug, resolveRelative } from "../../util/path"
import { PageFrame, PageFrameProps } from "./types"

function labelFromSlug(slug: FullSlug): string {
  const value = String(slug)
    .replace(/^atlas\//, "")
    .replace(/[-_]+/g, " ")
    .trim()
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Nota sem título"
}

export const AtlasFrame: PageFrame = {
  name: "atlas",
  render({ componentData, beforeBody, pageBody: Content, afterBody }: PageFrameProps) {
    const current = componentData.fileData.slug ?? ("index" as FullSlug)
    const isGraph = current === "index"
    const isNote = String(current).startsWith("atlas/")
    const noteSlug = isNote ? String(current) : ""
    const title = componentData.fileData.frontmatter?.title || labelFromSlug(current)
    const homeHref = isGraph ? "." : resolveRelative(current, ".." as FullSlug)
    const logoHref = resolveRelative(
      current,
      "static/atlas-logo-horizontal-transparent.png" as FullSlug,
    )

    return (
      <div
        class="atlas-frame"
        data-atlas-route={isGraph ? "graph" : isNote ? "note" : "other"}
        data-atlas-view={isNote ? "note" : "graph"}
      >
        <a class="atlas-skip-link" href="#main-content">
          Ir para o conteúdo
        </a>

        <div class="atlas-before-body">
          {beforeBody.map((BodyComponent) => (
            <BodyComponent {...componentData} />
          ))}
        </div>

        <header id="atlas-navbar" class="atlas-navbar" aria-label="Navegação do Atlas">
          <a
            class="atlas-brand"
            href={homeHref}
            data-atlas-action="go-home"
            data-router-ignore=""
            aria-label="Nutriwork Atlas, grafo"
          >
            <img class="atlas-brand-logo" src={logoHref} alt="Atlas." width="112" height="66" />
          </a>

          <div class="atlas-mobile-actions" aria-label="Ações rápidas do Atlas">
            <button
              class="atlas-icon-button atlas-mobile-action atlas-mobile-search-trigger"
              type="button"
              data-atlas-action="open-search"
              aria-label="Buscar conceitos"
              aria-controls="atlas-search-sheet"
            >
              <svg
                class="atlas-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="10.8" cy="10.8" r="6.2" />
                <path d="m16 16 4 4" />
              </svg>
            </button>
            <button
              class="atlas-icon-button atlas-mobile-action atlas-mobile-note-action"
              type="button"
              data-atlas-action="go-back"
              aria-label="Voltar ao contexto anterior"
              hidden={!isNote}
            >
              <svg
                class="atlas-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="m15 18-6-6 6-6" />
                <path d="M9 12h10" />
              </svg>
            </button>
            <button
              class="atlas-icon-button atlas-mobile-action atlas-mobile-note-action"
              type="button"
              data-atlas-action="expand-graph"
              aria-label="Expandir grafo"
              hidden={!isNote}
            >
              <svg
                class="atlas-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M8 3H3v5M3 3l6 6M16 21h5v-5M21 21l-6-6" />
              </svg>
            </button>
            <button
              class="atlas-icon-button atlas-mobile-action"
              type="button"
              data-atlas-action="toggle-theme"
              data-atlas-theme-toggle=""
              aria-label="Alternar tema"
              title="Alternar tema"
            >
              <svg
                class="atlas-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="12" cy="12" r="4" />
              </svg>
            </button>
            <button
              class="atlas-icon-button atlas-mobile-action atlas-mobile-menu-trigger"
              type="button"
              data-atlas-action="toggle-mobile-menu"
              aria-label="Abrir menu"
              aria-controls="atlas-mobile-menu"
              aria-expanded="false"
            >
              <svg
                class="atlas-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>

          <div class="atlas-graph-filters" aria-label="Filtros do grafo" hidden={!isGraph}>
            <label class="atlas-visually-hidden" for="atlas-search">
              Buscar conceitos
            </label>
            <span class="atlas-search-field">
              <span class="atlas-search-icon" aria-hidden="true">
                <svg
                  class="atlas-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  focusable="false"
                >
                  <circle cx="10.8" cy="10.8" r="6.2" />
                  <path d="m16 16 4 4" />
                </svg>
              </span>
              <input
                id="atlas-search"
                type="search"
                placeholder="Buscar no grafo"
                autocomplete="off"
                spellcheck={false}
              />
            </span>
            <div class="atlas-area-picker" data-atlas-area-picker>
              <button
                id="atlas-area-trigger"
                class="atlas-area-trigger"
                type="button"
                data-atlas-area-trigger=""
                aria-haspopup="listbox"
                aria-expanded="false"
                aria-controls="atlas-area-menu"
                aria-label="Filtrar por área"
              >
                <span id="atlas-area-value" class="atlas-area-value">
                  Todas as áreas
                </span>
                <svg
                  class="atlas-icon atlas-area-chevron"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="m7 10 5 5 5-5" />
                </svg>
              </button>
              <div
                id="atlas-area-menu"
                class="atlas-area-menu"
                role="listbox"
                aria-label="Áreas do grafo"
                hidden
              ></div>
              <select
                id="atlas-area-filter"
                class="atlas-area-filter-state"
                aria-hidden="true"
                tabIndex={-1}
                hidden
              >
                <option value="all">Todas as áreas</option>
              </select>
            </div>
          </div>

          <div class="atlas-navbar-actions">
            <div class="atlas-navbar-group atlas-navbar-context-actions">
              <button
                id="atlas-onboarding-open"
                class="atlas-nav-button"
                type="button"
                data-atlas-action="open-onboarding"
                aria-label="Reabrir introdução do Atlas"
                title="Como funciona?"
              >
                <svg
                  class="atlas-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.8 9a2.4 2.4 0 1 1 3.9 1.9c-1.1.8-1.7 1.2-1.7 2.6" />
                  <path d="M12 17h.01" />
                </svg>
                <span class="atlas-control-label">Como funciona?</span>
              </button>
              <button
                id="atlas-help-open"
                class="atlas-nav-button"
                type="button"
                data-atlas-action="open-help"
                aria-label="Ajuda e suporte"
                title="Ajuda e suporte"
              >
                <svg
                  class="atlas-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.8 9a2.4 2.4 0 1 1 3.9 1.9c-1.1.8-1.7 1.2-1.7 2.6" />
                  <path d="M12 17h.01" />
                </svg>
                <span class="atlas-control-label">Ajuda</span>
              </button>
              <button
                id="atlas-back"
                class="atlas-nav-button"
                type="button"
                data-atlas-action="go-back"
                aria-label="Voltar ao contexto anterior"
                hidden={!isNote}
              >
                <svg
                  class="atlas-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="m15 18-6-6 6-6" />
                  <path d="M9 12h10" />
                </svg>
                <span>Voltar</span>
              </button>
              <button
                id="atlas-expand-graph"
                class="atlas-nav-button atlas-nav-button-primary"
                type="button"
                data-atlas-action="expand-graph"
                aria-label="Expandir grafo"
                hidden={!isNote}
              >
                <svg
                  class="atlas-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M8 3H3v5M3 3l6 6M16 21h5v-5M21 21l-6-6" />
                </svg>
                <span>Expandir grafo</span>
              </button>
            </div>
            <div class="atlas-navbar-group atlas-navbar-system-actions">
              <button
                id="atlas-theme-toggle"
                class="atlas-nav-button"
                type="button"
                data-atlas-action="toggle-theme"
                data-atlas-theme-toggle=""
                aria-label="Alternar tema"
                title="Alternar tema"
              >
                <svg
                  class="atlas-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
                <span class="atlas-control-label">Tema</span>
              </button>
              <button
                class="atlas-icon-button atlas-hide-nav"
                type="button"
                data-atlas-action="toggle-nav"
                aria-label="Ocultar barra de navegação"
                title="Ocultar barra de navegação"
              >
                <svg
                  class="atlas-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="m6 15 6-6 6 6" />
                </svg>
              </button>
              <button
                id="atlas-access-logout"
                class="atlas-nav-button atlas-logout-button"
                type="button"
                aria-label="Sair do Atlas"
                title="Sair do Atlas"
              >
                <svg
                  class="atlas-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M10 6H5v12h5" />
                  <path d="m14 8 4 4-4 4M18 12H9" />
                </svg>
                <span class="atlas-control-label">Sair</span>
              </button>
            </div>
          </div>
        </header>

        <div
          id="atlas-mobile-graph-tools"
          class="atlas-mobile-graph-tools"
          aria-label="Ferramentas rápidas do grafo"
          hidden={!isGraph}
        >
          <button
            id="atlas-mobile-area-trigger"
            class="atlas-mobile-area-trigger"
            type="button"
            data-atlas-action="open-area"
            aria-haspopup="dialog"
            aria-expanded="false"
            aria-controls="atlas-area-sheet"
            aria-label="Filtrar por área: Todas as áreas"
          >
            <span id="atlas-mobile-area-value">Todas as áreas</span>
            <svg
              class="atlas-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="m7 10 5 5 5-5" />
            </svg>
          </button>
        </div>

        <button
          id="atlas-reopen-nav"
          class="atlas-reopen-nav"
          type="button"
          data-atlas-action="show-nav"
          aria-label="Mostrar barra de navegação"
          title="Mostrar barra de navegação"
          hidden
        >
          <svg
            class="atlas-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          <span class="atlas-visually-hidden">Mostrar navegação</span>
        </button>

        <main
          id="main-content"
          class="atlas-main"
          aria-label="Nutriwork Atlas"
          data-atlas-view={isNote ? "note" : "graph"}
        >
          <section
            id="atlas-graph-view"
            class={`atlas-graph-view${isGraph ? " is-active" : ""}`}
            aria-label="Grafo de conceitos"
            aria-hidden={!isGraph}
          >
            <div
              id="atlas-graph-root"
              class="atlas-graph-surface"
              data-atlas-graph-mount=""
              data-atlas-graph-mode={isNote ? "minimap" : "explore"}
              data-atlas-current={noteSlug}
              role="region"
              aria-label={
                isNote ? "Minimapa do grafo de conceitos" : "Grafo explorável de conceitos"
              }
            >
              <p class="atlas-graph-loading" role="status">
                Carregando grafo…
              </p>
            </div>
          </section>

          <section
            id="atlas-note-view"
            class={`atlas-note-view${isNote ? " is-active" : ""}`}
            aria-labelledby="atlas-note-title"
            aria-hidden={!isNote}
          >
            <section class="atlas-reading-shell">
              <header class="atlas-reading-header">
                <p class="atlas-reading-kicker">CONCEITO NO GRAFO</p>
                <h1 id="atlas-note-title" tabindex={-1}>
                  {title}
                </h1>
              </header>
              <div id="atlas-note-content" class="atlas-note-content">
                {isNote ? <Content {...componentData} /> : null}
              </div>
              <section class="atlas-minimap-shell" aria-label={"Minimapa do conceito " + title}>
                <div
                  id="atlas-note-graph-slot"
                  class="atlas-note-graph-slot"
                  role="region"
                  aria-label="Minimapa do grafo"
                />
              </section>
            </section>
          </section>
        </main>

        <div class="atlas-after-body">
          {afterBody.map((BodyComponent) => (
            <BodyComponent {...componentData} />
          ))}
        </div>
      </div>
    )
  },
}

AtlasFrame.css = `
:root {
  --atlas-bg: #010206;
  --atlas-surface: rgba(7, 16, 35, .72);
  --atlas-surface-strong: rgba(7, 16, 35, .92);
  --atlas-ink: #F5F7FF;
  --atlas-copy: #C8D2E5;
  --atlas-muted: #94A3B8;
  --atlas-line: rgba(142, 185, 255, .18);
  --atlas-line-strong: rgba(142, 185, 255, .32);
  --atlas-glass: rgba(6, 15, 32, .26);
  --atlas-glass-soft: rgba(7, 16, 35, .14);
  --atlas-glass-strong: rgba(7, 16, 35, .48);
  --atlas-glass-line: rgba(220, 235, 255, .18);
  --atlas-glass-highlight: rgba(255, 255, 255, .16);
  --atlas-glass-filter: blur(28px) saturate(158%);
  --atlas-glass-shadow: 0 22px 58px rgba(0, 0, 0, .28), inset 0 1px 0 rgba(255, 255, 255, .15), inset 1px 0 0 rgba(255, 255, 255, .065);
  --atlas-brand-navy: #0C2D57;
  --atlas-brand-blue: #1E5FAF;
  --atlas-brand-sky: #7DB5E4;
  --atlas-brand-pale: #BFD8F6;
  --atlas-blue: #1263FF;
  --atlas-blue-bright: #29A8FF;
  --atlas-blue-soft: #8EB9FF;
  --atlas-shadow: 0 18px 45px rgba(0, 0, 0, .24);
  --atlas-safe-top: env(safe-area-inset-top, 0px);
  --atlas-safe-right: env(safe-area-inset-right, 0px);
  --atlas-safe-bottom: env(safe-area-inset-bottom, 0px);
  --atlas-safe-left: env(safe-area-inset-left, 0px);
}

:root[data-theme="light"] {
  --atlas-bg: #F4F7FC;
  --atlas-surface: rgba(255, 255, 255, .7);
  --atlas-surface-strong: rgba(255, 255, 255, .92);
  --atlas-ink: #07152A;
  --atlas-copy: #526277;
  --atlas-muted: #6E7F95;
  --atlas-line: rgba(18, 99, 255, .16);
  --atlas-line-strong: rgba(18, 99, 255, .3);
  --atlas-glass: rgba(247, 250, 255, .32);
  --atlas-glass-soft: rgba(255, 255, 255, .16);
  --atlas-glass-strong: rgba(247, 250, 255, .52);
  --atlas-glass-line: rgba(255, 255, 255, .58);
  --atlas-glass-highlight: rgba(255, 255, 255, .82);
  --atlas-glass-filter: blur(28px) saturate(145%);
  --atlas-glass-shadow: 0 22px 58px rgba(30, 62, 110, .16), inset 0 1px 0 rgba(255, 255, 255, .82), inset 1px 0 0 rgba(255, 255, 255, .46);
  --atlas-shadow: 0 18px 45px rgba(30, 62, 110, .12);
  --atlas-brand-navy: #0C2D57;
  --atlas-brand-blue: #1E5FAF;
  --atlas-brand-sky: #7DB5E4;
  --atlas-brand-pale: #BFD8F6;
}

html,
body {
  background: var(--atlas-bg);
}

body {
  color: var(--atlas-ink);
  font-family: var(--bodyFont), Poppins, sans-serif;
}

button,
input,
select {
  font: inherit;
}

button,
a,
input,
select {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
canvas:focus-visible {
  outline: 3px solid var(--atlas-blue-bright);
  outline-offset: 3px;
}

.atlas-frame {
  background:
    radial-gradient(circle at 50% 46%, rgba(18, 99, 255, .1), transparent 34rem),
    var(--atlas-bg);
  color: var(--atlas-ink);
  min-height: 100dvh;
  overflow: visible;
  position: relative;
  width: 100%;
  overscroll-behavior: none;
}

.atlas-frame[aria-busy="true"] {
  cursor: progress;
}

.atlas-route-loading .atlas-graph-view,
.atlas-route-loading .atlas-note-view {
  opacity: .82;
  transition: opacity 140ms ease;
}

#quartz-root:has(.atlas-frame),
#quartz-body:has(.atlas-frame) {
  box-sizing: border-box;
  height: 100%;
  margin: 0;
  min-height: 100dvh;
  padding: 0;
  width: 100%;
}

#quartz-body:has(.atlas-frame) {
  display: block;
}

.atlas-skip-link {
  background: var(--atlas-blue);
  border-radius: 0 0 10px 10px;
  color: white;
  left: 1rem;
  padding: .65rem .9rem;
  position: fixed;
  top: 0;
  transform: translateY(-130%);
  transition: transform 160ms ease;
  z-index: 10001;
}

.atlas-skip-link:focus {
  transform: translateY(0);
}

.atlas-before-body,
.atlas-after-body {
  display: contents;
}

.atlas-navbar {
  align-items: center;
  -webkit-backdrop-filter: var(--atlas-glass-filter);
  backdrop-filter: var(--atlas-glass-filter);
  background: linear-gradient(145deg, rgba(255, 255, 255, .1), transparent 42%), var(--atlas-glass);
  border: 1px solid var(--atlas-glass-line);
  border-radius: 999px;
  box-shadow: var(--atlas-glass-shadow);
  display: flex;
  gap: .68rem;
  left: 50%;
  max-width: calc(100vw - 2rem);
  min-height: 3rem;
  overflow: visible;
  padding: .28rem .36rem .28rem .48rem;
  position: fixed;
  top: 1rem;
  transform: translateX(-50%);
  transition: opacity 180ms ease, transform 220ms ease;
  width: min(76rem, calc(100vw - 2rem));
  z-index: 7000;
}

.atlas-brand {
  align-items: center;
  display: inline-flex;
  flex: 0 0 auto;
  height: 2.7rem;
  text-decoration: none;
}

.atlas-brand-logo {
  display: block;
  height: 2.7rem;
  object-fit: contain;
  width: 4.6rem;
}

:root:not([data-theme="light"]) .atlas-brand-logo {
  filter: brightness(0) invert(1) opacity(.88) drop-shadow(0 1px 5px rgba(125, 181, 228, .18));
}

.atlas-graph-filters {
  align-items: center;
  display: flex;
  flex: 1 1 auto;
  gap: .4rem;
  min-width: 0;
}

.atlas-search-field {
  align-items: center;
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  backdrop-filter: blur(18px) saturate(140%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .055), transparent 54%), var(--atlas-glass-soft);
  border: 1px solid var(--atlas-glass-line);
  border-radius: 999px;
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--atlas-glass-highlight) 72%, transparent);
  display: flex;
  flex: 1 1 15.5rem;
  min-width: 7rem;
}

:root[data-theme="light"] .atlas-search-field {
  background: rgba(255, 255, 255, .34);
}

.atlas-search-icon {
  color: var(--atlas-muted);
  line-height: 1;
  padding-left: .7rem;
}

.atlas-search-field input {
  background: transparent;
  border: 0;
  color: var(--atlas-ink);
  font-size: .76rem;
  min-height: 2.2rem;
  min-width: 0;
  outline: 0;
  padding: .35rem .68rem .35rem .38rem;
  width: 100%;
}

.atlas-search-field input::placeholder {
  color: var(--atlas-muted);
}

.atlas-area-picker {
  flex: 0 1 12rem;
  min-width: 9rem;
  position: relative;
}

.atlas-area-trigger {
  align-items: center;
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  backdrop-filter: blur(18px) saturate(140%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .055), transparent 54%), var(--atlas-glass-soft);
  border: 1px solid var(--atlas-glass-line);
  border-radius: 999px;
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--atlas-glass-highlight) 72%, transparent);
  color: var(--atlas-copy);
  cursor: pointer;
  display: inline-flex;
  font-size: .76rem;
  gap: .55rem;
  height: 2.2rem;
  justify-content: space-between;
  padding: .35rem .62rem .35rem .72rem;
  text-align: left;
  width: 100%;
}

:root[data-theme="light"] .atlas-area-trigger {
  background: rgba(255, 255, 255, .34);
}

.atlas-area-trigger:hover,
.atlas-area-trigger[aria-expanded="true"] {
  background: color-mix(in srgb, var(--atlas-glass-highlight) 42%, transparent);
  border-color: color-mix(in srgb, var(--atlas-brand-sky) 48%, var(--atlas-glass-line));
  color: var(--atlas-ink);
}

.atlas-area-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.atlas-area-chevron {
  flex: 0 0 auto;
  height: .9rem;
  transition: transform 180ms ease;
  width: .9rem;
}

.atlas-area-trigger[aria-expanded="true"] .atlas-area-chevron {
  transform: rotate(180deg);
}

.atlas-area-filter-state {
  display: none;
}

.atlas-area-menu {
  -webkit-backdrop-filter: blur(26px) saturate(150%);
  backdrop-filter: blur(26px) saturate(150%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .09), transparent 52%), var(--atlas-glass-strong);
  border: 1px solid var(--atlas-glass-line);
  border-radius: .85rem;
  box-shadow: var(--atlas-glass-shadow);
  left: 0;
  max-height: min(22rem, calc(100dvh - 5rem));
  min-width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  padding: .28rem;
  position: absolute;
  top: calc(100% + .45rem);
  width: max(100%, 15rem);
  z-index: 9000;
}

:root[data-theme="light"] .atlas-area-menu {
  background: linear-gradient(145deg, rgba(255, 255, 255, .48), transparent 52%), rgba(247, 250, 255, .76);
  border-color: rgba(30, 95, 175, .16);
  box-shadow: 0 20px 45px rgba(30, 62, 110, .16), inset 0 1px 0 rgba(255, 255, 255, .82);
}

.atlas-area-menu[hidden] {
  display: none;
}

.atlas-area-option {
  align-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: .58rem;
  color: var(--atlas-copy);
  cursor: pointer;
  display: flex;
  font-size: .72rem;
  line-height: 1.25;
  min-height: 2.1rem;
  padding: .48rem .62rem;
  text-align: left;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
  width: 100%;
}

.atlas-area-option:hover,
.atlas-area-option:focus-visible,
.atlas-area-option[aria-selected="true"] {
  background: color-mix(in srgb, var(--atlas-brand-blue) 20%, transparent);
  border-color: color-mix(in srgb, var(--atlas-brand-sky) 35%, transparent);
  color: var(--atlas-ink);
}

.atlas-area-option[aria-selected="true"] {
  font-weight: 600;
}

.atlas-navbar-actions {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: .34rem;
}

.atlas-navbar-group {
  align-items: center;
  display: flex;
  gap: .12rem;
}

.atlas-navbar-system-actions {
  border-left: 1px solid color-mix(in srgb, var(--atlas-glass-line) 58%, transparent);
  margin-left: .2rem;
  padding-left: .28rem;
}

.atlas-nav-button,
.atlas-icon-button {
  align-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  color: var(--atlas-copy);
  cursor: pointer;
  display: inline-flex;
  gap: .32rem;
  justify-content: center;
  min-height: 2.2rem;
  padding: .35rem .58rem;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease;
  white-space: nowrap;
}

.atlas-icon-button {
  min-width: 2.2rem;
  padding-inline: .55rem;
}

.atlas-nav-button:hover,
.atlas-icon-button:hover {
  background: color-mix(in srgb, var(--atlas-glass-highlight) 42%, transparent);
  border-color: var(--atlas-glass-line);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--atlas-glass-highlight) 78%, transparent);
  color: var(--atlas-ink);
  transform: translateY(-1px);
}

.atlas-nav-button-primary {
  background: var(--atlas-blue);
  border-color: var(--atlas-blue);
  color: white;
}

.atlas-nav-button-primary:hover {
  background: var(--atlas-blue-bright);
  border-color: var(--atlas-blue-bright);
  color: white;
}

.atlas-icon {
  display: block;
  height: .9rem;
  width: .9rem;
}

.atlas-control-label {
  font-size: inherit;
}

.atlas-logout-button {
  color: var(--atlas-muted);
  font-size: .72rem;
}

.atlas-reopen-nav {
  align-items: center;
  -webkit-backdrop-filter: var(--atlas-glass-filter);
  backdrop-filter: var(--atlas-glass-filter);
  background: linear-gradient(145deg, rgba(255, 255, 255, .1), transparent 48%), var(--atlas-glass);
  border: 1px solid var(--atlas-glass-line);
  border-radius: 999px;
  box-shadow: var(--atlas-glass-shadow);
  color: var(--atlas-ink);
  cursor: pointer;
  display: flex;
  height: 2.8rem;
  justify-content: center;
  position: fixed;
  right: 1rem;
  top: 1rem;
  width: 2.8rem;
  z-index: 7000;
}

.atlas-reopen-nav[hidden],
.atlas-navbar [hidden] {
  display: none;
}

.atlas-nav-hidden .atlas-navbar {
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -140%);
}

.atlas-main {
  min-height: var(--atlas-visual-height, 100dvh);
  position: relative;
  width: 100vw;
  max-width: none;
}

.atlas-graph-view,
.atlas-note-view {
  box-sizing: border-box;
  opacity: 0;
  pointer-events: none;
  transform: scale(.988);
  transform-origin: top center;
  transition: opacity 300ms ease, transform 360ms cubic-bezier(.22, .8, .2, 1), visibility 300ms ease;
  visibility: hidden;
}

.atlas-graph-view {
  height: 100dvh;
  min-height: 100dvh;
  position: fixed;
  inset: 0;
  width: 100vw;
  max-width: none;
  overflow: visible;
  z-index: 1;
}

.atlas-note-view {
  box-sizing: border-box;
  min-height: 100dvh;
  padding: 7.4rem clamp(1rem, 5vw, 5.5rem) 3rem;
  position: absolute;
  inset: 0;
  z-index: 2;
}

.atlas-note-view:not(.is-active) {
  overflow: hidden;
}

.atlas-graph-view.is-active,
.atlas-note-view.is-active {
  opacity: 1;
  pointer-events: auto;
  transform: none;
  visibility: visible;
}

.atlas-graph-view.is-active {
  display: block;
}

.atlas-note-view.is-active {
  position: relative;
  inset: auto;
}

.atlas-graph-surface {
  box-sizing: border-box;
  contain: layout paint;
  height: 100%;
  isolation: isolate;
  min-height: 100%;
  position: relative;
  width: 100%;
}

.atlas-graph-view > .atlas-graph-surface {
  height: 100%;
}

.atlas-graph-surface::before {
  background-image: linear-gradient(rgba(142, 185, 255, .035) 1px, transparent 1px), linear-gradient(90deg, rgba(142, 185, 255, .035) 1px, transparent 1px);
  background-size: 64px 64px;
  content: "";
  inset: 0;
  mask-image: radial-gradient(circle at center, black, transparent 78%);
  pointer-events: none;
  position: absolute;
}

.atlas-graph-canvas {
  box-sizing: border-box;
  cursor: grab;
  display: block;
  height: 100%;
  max-height: 100%;
  position: relative;
  touch-action: none;
  user-select: none;
  width: 100%;
  z-index: 1;
}

.atlas-graph-canvas:active {
  cursor: grabbing;
}

.atlas-graph-empty,
.atlas-graph-error,
.atlas-graph-loading {
  color: var(--atlas-copy);
  left: 50%;
  margin: 0;
  max-width: 20rem;
  padding: 1rem;
  position: absolute;
  text-align: center;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.atlas-graph-loading {
  opacity: .8;
}

.atlas-graph-list {
  bottom: 1rem;
  color: var(--atlas-copy);
  left: 1rem;
  max-width: 16rem;
  position: absolute;
  z-index: 3;
}

.atlas-graph-list summary {
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  backdrop-filter: blur(24px) saturate(150%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .09), transparent 48%), var(--atlas-glass);
  border: 1px solid var(--atlas-glass-line);
  border-radius: 999px;
  box-shadow: var(--atlas-glass-shadow);
  cursor: pointer;
  padding: .55rem .8rem;
}

.atlas-graph-list[open] summary {
  border-radius: 12px 12px 0 0;
}

.atlas-graph-list-items {
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  backdrop-filter: blur(24px) saturate(150%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .06), transparent 50%), var(--atlas-glass-strong);
  border: 1px solid var(--atlas-glass-line);
  border-top: 0;
  list-style: decimal;
  margin: 0;
  max-height: 15rem;
  overflow: auto;
  padding: .65rem .8rem .65rem 2rem;
}

.atlas-graph-list:not([open]) .atlas-graph-list-items {
  display: none;
}

.atlas-map-controls-shell {
  align-items: flex-end;
  bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: .45rem;
  position: absolute;
  right: 1rem;
  z-index: 4;
}

.atlas-return-context {
  -webkit-backdrop-filter: var(--atlas-glass-filter);
  backdrop-filter: var(--atlas-glass-filter);
  background: linear-gradient(145deg, rgba(255, 255, 255, .1), transparent 48%), var(--atlas-glass);
  border: 1px solid var(--atlas-glass-line);
  border-radius: 999px;
  box-shadow: var(--atlas-glass-shadow);
  color: var(--atlas-copy);
  cursor: pointer;
  font-size: .7rem;
  max-width: min(18rem, calc(100vw - 2rem));
  overflow: hidden;
  padding: .46rem .72rem;
  text-overflow: ellipsis;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease;
  white-space: nowrap;
}

.atlas-return-context:hover,
.atlas-return-context:focus-visible {
  background: color-mix(in srgb, var(--atlas-glass-highlight) 42%, transparent);
  border-color: var(--atlas-glass-line);
  color: var(--atlas-ink);
  transform: translateY(-1px);
}

.atlas-return-context[hidden] {
  display: none;
}

.atlas-map-controls {
  -webkit-backdrop-filter: var(--atlas-glass-filter);
  backdrop-filter: var(--atlas-glass-filter);
  background: linear-gradient(145deg, rgba(255, 255, 255, .1), transparent 48%), var(--atlas-glass);
  border: 1px solid var(--atlas-glass-line);
  border-radius: 999px;
  box-shadow: var(--atlas-glass-shadow);
  display: flex;
  overflow: hidden;
  position: relative;
}

.atlas-map-control {
  align-items: center;
  background: transparent;
  border: 0;
  border-right: 1px solid color-mix(in srgb, var(--atlas-glass-line) 72%, transparent);
  color: var(--atlas-copy);
  cursor: pointer;
  display: inline-flex;
  font-size: 1rem;
  height: 2.75rem;
  justify-content: center;
  padding: 0;
  transition: background-color 160ms ease, color 160ms ease;
  width: 2.75rem;
}

.atlas-map-control:last-child {
  border-right: 0;
}

.atlas-map-control:hover {
  background: color-mix(in srgb, var(--atlas-glass-highlight) 45%, transparent);
  color: var(--atlas-ink);
}

.atlas-map-control[data-atlas-graph-action="fit"] {
  color: var(--atlas-blue-soft);
  font-size: .82rem;
}

.atlas-concept-list-link {
  color: var(--atlas-copy);
  display: block;
  font-size: .78rem;
  padding: .18rem 0;
}

.atlas-reading-shell {
  margin: 0 auto;
  max-width: 78rem;
}

.atlas-reading-header {
  margin: 0 auto 2.4rem;
  max-width: 72ch;
}

.atlas-reading-kicker {
  color: var(--atlas-blue);
  font-family: var(--codeFont);
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .14em;
  margin: 0 0 .8rem;
}

.atlas-reading-header h1 {
  color: var(--atlas-ink);
  font-size: clamp(2.3rem, 6vw, 5.6rem);
  letter-spacing: -.06em;
  line-height: .98;
  margin: 0;
  max-width: 12ch;
  overflow-wrap: anywhere;
}

.atlas-note-content {
  margin: 0 auto;
  max-width: 72ch;
}

.atlas-note-content > article {
  margin: 0;
}

.atlas-note-content .article-title,
.atlas-note-content .content-meta,
.atlas-note-content .breadcrumbs {
  display: none;
}

.atlas-note-content article h2,
.atlas-note-content article h3,
.atlas-note-content article h4 {
  color: var(--atlas-ink);
  letter-spacing: -.025em;
}

.atlas-note-content article h2 {
  font-size: clamp(1.55rem, 3vw, 2.25rem);
  margin-top: 2.8rem;
}

.atlas-note-content article h3 {
  font-size: clamp(1.2rem, 2vw, 1.6rem);
  margin-top: 2.2rem;
}

.atlas-note-content article h4 {
  font-size: 1.05rem;
  margin-top: 1.8rem;
}

.atlas-note-content article p,
.atlas-note-content article li {
  color: var(--atlas-copy);
  line-height: 1.7;
}

.atlas-note-content article p {
  text-align: justify;
}

.atlas-note-content article ul,
.atlas-note-content article ol {
  padding-left: 1.35rem;
}

.atlas-note-content article blockquote {
  border-left: 2px solid var(--atlas-blue);
  color: var(--atlas-copy);
  margin: 1.5rem 0;
  padding: .1rem 0 .1rem 1.1rem;
}

.atlas-note-content article .table-container {
  margin: 1.5rem 0;
  max-width: 100%;
  overflow-x: auto;
}

.atlas-note-content article table {
  border-collapse: collapse;
  min-width: 32rem;
  width: 100%;
}

.atlas-note-content article th,
.atlas-note-content article td {
  border-bottom: 1px solid var(--atlas-line);
  padding: .65rem .75rem;
  text-align: left;
  vertical-align: top;
}

.atlas-note-content article th {
  color: var(--atlas-ink);
  font-weight: 700;
}

.atlas-note-content article img,
.atlas-note-content article video,
.atlas-note-content article iframe {
  border-radius: 12px;
  height: auto;
  max-width: 100%;
}

.atlas-note-content article pre {
  max-width: 100%;
  overflow-x: auto;
}

.atlas-note-content article .footnotes {
  border-top: 1px solid var(--atlas-line);
  margin-top: 2.5rem;
  padding-top: 1.25rem;
}

.atlas-note-content article a.external {
  text-decoration-thickness: .08em;
  text-underline-offset: .18em;
}

.atlas-note-content a.internal {
  background: color-mix(in srgb, var(--atlas-blue) 10%, transparent);
  border-radius: .35rem;
  color: var(--atlas-blue);
  padding: .08em .2em;
  text-decoration: none;
}

.atlas-note-content a.internal:hover {
  background: color-mix(in srgb, var(--atlas-blue-bright) 16%, transparent);
  color: var(--atlas-blue-bright);
}

.atlas-minimap-shell {
  -webkit-backdrop-filter: blur(24px) saturate(145%);
  backdrop-filter: blur(24px) saturate(145%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .07), transparent 48%), var(--atlas-glass-strong);
  border: 1px solid var(--atlas-line);
  border-radius: 20px;
  box-shadow: var(--atlas-glass-shadow);
  height: clamp(12rem, 27vw, 21rem);
  margin: 3rem auto 0;
  max-width: 78rem;
  overflow: hidden;
  position: relative;
}

.atlas-note-graph-slot {
  height: 100%;
  min-height: 0;
  position: relative;
  width: 100%;
}

.atlas-note-graph-slot > .atlas-graph-surface {
  height: 100%;
  min-height: 0;
}

.atlas-development-state {
  border-left: 2px solid var(--atlas-muted);
  margin: 0;
  padding: .35rem 0 .35rem 1.2rem;
}

.atlas-development-mark {
  color: var(--atlas-muted);
  display: block;
  font-family: var(--codeFont);
  font-size: 1.4rem;
  letter-spacing: .1em;
  line-height: 1;
  margin-bottom: .9rem;
}

.atlas-development-title {
  color: var(--atlas-ink);
  font-size: clamp(1.35rem, 3vw, 2rem);
  letter-spacing: -.03em;
  line-height: 1.15;
  margin: 0 0 .7rem;
}

.atlas-development-copy,
.atlas-note-error {
  color: var(--atlas-copy);
  line-height: 1.6;
  margin: 0;
}

.atlas-development-back {
  background: var(--atlas-glass);
  border: 1px solid var(--atlas-glass-line);
  border-radius: 999px;
  box-shadow: var(--atlas-glass-shadow);
  color: var(--atlas-ink);
  cursor: pointer;
  margin-top: 1.3rem;
  padding: .55rem .9rem;
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.atlas-development-back:hover {
  background: var(--atlas-glass-highlight);
  border-color: var(--atlas-line-strong);
  transform: translateY(-1px);
}

.atlas-minimap-surface {
  height: 100%;
  min-height: 0;
}

.atlas-minimap-label {
  color: var(--atlas-muted);
  font-family: var(--codeFont);
  font-size: .62rem;
  left: .9rem;
  letter-spacing: .14em;
  pointer-events: none;
  position: absolute;
  top: .75rem;
  z-index: 2;
}

.atlas-minimap-surface .atlas-graph-canvas {
  opacity: .94;
}

.atlas-minimap-surface .atlas-graph-empty {
  font-size: .75rem;
}

.atlas-mobile-actions,
.atlas-mobile-graph-tools {
  display: none;
}

.atlas-mobile-action,
.atlas-mobile-area-trigger {
  -webkit-user-select: none;
  user-select: none;
}

.atlas-mobile-graph-tools[hidden],
.atlas-mobile-action[hidden] {
  display: none !important;
}

@media all and (max-width: 1024px) {
  .atlas-search-field input {
    font-size: 16px;
  }

  .atlas-reopen-nav {
    right: calc(.75rem + var(--atlas-safe-right));
    top: calc(.75rem + var(--atlas-safe-top));
  }

  .atlas-navbar {
    box-sizing: border-box;
    flex-wrap: nowrap;
    gap: .35rem;
    left: calc(50% + (var(--atlas-safe-left) - var(--atlas-safe-right)) / 2);
    max-width: calc(100vw - 2rem - var(--atlas-safe-left) - var(--atlas-safe-right));
    min-height: 3.35rem;
    padding: .28rem .34rem .28rem .58rem;
    top: calc(.65rem + var(--atlas-safe-top));
    width: calc(100vw - 2rem - var(--atlas-safe-left) - var(--atlas-safe-right));
  }

  .atlas-brand {
    flex: 0 0 auto;
    height: 2.75rem;
  }

  .atlas-brand-logo {
    height: 2.55rem;
    width: 4.35rem;
  }

  .atlas-graph-filters,
  .atlas-navbar-actions {
    display: none !important;
  }

  .atlas-mobile-actions {
    align-items: center;
    display: flex;
    flex: 0 0 auto;
    gap: .08rem;
    margin-left: auto;
  }

  .atlas-mobile-action {
    align-items: center;
    border-radius: 999px;
    display: inline-flex;
    height: 2.75rem;
    justify-content: center;
    min-height: 2.75rem;
    min-width: 2.75rem;
    padding: 0;
    touch-action: manipulation;
  }

  .atlas-mobile-action:hover {
    transform: none;
  }

  .atlas-mobile-action:active,
  .atlas-mobile-action[aria-expanded="true"] {
    background: color-mix(in srgb, var(--atlas-glass-highlight) 42%, transparent);
    color: var(--atlas-ink);
    transform: scale(.96);
  }

  .atlas-mobile-action .atlas-icon {
    height: 1.08rem;
    width: 1.08rem;
  }

  .atlas-mobile-graph-tools {
    align-items: center;
    display: flex;
    left: calc(.75rem + var(--atlas-safe-left));
    pointer-events: none;
    position: fixed;
    top: calc(4.55rem + var(--atlas-safe-top));
    z-index: 6500;
  }

  .atlas-mobile-area-trigger {
    align-items: center;
    -webkit-backdrop-filter: blur(18px) saturate(145%);
    backdrop-filter: blur(18px) saturate(145%);
    background: linear-gradient(145deg, rgba(255, 255, 255, .1), transparent 48%), var(--atlas-glass);
    border: 1px solid var(--atlas-glass-line);
    border-radius: 999px;
    box-shadow: var(--atlas-glass-shadow);
    color: var(--atlas-copy);
    display: inline-flex;
    font-size: .76rem;
    gap: .45rem;
    justify-content: space-between;
    min-height: 2.75rem;
    max-width: min(17rem, calc(100vw - 1.5rem - var(--atlas-safe-left) - var(--atlas-safe-right)));
    padding: .45rem .65rem .45rem .85rem;
    pointer-events: auto;
    text-align: left;
    touch-action: manipulation;
  }

  .atlas-mobile-area-trigger:hover,
  .atlas-mobile-area-trigger:focus-visible,
  .atlas-mobile-area-trigger[aria-expanded="true"] {
    background: color-mix(in srgb, var(--atlas-glass-highlight) 42%, transparent);
    border-color: color-mix(in srgb, var(--atlas-brand-sky) 48%, var(--atlas-glass-line));
    color: var(--atlas-ink);
  }

  .atlas-mobile-area-trigger span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .atlas-graph-view {
    height: var(--atlas-visual-height, 100dvh);
    min-height: var(--atlas-visual-height, 100dvh);
    overscroll-behavior: none;
  }

  .atlas-graph-surface,
  .atlas-graph-view > .atlas-graph-surface {
    height: 100%;
    min-height: 100%;
  }

  .atlas-graph-list {
    bottom: calc(.75rem + var(--atlas-safe-bottom));
    left: calc(.75rem + var(--atlas-safe-left));
  }

  .atlas-map-controls-shell {
    bottom: calc(.75rem + var(--atlas-safe-bottom));
    right: calc(.75rem + var(--atlas-safe-right));
  }

  .atlas-map-control {
    font-size: 1.08rem;
    height: 3rem;
    min-height: 3rem;
    width: 3rem;
    touch-action: manipulation;
  }

  .atlas-map-control:active {
    background: color-mix(in srgb, var(--atlas-glass-highlight) 48%, transparent);
    color: var(--atlas-ink);
  }

  .atlas-return-context,
  .atlas-graph-list summary {
    min-height: 2.75rem;
    touch-action: manipulation;
  }

  .atlas-note-view {
    padding-left: max(1rem, calc(clamp(1rem, 5vw, 5.5rem) + var(--atlas-safe-left)));
    padding-right: max(1rem, calc(clamp(1rem, 5vw, 5.5rem) + var(--atlas-safe-right)));
    padding-bottom: calc(3rem + var(--atlas-safe-bottom));
    padding-top: calc(5.75rem + var(--atlas-safe-top));
  }

  .atlas-note-content article .table-container {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
  }

  .atlas-minimap-shell .atlas-graph-canvas {
    touch-action: pan-y;
  }
}

@media all and (min-width: 601px) and (max-width: 1024px) {
  .atlas-navbar {
    max-width: calc(100vw - 3rem - var(--atlas-safe-left) - var(--atlas-safe-right));
    top: calc(1rem + var(--atlas-safe-top));
    width: calc(100vw - 3rem - var(--atlas-safe-left) - var(--atlas-safe-right));
  }

  .atlas-mobile-graph-tools {
    left: calc(1.5rem + var(--atlas-safe-left));
    top: calc(5rem + var(--atlas-safe-top));
  }

  .atlas-mobile-area-trigger {
    font-size: .82rem;
    min-height: 3rem;
  }

  .atlas-map-control {
    height: 3.15rem;
    min-height: 3.15rem;
    width: 3.15rem;
  }

  .atlas-map-controls-shell {
    bottom: calc(1.35rem + var(--atlas-safe-bottom));
    right: calc(1.35rem + var(--atlas-safe-right));
  }

  .atlas-graph-list {
    bottom: calc(1.35rem + var(--atlas-safe-bottom));
    left: calc(1.35rem + var(--atlas-safe-left));
  }
}

@media all and (max-width: 600px) {
  .atlas-navbar {
    max-width: calc(100vw - 1rem - var(--atlas-safe-left) - var(--atlas-safe-right));
    min-height: 3.4rem;
    padding-left: .5rem;
    top: calc(.5rem + var(--atlas-safe-top));
    width: calc(100vw - 1rem - var(--atlas-safe-left) - var(--atlas-safe-right));
  }

  .atlas-brand {
    height: 2.7rem;
  }

  .atlas-brand-logo {
    height: 2.3rem;
    width: 3.95rem;
  }

  .atlas-mobile-actions {
    gap: 0;
  }

  .atlas-mobile-action {
    height: 2.75rem;
    min-height: 2.75rem;
    min-width: 2.75rem;
  }

  .atlas-mobile-action .atlas-icon {
    height: 1rem;
    width: 1rem;
  }

  .atlas-mobile-graph-tools {
    left: calc(.7rem + var(--atlas-safe-left));
    top: calc(4.45rem + var(--atlas-safe-top));
  }

  .atlas-mobile-area-trigger {
    font-size: .72rem;
    min-height: 2.75rem;
    padding-left: .75rem;
  }

  .atlas-map-controls-shell {
    bottom: calc(.7rem + var(--atlas-safe-bottom));
    right: calc(.7rem + var(--atlas-safe-right));
  }

  .atlas-map-control {
    height: 3.05rem;
    min-height: 3.05rem;
    width: 3.05rem;
  }

  .atlas-return-context {
    max-width: min(16rem, calc(100vw - 1.4rem - var(--atlas-safe-left) - var(--atlas-safe-right)));
  }

  .atlas-graph-list {
    bottom: calc(.7rem + var(--atlas-safe-bottom));
    left: calc(.7rem + var(--atlas-safe-left));
    max-width: min(12rem, calc(100vw - 11rem));
  }

  .atlas-note-view {
    padding-left: max(1rem, calc(1rem + var(--atlas-safe-left)));
    padding-right: max(1rem, calc(1rem + var(--atlas-safe-right)));
    padding-top: calc(5.35rem + var(--atlas-safe-top));
  }

  .atlas-reading-header {
    margin-bottom: 1.65rem;
  }

  .atlas-reading-header h1 {
    font-size: clamp(2rem, 10.5vw, 3.25rem);
    line-height: 1.02;
    max-width: 14ch;
  }

  .atlas-note-content {
    font-size: 1rem;
  }

  .atlas-note-content article p,
  .atlas-note-content article li {
    line-height: 1.65;
  }

  .atlas-note-content article h2 {
    font-size: clamp(1.45rem, 7vw, 2rem);
    margin-top: 2.35rem;
  }

  .atlas-note-content article h3 {
    font-size: clamp(1.18rem, 5.5vw, 1.5rem);
    margin-top: 1.9rem;
  }

  .atlas-note-content article iframe {
    aspect-ratio: 16 / 9;
    height: auto;
    min-height: 0;
    width: 100%;
  }

  .atlas-minimap-shell {
    height: 13rem;
    margin-top: 2rem;
  }

  .atlas-minimap-shell .atlas-graph-canvas {
    touch-action: pan-y;
  }
}

@media all and (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
  .atlas-mobile-graph-tools {
    left: calc(1.25rem + var(--atlas-safe-left));
    top: calc(5.2rem + var(--atlas-safe-top));
  }

  .atlas-note-view {
    padding-top: calc(5.8rem + var(--atlas-safe-top));
  }
}


`
