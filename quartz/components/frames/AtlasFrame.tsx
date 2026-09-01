import { FullSlug, resolveRelative } from "../../util/path"
import { PageFrame, PageFrameProps } from "./types"

const navItems = [
  { label: "Hoje", slug: "hoje", icon: "✦" },
  { label: "Estudar", slug: "atlas/index", icon: "◌" },
  { label: "Explorar", slug: "mapa-do-atlas", icon: "⌘" },
  { label: "Grafo", slug: "grafo", icon: "⟡" },
  { label: "Revisar", slug: "revisar", icon: "↗" },
]

function linkFrom(current: FullSlug, target: string): string {
  return resolveRelative(current, target as FullSlug)
}

export const AtlasFrame: PageFrame = {
  name: "atlas",
  render({
    componentData,
    header,
    beforeBody,
    pageBody: Content,
    afterBody,
    left,
    right,
    footer,
  }: PageFrameProps) {
    const current = componentData.fileData.slug ?? ("index" as FullSlug)
    const homeHref = linkFrom(current, "atlas/index")

    return (
      <div class="atlas-frame">
        <button
          class="atlas-sidebar-backdrop"
          type="button"
          data-atlas-action="close-sidebar"
          aria-label="Fechar navegação"
        />
        <aside id="atlas-sidebar" class="atlas-sidebar" aria-label="Navegação do Atlas">
          <div class="atlas-brand-lockup">
            <a class="atlas-brand" href={homeHref} aria-label="Nutriwork Atlas, início">
              <span class="atlas-brand-mark" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
              <span class="atlas-brand-copy">
                <strong>NUTRIWORK</strong>
                <span>ATLAS</span>
              </span>
            </a>
            <span class="atlas-brand-caption">knowledge in motion</span>
          </div>

          <nav class="atlas-primary-nav" aria-label="Áreas principais">
            <p class="atlas-nav-kicker">SEU ESPAÇO DE ESTUDO</p>
            {navItems.map((item) => (
              <a
                class="atlas-nav-link"
                href={linkFrom(current, item.slug)}
                data-atlas-nav-slug={item.slug}
              >
                <span class="atlas-nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          <div class="atlas-sidebar-section atlas-sidebar-explorer">
            <div class="atlas-sidebar-section-heading">
              <span class="atlas-nav-kicker">ACERVO</span>
              <button
                type="button"
                class="atlas-sidebar-section-action"
                data-atlas-action="toggle-sidebar-explorer"
                aria-expanded="true"
                aria-controls="atlas-sidebar-explorer-content"
              >
                <span aria-hidden="true">+</span>
                <span class="atlas-visually-hidden">Alternar acervo</span>
              </button>
            </div>
            <div id="atlas-sidebar-explorer-content" class="atlas-sidebar-explorer-content">
              {left.map((BodyComponent) => (
                <BodyComponent {...componentData} />
              ))}
            </div>
          </div>

          <div class="atlas-sidebar-bottom">
            <button class="atlas-sidebar-utility" type="button" data-atlas-action="settings">
              <span class="atlas-utility-icon" aria-hidden="true">
                ◒
              </span>
              <span>Preferências</span>
            </button>
            <p>Uma rede para pensar melhor.</p>
          </div>
        </aside>

        <div class="atlas-main-column">
          <header class="atlas-topbar">
            <div class="atlas-topbar-leading">
              <button
                class="atlas-mobile-menu"
                type="button"
                data-atlas-action="toggle-sidebar"
                aria-expanded="false"
                aria-controls="atlas-sidebar"
                aria-label="Abrir navegação"
              >
                <span />
                <span />
                <span />
              </button>
              <div class="atlas-topbar-context">
                <span class="atlas-live-dot" aria-hidden="true" />
                <span>Nutriwork Atlas</span>
              </div>
            </div>
            <div class="atlas-topbar-actions">
              <button class="atlas-search-launch" type="button" data-atlas-action="palette">
                <span class="atlas-search-icon" aria-hidden="true">
                  ⌕
                </span>
                <span>Buscar no Atlas</span>
                <kbd>⌘ K</kbd>
              </button>
              <div id="atlas-theme-slot" class="atlas-theme-slot" />
              <button
                class="atlas-topbar-icon"
                type="button"
                data-atlas-action="settings"
                aria-label="Abrir preferências"
                title="Preferências"
              >
                ◒
              </button>
            </div>
            <div class="atlas-header-slots">
              {header.map((HeaderComponent) => (
                <HeaderComponent {...componentData} />
              ))}
            </div>
          </header>

          <main id="main-content" class="atlas-content-column">
            <div class="atlas-before-body">
              {beforeBody.map((BodyComponent) => (
                <BodyComponent {...componentData} />
              ))}
            </div>
            <Content {...componentData} />
            <div class="atlas-after-body">
              {afterBody.map((BodyComponent) => (
                <BodyComponent {...componentData} />
              ))}
            </div>
            <div class="atlas-frame-footer">
              {footer.map((FooterComponent) => (
                <FooterComponent {...componentData} />
              ))}
            </div>
          </main>
        </div>

        <aside class="atlas-context-rail" aria-label="Contexto de estudo">
          <div class="atlas-rail-inner">
            {right.map((BodyComponent) => (
              <BodyComponent {...componentData} />
            ))}
          </div>
        </aside>
      </div>
    )
  },
  css: `
:root {
  --atlas-ink: #07152a;
  --atlas-bg: #f4f7fc;
  --atlas-surface: rgba(255, 255, 255, 0.74);
  --atlas-surface-strong: #ffffff;
  --atlas-surface-soft: rgba(225, 235, 250, 0.58);
  --atlas-line: rgba(38, 82, 150, 0.14);
  --atlas-line-strong: rgba(18, 99, 255, 0.28);
  --atlas-copy: #526277;
  --atlas-muted: #8090a8;
  --atlas-blue: #0b63f6;
  --atlas-blue-bright: #29a8ff;
  --atlas-blue-soft: #8eb9ff;
  --atlas-orbit: rgba(11, 99, 246, 0.13);
  --atlas-glow: rgba(11, 99, 246, 0.16);
  --atlas-shadow: 0 24px 70px rgba(33, 71, 130, 0.11);
  --atlas-shadow-deep: 0 34px 90px rgba(33, 71, 130, 0.16);
}

:root[saved-theme="dark"],
:root[data-theme="dark"] {
  --atlas-ink: #f5f7ff;
  --atlas-bg: #010206;
  --atlas-surface: rgba(8, 17, 36, 0.7);
  --atlas-surface-strong: #071023;
  --atlas-surface-soft: rgba(12, 29, 61, 0.62);
  --atlas-line: rgba(142, 185, 255, 0.16);
  --atlas-line-strong: rgba(142, 185, 255, 0.36);
  --atlas-copy: #c8d2e5;
  --atlas-muted: #8192ad;
  --atlas-blue: #8eb9ff;
  --atlas-blue-bright: #29a8ff;
  --atlas-blue-soft: #6f9eea;
  --atlas-orbit: rgba(61, 133, 255, 0.2);
  --atlas-glow: rgba(33, 121, 255, 0.18);
  --atlas-shadow: 0 24px 70px rgba(0, 0, 0, 0.34);
  --atlas-shadow-deep: 0 34px 90px rgba(0, 0, 0, 0.5);
}

.page[data-frame="atlas"] {
  background: var(--atlas-bg);
  color: var(--atlas-copy);
  max-width: none;
  min-height: 100vh;
  width: 100%;
}

.page[data-frame="atlas"] > #quartz-body {
  display: block;
  padding: 0;
}

.atlas-frame {
  background:
    radial-gradient(circle at 69% -10%, var(--atlas-glow), transparent 28rem),
    radial-gradient(circle at 18% 92%, color-mix(in srgb, var(--atlas-blue-bright) 7%, transparent), transparent 26rem),
    var(--atlas-bg);
  display: grid;
  grid-template-columns: 272px minmax(0, 1fr) 326px;
  min-height: 100vh;
  position: relative;
}

.atlas-frame::before {
  background-image: linear-gradient(color-mix(in srgb, var(--atlas-blue) 4%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--atlas-blue) 4%, transparent) 1px, transparent 1px);
  background-size: 56px 56px;
  content: "";
  inset: 0;
  mask-image: linear-gradient(to bottom, black, transparent 68%);
  opacity: 0.6;
  pointer-events: none;
  position: absolute;
}

.atlas-sidebar,
.atlas-context-rail {
  min-width: 0;
  position: relative;
  z-index: 1;
}

.atlas-main-column {
  min-width: 0;
  position: relative;
}

.atlas-sidebar {
  border-right: 1px solid var(--atlas-line);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 2rem 1.25rem 1.5rem;
  position: sticky;
  top: 0;
  height: 100vh;
  box-sizing: border-box;
}

.atlas-brand-lockup {
  padding: 0.25rem 0.65rem 2.5rem;
}

.atlas-brand {
  align-items: center;
  color: var(--atlas-ink);
  display: inline-flex;
  gap: 0.75rem;
  text-decoration: none;
}

.atlas-brand:hover {
  color: var(--atlas-ink);
}

.atlas-brand-mark {
  display: inline-block;
  height: 2.25rem;
  position: relative;
  transform: rotate(-18deg);
  width: 2.25rem;
}

.atlas-brand-mark i {
  border: 2px solid var(--atlas-blue);
  border-radius: 50%;
  display: block;
  height: 1.15rem;
  left: 0.52rem;
  position: absolute;
  top: 0.52rem;
  width: 1.15rem;
}

.atlas-brand-mark i:nth-child(2) { border-color: var(--atlas-blue-bright); transform: translate(0.42rem, -0.42rem) scale(0.72); }
.atlas-brand-mark i:nth-child(3) { border-color: var(--atlas-blue-soft); transform: translate(-0.42rem, 0.42rem) scale(0.72); }
.atlas-brand-mark i:nth-child(4) { border-color: color-mix(in srgb, var(--atlas-blue) 42%, var(--atlas-ink)); transform: translate(0.42rem, 0.42rem) scale(0.72); }

.atlas-brand-copy {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.atlas-brand-copy strong {
  font-family: var(--headerFont);
  font-size: 0.88rem;
  letter-spacing: 0.16em;
}

.atlas-brand-copy span {
  color: var(--atlas-blue);
  font-family: var(--codeFont);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.27em;
  margin-top: 0.35rem;
}

.atlas-brand-caption {
  color: var(--atlas-muted);
  display: block;
  font-family: var(--codeFont);
  font-size: 0.56rem;
  letter-spacing: 0.08em;
  margin: 0.8rem 0 0 3.05rem;
  text-transform: uppercase;
}

.atlas-nav-kicker {
  color: var(--atlas-muted);
  font-family: var(--codeFont);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  margin: 0;
  text-transform: uppercase;
}

.atlas-primary-nav {
  display: grid;
  gap: 0.28rem;
}

.atlas-primary-nav .atlas-nav-kicker {
  margin: 0 0 0.65rem 0.75rem;
}

.atlas-nav-link,
.atlas-sidebar-utility {
  align-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 14px;
  color: var(--atlas-copy);
  display: flex;
  font: inherit;
  gap: 0.8rem;
  min-height: 2.75rem;
  padding: 0.55rem 0.75rem;
  text-decoration: none;
  transition: background 220ms ease, border-color 220ms ease, color 220ms ease, transform 220ms ease;
}

.atlas-nav-link:hover,
.atlas-nav-link:focus-visible,
.atlas-sidebar-utility:hover,
.atlas-sidebar-utility:focus-visible {
  background: color-mix(in srgb, var(--atlas-blue) 8%, transparent);
  border-color: var(--atlas-line-strong);
  color: var(--atlas-ink);
  transform: translateX(2px);
}

.atlas-nav-link.is-active {
  background: color-mix(in srgb, var(--atlas-blue) 12%, transparent);
  border-color: color-mix(in srgb, var(--atlas-blue) 32%, transparent);
  color: var(--atlas-ink);
  box-shadow: inset 0 1px color-mix(in srgb, white 16%, transparent), 0 8px 22px var(--atlas-glow);
}

.atlas-nav-icon,
.atlas-utility-icon {
  align-items: center;
  color: var(--atlas-blue);
  display: inline-flex;
  font-size: 1.05rem;
  height: 1.25rem;
  justify-content: center;
  width: 1.25rem;
}

.atlas-sidebar-section {
  border-top: 1px solid var(--atlas-line);
  margin-top: 2.25rem;
  padding: 1.5rem 0.1rem 0;
}

.atlas-sidebar-section-heading {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 0 0.65rem 0.7rem;
}

.atlas-sidebar-section-action {
  background: transparent;
  border: 0;
  color: var(--atlas-muted);
  cursor: pointer;
  font: inherit;
  font-size: 1.1rem;
  line-height: 1;
  min-height: 2rem;
  min-width: 2rem;
}

.atlas-sidebar-explorer-content {
  min-height: 0;
  overflow: hidden;
  transition: max-height 360ms cubic-bezier(.22, 1, .36, 1), opacity 240ms ease;
}

.atlas-sidebar-explorer.is-collapsed .atlas-sidebar-explorer-content {
  max-height: 0;
  opacity: 0;
}

.atlas-sidebar-explorer .explorer {
  background: transparent;
  border: 0;
  box-shadow: none;
  margin: 0;
  padding: 0;
}

.atlas-sidebar-explorer .explorer .desktop-explorer {
  display: none;
}

.atlas-sidebar-explorer .explorer-content {
  max-height: calc(100vh - 24rem);
  overflow-y: auto;
  padding: 0 0.35rem;
  scrollbar-color: var(--atlas-line-strong) transparent;
}

.atlas-sidebar-explorer .explorer-content ul {
  margin: 0;
  padding: 0;
}

.atlas-sidebar-explorer .explorer-content li {
  list-style: none;
}

.atlas-sidebar-explorer .explorer-content a,
.atlas-sidebar-explorer .explorer-content .folder-title {
  border-radius: 9px;
  color: var(--atlas-copy);
  display: block;
  font-size: 0.78rem;
  line-height: 1.35;
  margin: 0.08rem 0;
  padding: 0.34rem 0.5rem;
  text-decoration: none;
  transition: background 180ms ease, color 180ms ease;
}

.atlas-sidebar-explorer .explorer-content a:hover,
.atlas-sidebar-explorer .explorer-content a:focus-visible,
.atlas-sidebar-explorer .explorer-content .folder-title:hover {
  background: color-mix(in srgb, var(--atlas-blue) 9%, transparent);
  color: var(--atlas-ink);
}

.atlas-sidebar-bottom {
  border-top: 1px solid var(--atlas-line);
  margin-top: auto;
  padding: 1rem 0.1rem 0;
}

.atlas-sidebar-utility {
  border: 0;
  cursor: pointer;
  width: 100%;
}

.atlas-sidebar-bottom p {
  color: var(--atlas-muted);
  font-size: 0.68rem;
  line-height: 1.4;
  margin: 0.9rem 0.75rem 0;
}

.atlas-main-column {
  min-width: 0;
}

.atlas-topbar {
  align-items: center;
  backdrop-filter: blur(22px);
  background: color-mix(in srgb, var(--atlas-bg) 80%, transparent);
  border-bottom: 1px solid var(--atlas-line);
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  min-height: 4.9rem;
  padding: 0.8rem clamp(1.25rem, 4vw, 4.2rem);
  position: sticky;
  top: 0;
  z-index: 20;
}

.atlas-topbar-leading,
.atlas-topbar-actions {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  min-width: 0;
}

.atlas-topbar-context {
  align-items: center;
  color: var(--atlas-muted);
  display: inline-flex;
  font-family: var(--codeFont);
  font-size: 0.67rem;
  gap: 0.5rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

.atlas-live-dot {
  background: var(--atlas-blue-bright);
  border-radius: 50%;
  box-shadow: 0 0 0 4px var(--atlas-glow), 0 0 16px var(--atlas-blue-bright);
  display: inline-block;
  height: 0.42rem;
  width: 0.42rem;
}

.atlas-topbar-actions {
  justify-content: flex-end;
}

.atlas-search-launch {
  align-items: center;
  background: color-mix(in srgb, var(--atlas-surface-strong) 56%, transparent);
  border: 1px solid var(--atlas-line);
  border-radius: 999px;
  color: var(--atlas-muted);
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 0.75rem;
  gap: 0.55rem;
  min-height: 2.55rem;
  padding: 0.35rem 0.55rem 0.35rem 0.8rem;
  transition: background 220ms ease, border-color 220ms ease, box-shadow 220ms ease, color 220ms ease;
}

.atlas-search-launch:hover,
.atlas-search-launch:focus-visible {
  background: color-mix(in srgb, var(--atlas-blue) 8%, var(--atlas-surface-strong));
  border-color: var(--atlas-line-strong);
  box-shadow: 0 10px 28px var(--atlas-glow);
  color: var(--atlas-ink);
}

.atlas-search-icon {
  color: var(--atlas-blue);
  font-size: 1.25rem;
  line-height: 1;
}

.atlas-search-launch kbd {
  background: color-mix(in srgb, var(--atlas-blue) 8%, transparent);
  border: 1px solid var(--atlas-line);
  border-radius: 6px;
  color: var(--atlas-muted);
  font-family: var(--codeFont);
  font-size: 0.57rem;
  padding: 0.25rem 0.35rem;
}

.atlas-theme-slot {
  align-items: center;
  display: flex;
  min-height: 2.75rem;
}

.atlas-topbar-icon {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 50%;
  color: var(--atlas-muted);
  cursor: pointer;
  font-size: 1.15rem;
  min-height: 2.75rem;
  min-width: 2.75rem;
  transition: background 220ms ease, border-color 220ms ease, color 220ms ease, transform 220ms ease;
}

.atlas-topbar-icon:hover,
.atlas-topbar-icon:focus-visible {
  background: color-mix(in srgb, var(--atlas-blue) 9%, transparent);
  border-color: var(--atlas-line-strong);
  color: var(--atlas-blue);
  transform: rotate(18deg);
}

.atlas-header-slots {
  display: none;
}

.atlas-mobile-menu {
  align-items: center;
  background: transparent;
  border: 1px solid var(--atlas-line);
  border-radius: 12px;
  color: var(--atlas-ink);
  cursor: pointer;
  display: none;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
  min-height: 2.75rem;
  min-width: 2.75rem;
  padding: 0.5rem;
}

.atlas-mobile-menu span {
  background: currentColor;
  display: block;
  height: 1px;
  transition: transform 220ms ease, opacity 220ms ease;
  width: 1rem;
}

.atlas-content-column {
  min-width: 0;
  padding: 0 clamp(1.25rem, 4vw, 4.2rem) 3rem;
}

.atlas-before-body {
  margin: 0 auto;
  max-width: 78rem;
}

.atlas-before-body .breadcrumb-container {
  margin: 1.5rem 0 0;
}

.atlas-before-body .breadcrumb-element {
  color: var(--atlas-muted);
  font-size: 0.72rem;
}

.atlas-before-body .breadcrumb-element a {
  background: transparent;
  color: var(--atlas-muted);
  padding: 0;
}

.atlas-before-body .article-title {
  color: var(--atlas-ink);
  font-size: clamp(2rem, 4vw, 4rem);
  line-height: 1.03;
  margin: 2.5rem 0 0.6rem;
  max-width: 16ch;
}

.atlas-before-body .content-meta {
  color: var(--atlas-muted);
  font-size: 0.75rem;
}

.atlas-content-column > article {
  margin: 0 auto;
  max-width: 78rem;
  min-width: 0;
}

.atlas-content-column > article > .markdown-preview-view {
  min-width: 0;
}

.atlas-content-column > article:not(:has(#atlas-home-dashboard)):not(:has(#atlas-view)) {
  max-width: 78ch;
}

.atlas-content-column > article h2,
.atlas-content-column > article h3,
.atlas-content-column > article h4 {
  color: var(--atlas-ink);
}

.atlas-content-column > article p,
.atlas-content-column > article li {
  color: var(--atlas-copy);
}

.atlas-content-column > article a.internal {
  background: color-mix(in srgb, var(--atlas-blue) 10%, transparent);
  color: var(--atlas-blue);
}

.atlas-content-column > article a.internal:hover {
  background: color-mix(in srgb, var(--atlas-blue-bright) 16%, transparent);
  color: var(--atlas-blue-bright);
}

.atlas-after-body {
  margin: 2rem auto 0;
  max-width: 78rem;
}

.atlas-frame-footer {
  margin: 3rem auto 0;
  max-width: 78rem;
}

.atlas-context-rail {
  border-left: 1px solid var(--atlas-line);
  min-height: 100vh;
}

.atlas-rail-inner {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 6.25rem 1.25rem 2rem;
  position: sticky;
  top: 0;
}

.atlas-sidebar-backdrop {
  display: none;
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

@media all and (max-width: 1280px) {
  .atlas-frame {
    grid-template-columns: 238px minmax(0, 1fr) 292px;
  }

  .atlas-sidebar {
    padding-inline: 0.85rem;
  }

  .atlas-brand-caption {
    margin-left: 2.85rem;
  }
}

@media all and (max-width: 1080px) {
  .atlas-frame {
    grid-template-columns: 238px minmax(0, 1fr);
  }

  .atlas-context-rail {
    border-left: 0;
    grid-column: 2;
    min-height: 0;
  }

  .atlas-rail-inner {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 0 clamp(1.25rem, 4vw, 4.2rem) 2rem;
    position: static;
  }
}

@media all and (max-width: 800px) {
  .atlas-frame {
    display: block;
  }

  .atlas-sidebar {
    background: var(--atlas-bg);
    box-shadow: var(--atlas-shadow-deep);
    left: 0;
    max-width: min(18rem, 86vw);
    padding: 1.35rem 1rem 1.25rem;
    position: fixed;
    top: 0;
    transform: translateX(-104%);
    transition: transform 360ms cubic-bezier(.22, 1, .36, 1);
    width: min(18rem, 86vw);
    z-index: 100;
  }

  body.atlas-sidebar-open .atlas-sidebar {
    transform: translateX(0);
  }

  .atlas-sidebar-backdrop {
    background: rgba(1, 2, 6, 0.42);
    border: 0;
    display: block;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    position: fixed;
    transition: opacity 300ms ease;
    z-index: 90;
  }

  body.atlas-sidebar-open .atlas-sidebar-backdrop {
    opacity: 1;
    pointer-events: auto;
  }

  .atlas-mobile-menu {
    display: inline-flex;
  }

  .atlas-topbar {
    min-height: 4.35rem;
    padding-inline: 1rem;
  }

  .atlas-topbar-context {
    font-size: 0.58rem;
  }

  .atlas-search-launch {
    min-width: 2.75rem;
    padding: 0;
  }

  .atlas-search-launch span:not(.atlas-search-icon),
  .atlas-search-launch kbd {
    display: none;
  }

  .atlas-topbar-icon {
    display: none;
  }

  .atlas-content-column {
    padding-inline: 1rem;
  }

  .atlas-rail-inner {
    display: block;
    padding: 0 1rem 1rem;
  }

  .atlas-rail-inner > * {
    margin-top: 1rem;
  }
}

@media all and (max-width: 520px) {
  .atlas-theme-slot {
    /* Keep the official control at full size so its touch target remains generous. */
    transform: none;
  }

  .atlas-brand-lockup {
    padding-bottom: 1.8rem;
  }
}

@media all and (min-width: 901px) {
  .atlas-frame:has(#atlas-home-dashboard),
  .atlas-frame:has(#atlas-view[data-view="graph"]) {
    grid-template-columns: minmax(15rem, 17rem) minmax(0, 1fr);
  }
}

/* Keep Stacked Pages available as a spatial history rail without letting it
   compete with the Atlas shell for the full height of the viewport. */
body.has-binder-left .page[data-frame="atlas"] {
  box-sizing: border-box;
  padding-left: 24px;
}

body.has-binder-right .page[data-frame="atlas"] {
  box-sizing: border-box;
  padding-right: 24px;
}

#stacked-pages-container.binder-active .binder-strip {
  align-items: stretch;
  box-sizing: border-box;
  gap: .35rem;
  height: auto;
  margin-top: 5.5rem;
  max-height: calc(100vh - 7rem);
  overflow-y: auto;
  scrollbar-width: none;
  width: 24px;
}

#stacked-pages-container.binder-active .binder-strip::-webkit-scrollbar {
  display: none;
}

#stacked-pages-container.binder-active .binder-tab {
  background: color-mix(in srgb, var(--atlas-surface-strong) 78%, transparent);
  border-color: var(--atlas-line);
  box-sizing: border-box;
  border-radius: 0 8px 8px 0;
  flex: 0 0 5.4rem;
  height: 5.4rem;
  padding: .35rem 0;
  width: 24px;
}

#stacked-pages-container.binder-active .binder-tab:not(.binder-tab-active):hover {
  background: color-mix(in srgb, var(--atlas-blue) 10%, var(--atlas-surface-strong));
  transform: translateX(3px);
}

#stacked-pages-container.binder-active .binder-tab.binder-tab-active {
  background: color-mix(in srgb, var(--atlas-blue) 12%, var(--atlas-surface-strong));
  border-left: 1px solid var(--atlas-line);
  border-right: 2px solid var(--atlas-blue);
  border-radius: 0 8px 8px 0;
}

#stacked-pages-container.binder-active .binder-label {
  color: var(--atlas-muted);
  font-family: var(--codeFont);
  font-size: .55rem;
  letter-spacing: .04em;
  max-width: 20px;
}

#stacked-pages-container.binder-active .binder-tab-active .binder-label {
  color: var(--atlas-ink);
}

#stacked-pages-container.binder-active .binder-close {
  color: var(--atlas-muted);
  font-size: .75rem;
}
`,
}
