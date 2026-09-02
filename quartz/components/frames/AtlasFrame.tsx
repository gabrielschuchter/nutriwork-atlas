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
    const logoHref = resolveRelative(current, "static/icon.png" as FullSlug)

    return (
      <div class="atlas-frame" data-atlas-route={isGraph ? "graph" : isNote ? "note" : "other"}>
        <a class="atlas-skip-link" href="#main-content">
          Ir para o conteúdo
        </a>

        <div class="atlas-before-body">
          {beforeBody.map((BodyComponent) => (
            <BodyComponent {...componentData} />
          ))}
        </div>

        <header id="atlas-navbar" class="atlas-navbar" aria-label="Navegação do Atlas">
          <a class="atlas-brand" href={homeHref} aria-label="Nutriwork Atlas, grafo">
            <img class="atlas-brand-symbol" src={logoHref} alt="" width="30" height="30" />
            <span class="atlas-brand-wordmark">
              <strong>NUTRIWORK</strong>
              <span>ATLAS</span>
            </span>
          </a>

          {isGraph ? (
            <div class="atlas-graph-filters" aria-label="Filtros do grafo">
              <label class="atlas-visually-hidden" for="atlas-search">
                Buscar conceitos
              </label>
              <span class="atlas-search-field">
                <span class="atlas-search-icon" aria-hidden="true">
                  ⌕
                </span>
                <input
                  id="atlas-search"
                  type="search"
                  placeholder="Buscar no grafo"
                  autocomplete="off"
                  spellcheck={false}
                />
              </span>
              <label class="atlas-visually-hidden" for="atlas-area-filter">
                Filtrar por área
              </label>
              <select id="atlas-area-filter" aria-label="Filtrar por área">
                <option value="all">Todas as áreas</option>
              </select>
            </div>
          ) : null}

          <div class="atlas-navbar-actions">
            {isGraph ? (
              <button
                id="atlas-onboarding-open"
                class="atlas-icon-button"
                type="button"
                data-atlas-action="open-onboarding"
                aria-label="Reabrir introdução do Atlas"
                title="Como funciona?"
              >
                <span aria-hidden="true">?</span>
                <span class="atlas-control-label">Como funciona?</span>
              </button>
            ) : null}
            {isNote ? (
              <>
                <button
                  id="atlas-back"
                  class="atlas-nav-button"
                  type="button"
                  data-atlas-action="go-back"
                  aria-label="Voltar ao contexto anterior"
                >
                  <span aria-hidden="true">←</span>
                  <span>Voltar</span>
                </button>
                <button
                  id="atlas-expand-graph"
                  class="atlas-nav-button atlas-nav-button-primary"
                  type="button"
                  data-atlas-action="expand-graph"
                  aria-label="Expandir grafo"
                >
                  <span aria-hidden="true">◌</span>
                  <span>Expandir grafo</span>
                </button>
              </>
            ) : null}
            <button
              id="atlas-return-note"
              class="atlas-nav-button atlas-return-note"
              type="button"
              data-atlas-action="return-note"
              hidden
            >
              Voltar à nota
            </button>
            <button
              id="atlas-theme-toggle"
              class="atlas-icon-button"
              type="button"
              data-atlas-action="toggle-theme"
              aria-label="Alternar tema"
              title="Alternar tema"
            >
              <span aria-hidden="true">◐</span>
              <span class="atlas-control-label">Tema</span>
            </button>
            <button
              class="atlas-icon-button atlas-hide-nav"
              type="button"
              data-atlas-action="toggle-nav"
              aria-label="Ocultar barra de navegação"
              title="Ocultar barra de navegação"
            >
              <span aria-hidden="true">⌃</span>
            </button>
            <button
              id="atlas-access-logout"
              class="atlas-icon-button atlas-logout-button"
              type="button"
              aria-label="Sair do Atlas"
              title="Sair do Atlas"
            >
              <span aria-hidden="true">↪</span>
              <span class="atlas-control-label">Sair</span>
            </button>
          </div>
        </header>

        <button
          id="atlas-reopen-nav"
          class="atlas-reopen-nav"
          type="button"
          data-atlas-action="show-nav"
          aria-label="Mostrar barra de navegação"
          title="Mostrar barra de navegação"
          hidden
        >
          <span aria-hidden="true">+</span>
          <span class="atlas-visually-hidden">Mostrar navegação</span>
        </button>

        {isGraph ? (
          <main id="main-content" class="atlas-graph-main" aria-label="Grafo de conceitos">
            <div
              id="atlas-graph-root"
              class="atlas-graph-surface"
              data-atlas-graph-mode="explore"
              role="region"
              aria-label="Grafo explorável de conceitos"
            >
              <p class="atlas-graph-loading" role="status">
                Carregando grafo…
              </p>
            </div>
          </main>
        ) : isNote ? (
          <main id="main-content" class="atlas-reading-main">
            <section class="atlas-reading-shell" aria-labelledby="atlas-note-title">
              <header class="atlas-reading-header">
                <p class="atlas-reading-kicker">CONCEITO NO GRAFO</p>
                <h1 id="atlas-note-title">{title}</h1>
              </header>
              <div class="atlas-note-content">
                <Content {...componentData} />
              </div>
              <section class="atlas-minimap-shell" aria-label={"Minimapa do conceito " + title}>
                <div
                  id="atlas-note-graph"
                  class="atlas-graph-surface atlas-minimap-surface"
                  data-atlas-graph-mode="minimap"
                  data-atlas-current={noteSlug}
                  role="region"
                  aria-label="Minimapa do grafo"
                >
                  <p class="atlas-graph-loading" role="status">
                    Carregando minimapa…
                  </p>
                </div>
              </section>
            </section>
          </main>
        ) : (
          <main id="main-content" class="atlas-reading-main">
            <section class="atlas-reading-shell">
              <div class="atlas-note-content">
                <Content {...componentData} />
              </div>
            </section>
          </main>
        )}

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
  --atlas-glass: rgba(6, 15, 32, .34);
  --atlas-glass-soft: rgba(7, 16, 35, .18);
  --atlas-glass-strong: rgba(7, 16, 35, .56);
  --atlas-glass-line: rgba(220, 235, 255, .16);
  --atlas-glass-highlight: rgba(255, 255, 255, .13);
  --atlas-glass-shadow: 0 18px 52px rgba(0, 0, 0, .24), inset 0 1px 0 rgba(255, 255, 255, .12), inset 1px 0 0 rgba(255, 255, 255, .055);
  --atlas-blue: #1263FF;
  --atlas-blue-bright: #29A8FF;
  --atlas-blue-soft: #8EB9FF;
  --atlas-shadow: 0 18px 45px rgba(0, 0, 0, .24);
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
  --atlas-glass: rgba(247, 250, 255, .48);
  --atlas-glass-soft: rgba(255, 255, 255, .26);
  --atlas-glass-strong: rgba(247, 250, 255, .68);
  --atlas-glass-line: rgba(255, 255, 255, .7);
  --atlas-glass-highlight: rgba(255, 255, 255, .92);
  --atlas-glass-shadow: 0 18px 48px rgba(30, 62, 110, .14), inset 0 1px 0 rgba(255, 255, 255, .92), inset 1px 0 0 rgba(255, 255, 255, .58);
  --atlas-shadow: 0 18px 45px rgba(30, 62, 110, .12);
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
  min-height: 100vh;
  overflow: clip;
  position: relative;
}

.atlas-frame[aria-busy="true"] {
  cursor: progress;
}

.atlas-route-loading .atlas-graph-main,
.atlas-route-loading .atlas-reading-main {
  opacity: .82;
  transition: opacity 140ms ease;
}

#quartz-root:has(.atlas-frame),
#quartz-body:has(.atlas-frame) {
  box-sizing: border-box;
  height: 100%;
  margin: 0;
  min-height: 100vh;
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
  -webkit-backdrop-filter: blur(26px) saturate(148%);
  backdrop-filter: blur(26px) saturate(148%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .075), transparent 42%), var(--atlas-glass);
  border: 1px solid var(--atlas-glass-line);
  border-radius: 999px;
  box-shadow: var(--atlas-glass-shadow);
  display: flex;
  gap: .8rem;
  left: 50%;
  max-width: calc(100vw - 2rem);
  min-height: 3.35rem;
  padding: .42rem .5rem .42rem .7rem;
  position: fixed;
  top: 1rem;
  transform: translateX(-50%);
  transition: opacity 180ms ease, transform 220ms ease;
  width: min(72rem, calc(100vw - 2rem));
  z-index: 7000;
}

.atlas-brand {
  align-items: center;
  color: var(--atlas-ink);
  display: inline-flex;
  flex: 0 0 auto;
  gap: .55rem;
  text-decoration: none;
}

.atlas-brand-symbol {
  display: block;
  height: 1.9rem;
  object-fit: contain;
  width: 1.9rem;
}

.atlas-brand-wordmark {
  align-items: baseline;
  display: inline-flex;
  gap: .35rem;
  letter-spacing: .08em;
  line-height: 1;
}

.atlas-brand-wordmark strong {
  font-size: .72rem;
  font-weight: 800;
}

.atlas-brand-wordmark span {
  color: var(--atlas-blue-soft);
  font-family: var(--codeFont);
  font-size: .58rem;
}

.atlas-graph-filters {
  align-items: center;
  display: flex;
  flex: 1 1 auto;
  gap: .45rem;
  min-width: 0;
}

.atlas-search-field {
  align-items: center;
  background: var(--atlas-glass-soft);
  border: 1px solid var(--atlas-glass-line);
  border-radius: 999px;
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--atlas-glass-highlight) 72%, transparent);
  display: flex;
  flex: 1 1 15rem;
  min-width: 7rem;
}

:root[data-theme="light"] .atlas-search-field {
  background: rgba(255, 255, 255, .34);
}

.atlas-search-icon {
  color: var(--atlas-muted);
  font-size: 1.1rem;
  line-height: 1;
  padding-left: .75rem;
}

.atlas-search-field input {
  background: transparent;
  border: 0;
  color: var(--atlas-ink);
  min-height: 2.35rem;
  min-width: 0;
  outline: 0;
  padding: .5rem .75rem .5rem .4rem;
  width: 100%;
}

.atlas-search-field input::placeholder {
  color: var(--atlas-muted);
}

.atlas-graph-filters select {
  background: var(--atlas-glass-soft);
  border: 1px solid var(--atlas-glass-line);
  border-radius: 999px;
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--atlas-glass-highlight) 72%, transparent);
  color: var(--atlas-copy);
  cursor: pointer;
  min-height: 2.35rem;
  max-width: 12rem;
  padding: .45rem 2rem .45rem .75rem;
}

.atlas-navbar-actions {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: .28rem;
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
  gap: .38rem;
  justify-content: center;
  min-height: 2.45rem;
  padding: .5rem .72rem;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
  white-space: nowrap;
}

.atlas-icon-button {
  min-width: 2.45rem;
  padding-inline: .62rem;
}

.atlas-nav-button:hover,
.atlas-icon-button:hover {
  background: color-mix(in srgb, var(--atlas-glass-highlight) 42%, transparent);
  border-color: var(--atlas-glass-line);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--atlas-glass-highlight) 78%, transparent);
  color: var(--atlas-ink);
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
  height: 1.05rem;
  width: 1.05rem;
}

.atlas-control-label {
  font-size: .72rem;
}

.atlas-logout-button {
  color: var(--atlas-muted);
  font-size: .7rem;
}

.atlas-reopen-nav {
  align-items: center;
  -webkit-backdrop-filter: blur(24px) saturate(145%);
  backdrop-filter: blur(24px) saturate(145%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .075), transparent 48%), var(--atlas-glass);
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

.atlas-graph-main {
  height: 100vh;
  min-height: 34rem;
  position: relative;
  width: 100%;
}

.atlas-graph-surface {
  height: 100%;
  min-height: 100%;
  position: relative;
  width: 100%;
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
  -webkit-backdrop-filter: blur(22px) saturate(145%);
  backdrop-filter: blur(22px) saturate(145%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .07), transparent 48%), var(--atlas-glass);
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
  background: var(--atlas-glass-strong);
  border: 1px solid var(--atlas-glass-line);
  border-top: 0;
  list-style: decimal;
  margin: 0;
  max-height: 15rem;
  overflow: auto;
  padding: .65rem .8rem .65rem 2rem;
}

.atlas-map-controls {
  -webkit-backdrop-filter: blur(24px) saturate(148%);
  backdrop-filter: blur(24px) saturate(148%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .075), transparent 48%), var(--atlas-glass);
  border: 1px solid var(--atlas-glass-line);
  border-radius: 999px;
  bottom: 1rem;
  box-shadow: var(--atlas-glass-shadow);
  display: flex;
  overflow: hidden;
  position: absolute;
  right: 1rem;
  z-index: 4;
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

.atlas-reading-main {
  min-height: 100vh;
  padding: 7.4rem clamp(1rem, 5vw, 5.5rem) 3rem;
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
  background: var(--atlas-surface);
  border: 1px solid var(--atlas-line);
  border-radius: 20px;
  box-shadow: var(--atlas-shadow);
  height: clamp(12rem, 27vw, 21rem);
  margin: 3rem auto 0;
  max-width: 78rem;
  overflow: hidden;
  position: relative;
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

@media all and (max-width: 850px) {
  .atlas-navbar {
    border-radius: 18px;
    flex-wrap: wrap;
    padding: .45rem;
    top: .65rem;
  }

  .atlas-brand {
    flex: 1 1 auto;
  }

  .atlas-graph-filters {
    flex-basis: 100%;
    order: 3;
  }

  .atlas-navbar-actions {
    margin-left: auto;
  }

  .atlas-navbar-actions .atlas-nav-button span:last-child {
    display: none;
  }

  .atlas-graph-filters select {
    max-width: 10rem;
  }

  .atlas-reading-main {
    padding-inline: 1rem;
    padding-top: 8.5rem;
  }
}

@media all and (max-width: 560px) {
  .atlas-navbar {
    max-width: calc(100vw - 1rem);
    width: calc(100vw - 1rem);
  }

  .atlas-brand-wordmark {
    gap: 0;
  }

  .atlas-brand-wordmark span {
    display: none;
  }

  .atlas-control-label {
    display: none;
  }

  .atlas-graph-filters {
    gap: .3rem;
  }

  .atlas-search-field {
    flex-basis: 0;
  }

  .atlas-graph-filters select {
    flex: 0 1 9.5rem;
    max-width: 42%;
  }

  .atlas-graph-main {
    min-height: 100svh;
  }

  .atlas-reading-header {
    margin-bottom: 1.8rem;
  }

  .atlas-reading-header h1 {
    font-size: clamp(2.2rem, 13vw, 4rem);
  }

  .atlas-minimap-shell {
    border-radius: 16px;
    height: 13rem;
    margin-top: 2.2rem;
  }

  .atlas-graph-list {
    bottom: .65rem;
    left: .65rem;
  }

  .atlas-map-controls {
    bottom: .65rem;
    right: .65rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: .01ms !important;
  }
}
`
