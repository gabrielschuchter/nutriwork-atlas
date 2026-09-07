import { Fragment, h } from "preact"
import { resolveRelative } from "@quartz-community/utils/path"
import { createAccessRuntime } from "../access-runtime.js"

const DEFAULT_PASSWORD_HASH = "e110ff65ef4db64218871ca059810de0cbca7873b38b3ff576a55adbfe6d0f34"
const DEFAULT_STORAGE_KEY = "nutriwork-atlas-access"
const PUBLIC_SLUGS = new Set(["roadmap", "privacidade", "termos", "seguranca", "acessibilidade"])
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

function withQuery(href, key, value) {
  const separator = String(href).includes("?") ? "&" : "?"
  return `${href}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`
}

function logoPath(fileData) {
  return "/static/atlas-symbol.png"
}

export const AtlasAccess = (userOptions = {}) => {
  const options = {
    passwordHash: userOptions.passwordHash || DEFAULT_PASSWORD_HASH,
    storageKey: userOptions.storageKey || DEFAULT_STORAGE_KEY,
  }

  const AtlasAccessComponent = ({ fileData }) => {
    if (PUBLIC_SLUGS.has(String(fileData?.slug || ""))) return null
    return h(
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
        h("h1", { id: "atlas-access-title" }, "Acesse o Atlas"),
        h(
          "form",
          { id: "atlas-identification-form", class: "atlas-access-form", novalidate: true },
          h("label", { for: "atlas-identification-email" }, "E-mail do Nutriwork Plus"),
          h("input", {
            id: "atlas-identification-email",
            name: "email",
            type: "email",
            autocomplete: "email",
            inputmode: "email",
            autocapitalize: "none",
            spellcheck: false,
            maxlength: 254,
            required: true,
            "aria-describedby": "atlas-identification-status",
          }),
          h(
            "button",
            { id: "atlas-identification-submit", type: "submit", class: "atlas-access-submit" },
            "Continuar",
          ),
          h("p", {
            id: "atlas-identification-status",
            class: "atlas-access-status",
            role: "status",
            "aria-live": "polite",
            hidden: true,
          }),
        ),
        h(
          "form",
          { id: "atlas-access-form", class: "atlas-access-form", novalidate: true, hidden: true },
          h(
            "div",
            { class: "atlas-identity-summary" },
            h("p", {
              id: "atlas-identification-email-display",
              class: "atlas-identification-email-display",
            }),
            h(
              "button",
              {
                id: "atlas-identification-change",
                type: "button",
                class: "atlas-identification-change",
              },
              "Trocar e-mail",
            ),
          ),
          h("label", { for: "atlas-access-password" }, "Senha global do Atlas"),
          h(
            "p",
            { id: "atlas-global-password-hint", class: "atlas-password-hint" },
            "Use a senha global — não a senha do seu e-mail.",
          ),
          h(
            "div",
            { class: "atlas-password-field" },
            h("input", {
              id: "atlas-access-password",
              name: "password",
              type: "password",
              autocomplete: "off",
              required: true,
              inputmode: "text",
              "aria-describedby": "atlas-global-password-hint atlas-access-status",
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
          h(
            "button",
            { id: "atlas-access-submit", type: "submit", class: "atlas-access-submit" },
            "Entrar no Atlas",
          ),
          h("p", {
            id: "atlas-access-status",
            class: "atlas-access-status",
            role: "status",
            "aria-live": "polite",
            hidden: true,
          }),
          h(
            "button",
            {
              id: "atlas-identification-retry",
              type: "button",
              class: "atlas-access-submit",
              hidden: true,
            },
            "Tentar novamente",
          ),
        ),
        h(
          "p",
          { class: "atlas-legal-consent" },
          "Ao continuar, você concorda com os ",
          h(
            "a",
            {
              href: withQuery(
                resolveRelative(String(fileData?.slug || "index"), "termos"),
                "atlasReturn",
                "login",
              ),
              "data-router-ignore": "",
            },
            "Termos",
          ),
          " e a ",
          h(
            "a",
            {
              href: withQuery(
                resolveRelative(String(fileData?.slug || "index"), "privacidade"),
                "atlasReturn",
                "login",
              ),
              "data-router-ignore": "",
            },
            "Política de Privacidade",
          ),
          ".",
        ),
      ),
    )
  }

  AtlasAccessComponent.css = `
html[data-atlas-access="locked"] .atlas-frame {
  visibility: hidden;
}

#atlas-access {
  align-items: flex-start;
  background: rgba(1, 2, 6, .86);
  box-sizing: border-box;
  bottom: auto;
  display: flex;
  height: var(--atlas-visual-height, 100dvh);
  justify-content: center;
  left: var(--atlas-viewport-offset-left, 0px);
  padding: max(1rem, env(safe-area-inset-top, 0px)) max(1rem, env(safe-area-inset-right, 0px)) max(1rem, env(safe-area-inset-bottom, 0px)) max(1rem, env(safe-area-inset-left, 0px));
  position: fixed;
  overflow-y: auto;
  right: auto;
  top: var(--atlas-viewport-offset-top, 0px);
  width: var(--atlas-visual-width, 100vw);
  touch-action: manipulation;
  visibility: visible;
  z-index: 10000;
  backdrop-filter: blur(12px);
}

html[data-atlas-access="unlocked"] #atlas-access {
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}

.atlas-access-card {
  box-sizing: border-box;
  min-height: 0;
  margin-block: auto;
  background: rgba(7, 16, 35, .86);
  border: 1px solid rgba(142, 185, 255, .2);
  border-radius: 26px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, .38);
  color: #F5F7FF;
  max-width: 26rem;
  padding: clamp(1.25rem, 5vw, 2rem);
  width: min(100%, 26rem);
}

.atlas-access-logo {
  display: block;
  flex-shrink: 0;
  filter: invert(1) grayscale(1) brightness(1.55);
  height: 3.5rem;
  margin-bottom: .9rem;
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
  margin: 0 0 .55rem;
}

.atlas-access-card h1 {
  font-size: clamp(1.8rem, 7vw, 2.7rem);
  letter-spacing: -.045em;
  line-height: 1.04;
  margin: 0;
}

:root[data-theme="light"] .atlas-access-card {
  background: rgba(255, 255, 255, .92);
  border-color: rgba(12, 45, 87, .14);
  box-shadow: 0 24px 80px rgba(12, 45, 87, .16);
  color: #142033;
}

:root[data-theme="light"] .atlas-access-logo {
  filter: none;
}

:root[data-theme="light"] .atlas-access-kicker {
  color: #1E5FAF;
}

:root[data-theme="light"] .atlas-access-form label {
  color: #142033;
}

:root[data-theme="light"] .atlas-access-form input {
  background: rgba(246, 248, 251, .86);
  border-color: rgba(12, 45, 87, .18);
  color: #142033;
}

:root[data-theme="light"] .atlas-password-toggle {
  color: #526277;
}

.atlas-access-form {
  display: grid;
  gap: .6rem;
  margin-top: 1.05rem;
}

.atlas-legal-consent {
  color: rgba(200, 210, 229, .66);
  font-size: .68rem;
  line-height: 1.45;
  margin: .7rem 0 0;
  text-align: center;
}

.atlas-legal-consent a {
  color: inherit;
  text-underline-offset: .15em;
}

:root[data-theme="light"] .atlas-legal-consent {
  color: rgba(82, 98, 119, .76);
}

.atlas-access-form[hidden],
.atlas-access-form button[hidden] {
  display: none;
}

.atlas-identification-change,
.atlas-password-hint,
.atlas-identification-email-display {
  color: #C8D2E5;
  font-size: .76rem;
  line-height: 1.5;
}

.atlas-identity-summary {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: .15rem .7rem;
  margin: 0 0 .05rem;
}

.atlas-identification-email-display {
  font-size: .86rem;
  font-weight: 600;
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}

.atlas-password-hint {
  margin: -.2rem 0 .05rem;
}

.atlas-identification-change {
  background: transparent;
  border: 0;
  cursor: pointer;
  font-family: inherit;
  min-height: 2rem;
  padding: .2rem 0;
  text-decoration: underline;
}

#atlas-identification-email {
  font-size: 1rem;
  padding-right: .85rem;
}

.atlas-access-submit:disabled {
  cursor: wait;
  opacity: .65;
  transform: none;
}

:root[data-theme="light"] .atlas-identification-change,
:root[data-theme="light"] .atlas-password-hint,
:root[data-theme="light"] .atlas-identification-email-display {
  color: #526277;
}

:root[data-theme="light"] .atlas-access-status {
  color: #1E5FAF;
}

:root[data-theme="light"] .atlas-access-status[data-state="error"] {
  color: #A12B25;
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

.atlas-access-form input,
.atlas-access-form button {
  touch-action: manipulation;
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
  margin: .1rem 0 0;
}

.atlas-access-status[hidden] {
  display: none;
}

.atlas-access-status[data-state="error"] {
  color: #FFB4AB;
}

@media all and (max-height: 520px) and (min-width: 480px) {
  #atlas-access {
    align-items: center;
    padding-block: .75rem;
  }

  .atlas-access-card {
    display: grid;
    column-gap: 1rem;
    grid-template-columns: minmax(11rem, 1fr) minmax(0, 1.5fr);
    max-width: 34rem;
    padding: 1rem 1.25rem;
    width: min(100%, 34rem);
  }

  .atlas-access-logo {
    grid-column: 1;
    height: 2.75rem;
    margin: 0 0 .45rem;
    width: 2.75rem;
  }

  .atlas-access-kicker {
    align-self: start;
    grid-column: 1;
    margin: 0;
  }

  .atlas-access-card h1 {
    align-self: start;
    font-size: clamp(1.5rem, 4vw, 2rem);
    grid-column: 1;
    line-height: 1;
    margin: .4rem 0 0;
  }

  .atlas-access-form {
    align-self: center;
    grid-column: 2;
    grid-row: 1 / span 3;
    gap: .4rem;
    margin: 0;
  }

  .atlas-legal-consent {
    grid-column: 1 / -1;
    margin-top: .55rem;
  }
}

@media all and (max-height: 520px) and (max-width: 479px) {
  #atlas-access {
    padding-block: .75rem;
  }

  .atlas-access-card {
    padding: 1rem;
  }

  .atlas-access-logo {
    height: 2.75rem;
    margin-bottom: .65rem;
    width: 2.75rem;
  }

  .atlas-access-form {
    gap: .45rem;
    margin-top: .75rem;
  }

  .atlas-legal-consent {
    margin-top: .5rem;
  }
}

#atlas-preview {
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  backdrop-filter: blur(18px) saturate(140%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .075), transparent 46%), var(--atlas-glass, rgba(7, 16, 35, .4));
  border: 1px solid var(--atlas-glass-line, rgba(220, 235, 255, .16));
  border-radius: 18px;
  box-shadow: var(--atlas-glass-shadow, 0 20px 50px rgba(0, 0, 0, .3));
  color: #F5F7FF;
  max-width: calc(var(--atlas-visual-width, 100vw) - 2rem);
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
  box-sizing: border-box;
  display: flex;
  top: var(--atlas-viewport-offset-top, 0px);
  bottom: auto;
  height: var(--atlas-visual-height, 100dvh);
  left: var(--atlas-viewport-offset-left, 0px);
  width: var(--atlas-visual-width, 100vw);
  justify-content: center;
  opacity: 0;
  max-height: var(--atlas-visual-height, 100dvh);
  padding: max(1rem, calc(var(--atlas-safe-top, env(safe-area-inset-top, 0px)) + .75rem)) max(1rem, calc(var(--atlas-safe-right, env(safe-area-inset-right, 0px)) + .75rem)) max(1rem, calc(var(--atlas-safe-bottom, env(safe-area-inset-bottom, 0px)) + .75rem)) max(1rem, calc(var(--atlas-safe-left, env(safe-area-inset-left, 0px)) + .75rem));
  pointer-events: none;
  position: fixed;
  right: auto;
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
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  backdrop-filter: blur(20px) saturate(140%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .075), transparent 46%), var(--atlas-glass-strong, rgba(7, 16, 35, .58));
  border: 1px solid var(--atlas-glass-line, rgba(220, 235, 255, .16));
  box-sizing: border-box;
  border-radius: 24px;
  box-shadow: var(--atlas-glass-shadow, 0 24px 90px rgba(0, 0, 0, .36));
  color: #F5F7FF;
  max-width: 34rem;
  max-height: calc(var(--atlas-visual-height, 100dvh) - max(1rem, calc(var(--atlas-safe-top, env(safe-area-inset-top, 0px)) + .75rem)) - max(1rem, calc(var(--atlas-safe-bottom, env(safe-area-inset-bottom, 0px)) + .75rem)));
  overflow: auto;
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
  min-height: 2.75rem;
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
  box-sizing: border-box;
  display: flex;
  top: var(--atlas-viewport-offset-top, 0px);
  width: var(--atlas-visual-width, 100vw);
  bottom: auto;
  height: var(--atlas-visual-height, 100dvh);
  left: var(--atlas-viewport-offset-left, 0px);
  justify-content: center;
  opacity: 0;
  max-height: var(--atlas-visual-height, 100dvh);
  padding: max(1rem, calc(var(--atlas-safe-top, env(safe-area-inset-top, 0px)) + .75rem)) max(1rem, calc(var(--atlas-safe-right, env(safe-area-inset-right, 0px)) + .75rem)) max(1rem, calc(var(--atlas-safe-bottom, env(safe-area-inset-bottom, 0px)) + .75rem)) max(1rem, calc(var(--atlas-safe-left, env(safe-area-inset-left, 0px)) + .75rem));
  pointer-events: none;
  position: fixed;
  right: auto;
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
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  backdrop-filter: blur(20px) saturate(140%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .1), transparent 48%), var(--atlas-glass-strong, rgba(7, 16, 35, .62));
  border: 1px solid var(--atlas-glass-line, rgba(220, 235, 255, .17));
  box-sizing: border-box;
  border-radius: 22px;
  box-shadow: var(--atlas-glass-shadow, 0 24px 90px rgba(0, 0, 0, .36));
  color: #F5F7FF;
  max-width: 27rem;
  max-height: calc(var(--atlas-visual-height, 100dvh) - max(1rem, calc(var(--atlas-safe-top, env(safe-area-inset-top, 0px)) + .75rem)) - max(1rem, calc(var(--atlas-safe-bottom, env(safe-area-inset-bottom, 0px)) + .75rem)));
  overflow: auto;
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
  height: 2.75rem;
  justify-content: center;
  line-height: 1;
  min-height: 2.75rem;
  min-width: 2.75rem;
  width: 2.75rem;
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

#atlas-report {
  align-items: center;
  box-sizing: border-box;
  display: flex;
  top: var(--atlas-viewport-offset-top, 0px);
  width: var(--atlas-visual-width, 100vw);
  bottom: auto;
  height: var(--atlas-visual-height, 100dvh);
  left: var(--atlas-viewport-offset-left, 0px);
  justify-content: center;
  opacity: 0;
  max-height: var(--atlas-visual-height, 100dvh);
  padding: max(1rem, calc(var(--atlas-safe-top, env(safe-area-inset-top, 0px)) + .75rem)) max(1rem, calc(var(--atlas-safe-right, env(safe-area-inset-right, 0px)) + .75rem)) max(1rem, calc(var(--atlas-safe-bottom, env(safe-area-inset-bottom, 0px)) + .75rem)) max(1rem, calc(var(--atlas-safe-left, env(safe-area-inset-left, 0px)) + .75rem));
  pointer-events: none;
  position: fixed;
  right: auto;
  transition: opacity 220ms ease;
  z-index: 8200;
}

#atlas-report.is-open {
  opacity: 1;
  pointer-events: auto;
}

#atlas-report[hidden] {
  display: none;
}

.atlas-report-backdrop {
  background: rgba(1, 2, 6, .62);
  border: 0;
  cursor: default;
  inset: 0;
  padding: 0;
  position: absolute;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.atlas-report-card {
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  backdrop-filter: blur(20px) saturate(140%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .1), transparent 48%), var(--atlas-glass-strong, rgba(7, 16, 35, .62));
  border: 1px solid var(--atlas-glass-line, rgba(220, 235, 255, .17));
  border-radius: 22px;
  box-sizing: border-box;
  box-shadow: var(--atlas-glass-shadow, 0 24px 90px rgba(0, 0, 0, .36));
  color: #F5F7FF;
  max-height: calc(var(--atlas-visual-height, 100dvh) - max(1rem, calc(var(--atlas-safe-top, env(safe-area-inset-top, 0px)) + .75rem)) - max(1rem, calc(var(--atlas-safe-bottom, env(safe-area-inset-bottom, 0px)) + .75rem)));
  max-width: 25rem;
  overflow: auto;
  padding: 1.25rem 1.35rem 1.35rem;
  position: relative;
  transform: translateY(8px) scale(.975);
  transition: transform 300ms cubic-bezier(.22, .8, .2, 1);
  width: min(100%, 25rem);
}

#atlas-report.is-open .atlas-report-card {
  transform: none;
}

.atlas-report-header {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: .9rem;
}

.atlas-report-kicker {
  color: #8EB9FF;
  font-family: var(--codeFont);
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .14em;
  margin: 0;
}

.atlas-report-close {
  align-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  color: #C8D2E5;
  cursor: pointer;
  display: inline-flex;
  font-size: 1.2rem;
  height: 2.75rem;
  justify-content: center;
  line-height: 1;
  min-height: 2.75rem;
  min-width: 2.75rem;
  width: 2.75rem;
}

.atlas-report-close:hover,
.atlas-report-close:focus-visible {
  background: rgba(255, 255, 255, .08);
  border-color: var(--atlas-glass-line, rgba(220, 235, 255, .17));
  color: #F5F7FF;
}

.atlas-report-card h2 {
  color: var(--atlas-ink, #F5F7FF);
  font-size: clamp(1.35rem, 4vw, 1.7rem);
  letter-spacing: -.035em;
  line-height: 1.12;
  margin: 0 0 .5rem;
}

.atlas-report-copy {
  color: #C8D2E5;
  font-size: .9rem;
  line-height: 1.5;
  margin: 0;
}

.atlas-report-copy strong {
  color: #F5F7FF;
  font-weight: 700;
}

.atlas-report-link {
  align-items: center;
  background: #1263FF;
  border: 1px solid #1263FF;
  border-radius: 999px;
  box-sizing: border-box;
  color: white;
  display: inline-flex;
  font-size: .84rem;
  font-weight: 700;
  justify-content: center;
  margin-top: 1.15rem;
  min-height: 2.6rem;
  max-width: 100%;
  padding: .62rem 1rem;
  text-align: center;
  text-decoration: none;
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
  width: auto;
}

.atlas-report-link:hover,
.atlas-report-link:focus-visible {
  background: #29A8FF;
  border-color: #29A8FF;
  transform: translateY(-1px);
}

:root[data-theme="light"] .atlas-report-card {
  color: #07152A;
}

:root[data-theme="light"] .atlas-report-kicker {
  color: #1263FF;
}

:root[data-theme="light"] .atlas-report-close {
  color: #526277;
}

:root[data-theme="light"] .atlas-report-copy {
  color: #526277;
}

:root[data-theme="light"] .atlas-report-copy strong {
  color: #07152A;
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

.atlas-touch-hint {
  align-items: center;
  -webkit-backdrop-filter: blur(18px) saturate(145%);
  backdrop-filter: blur(18px) saturate(145%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .1), transparent 48%), var(--atlas-glass, rgba(7, 16, 35, .5));
  border: 1px solid var(--atlas-glass-line, rgba(220, 235, 255, .16));
  border-radius: 999px;
  bottom: calc(100vh - var(--atlas-viewport-offset-top, 0px) - var(--atlas-visual-height, 100vh) + 4.8rem + var(--atlas-safe-bottom, env(safe-area-inset-bottom, 0px)));
  box-shadow: var(--atlas-glass-shadow, 0 18px 48px rgba(0, 0, 0, .28));
  color: var(--atlas-ink, #F5F7FF);
  display: flex;
  font-size: .76rem;
  gap: .5rem;
  left: calc(var(--atlas-viewport-offset-left, 0px) + var(--atlas-visual-width, 100vw) / 2);
  opacity: 0;
  padding: .62rem .85rem;
  pointer-events: none;
  position: fixed;
  transform: translate(-50%, 8px);
  transition: opacity 180ms ease, transform 220ms ease, visibility 180ms ease;
  visibility: hidden;
  white-space: nowrap;
  z-index: 7600;
}

.atlas-touch-hint.is-visible {
  opacity: 1;
  transform: translate(-50%, 0);
  visibility: visible;
}

.atlas-touch-hint[hidden] {
  display: none;
}

.atlas-touch-hint-separator {
  color: var(--atlas-brand-sky, #7DB5E4);
}

.atlas-mobile-sheet {
  align-items: flex-end;
  box-sizing: border-box;
  display: flex;
  height: var(--atlas-visual-height, 100dvh);
  left: var(--atlas-viewport-offset-left, 0px);
  width: var(--atlas-visual-width, 100vw);
  bottom: auto;
  justify-content: center;
  opacity: 0;
  padding: max(.75rem, calc(var(--atlas-safe-top, env(safe-area-inset-top, 0px)) + .5rem)) max(.75rem, calc(var(--atlas-safe-right, env(safe-area-inset-right, 0px)) + .5rem)) max(.75rem, calc(var(--atlas-safe-bottom, env(safe-area-inset-bottom, 0px)) + .5rem)) max(.75rem, calc(var(--atlas-safe-left, env(safe-area-inset-left, 0px)) + .5rem));
  pointer-events: none;
  position: fixed;
  top: var(--atlas-viewport-offset-top, 0px);
  bottom: auto;
  right: auto;
  visibility: hidden;
  z-index: 9200;
  transition: opacity 180ms ease, visibility 180ms ease;
}

.atlas-mobile-sheet.is-open {
  opacity: 1;
  pointer-events: auto;
  visibility: visible;
}

.atlas-mobile-sheet[hidden] {
  display: none !important;
}

.atlas-mobile-sheet-backdrop {
  background: rgba(1, 2, 6, .62);
  border: 0;
  inset: 0;
  padding: 0;
  position: absolute;
  touch-action: none;
}

.atlas-mobile-sheet-card {
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  backdrop-filter: blur(18px) saturate(140%);
  background: linear-gradient(145deg, rgba(255, 255, 255, .1), transparent 48%), var(--atlas-glass-strong, rgba(7, 16, 35, .8));
  border: 1px solid var(--atlas-glass-line, rgba(220, 235, 255, .18));
  border-radius: 26px 26px 20px 20px;
  box-shadow: var(--atlas-glass-shadow, 0 24px 90px rgba(0, 0, 0, .36));
  box-sizing: border-box;
  color: var(--atlas-ink, #F5F7FF);
  display: flex;
  flex-direction: column;
  max-height: calc(var(--atlas-visual-height, 100dvh) - max(.75rem, calc(var(--atlas-safe-top, env(safe-area-inset-top, 0px)) + .5rem)) - max(.75rem, calc(var(--atlas-safe-bottom, env(safe-area-inset-bottom, 0px)) + .5rem)));
  min-height: 0;
  overflow: hidden;
  padding: 1.15rem 1rem max(1rem, var(--atlas-safe-bottom, env(safe-area-inset-bottom, 0px)));
  position: relative;
  transform: translateY(14px);
  transition: transform 240ms cubic-bezier(.22, .8, .2, 1);
  width: min(100%, 38rem);
}

.atlas-mobile-sheet button,
.atlas-mobile-sheet input {
  font: inherit;
}

.atlas-mobile-sheet.is-open .atlas-mobile-sheet-card {
  transform: none;
}

.atlas-mobile-menu .atlas-mobile-sheet-card {
  overflow-x: hidden;
  overflow-y: auto;
}

.atlas-mobile-sheet-header {
  align-items: flex-start;
  display: flex;
  flex: 0 0 auto;
  gap: 1rem;
  justify-content: space-between;
}

.atlas-mobile-sheet-kicker {
  color: var(--atlas-brand-sky, #7DB5E4);
  font-family: var(--codeFont, monospace);
  font-size: .66rem;
  font-weight: 700;
  letter-spacing: .12em;
  margin: 0 0 .42rem;
  text-transform: uppercase;
}

.atlas-mobile-sheet-header h2 {
  color: var(--atlas-ink, #F5F7FF);
  font-size: clamp(1.3rem, 5vw, 1.7rem);
  letter-spacing: -.035em;
  line-height: 1.1;
  margin: 0;
}

.atlas-mobile-sheet-close {
  align-items: center;
  background: rgba(255, 255, 255, .05);
  border: 1px solid var(--atlas-glass-line, rgba(220, 235, 255, .16));
  border-radius: 999px;
  color: var(--atlas-ink, #F5F7FF);
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 1.35rem;
  height: 2.75rem;
  justify-content: center;
  line-height: 1;
  min-height: 2.75rem;
  min-width: 2.75rem;
  padding: 0;
  touch-action: manipulation;
}

.atlas-mobile-sheet-close:active,
.atlas-mobile-sheet-close:focus-visible {
  background: color-mix(in srgb, var(--atlas-brand-sky, #7DB5E4) 18%, transparent);
  border-color: var(--atlas-brand-sky, #7DB5E4);
}

.atlas-mobile-search-form {
  align-items: center;
  background: rgba(1, 2, 6, .38);
  border: 1px solid var(--atlas-glass-line, rgba(220, 235, 255, .2));
  border-radius: 16px;
  display: flex;
  flex: 0 0 auto;
  gap: .6rem;
  margin-top: 1.15rem;
  min-height: 3.25rem;
  padding: 0 .9rem;
}

.atlas-mobile-search-icon {
  color: var(--atlas-brand-sky, #7DB5E4);
  font-size: 1.45rem;
  line-height: 1;
}

#atlas-mobile-search {
  background: transparent;
  border: 0;
  color: var(--atlas-ink, #F5F7FF);
  font-size: 16px;
  line-height: 1.4;
  min-height: 3.25rem;
  min-width: 0;
  outline: 0;
  padding: .5rem 0;
  width: 100%;
}

#atlas-mobile-search::placeholder {
  color: var(--atlas-muted, #94A3B8);
}

.atlas-mobile-sheet-status {
  color: var(--atlas-copy, #C8D2E5);
  flex: 0 0 auto;
  font-size: .78rem;
  line-height: 1.45;
  margin: .8rem .1rem .45rem;
}

.atlas-mobile-search-results,
.atlas-area-sheet-options {
  flex: 1 1 auto;
  list-style: none;
  margin: 0 -.35rem;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: .1rem .35rem .25rem;
  -webkit-overflow-scrolling: touch;
}

.atlas-mobile-menu-list {
  flex: 0 0 auto;
  list-style: none;
  margin: 0;
  min-height: 0;
  overflow: visible;
  padding: 0;
}

.atlas-mobile-search-result {
  align-items: flex-start;
  background: rgba(255, 255, 255, .045);
  border: 1px solid transparent;
  border-radius: 14px;
  color: var(--atlas-ink, #F5F7FF);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: .22rem;
  margin: .3rem 0;
  min-height: 3.8rem;
  padding: .72rem .8rem;
  text-align: left;
  touch-action: manipulation;
  width: 100%;
}

.atlas-mobile-search-result:active,
.atlas-mobile-search-result:focus-visible {
  background: color-mix(in srgb, var(--atlas-brand-sky, #7DB5E4) 18%, transparent);
  border-color: color-mix(in srgb, var(--atlas-brand-sky, #7DB5E4) 48%, transparent);
}

.atlas-mobile-search-result-title {
  font-size: .95rem;
  line-height: 1.25;
}

.atlas-mobile-search-result-meta,
.atlas-mobile-search-results-more {
  color: var(--atlas-muted, #94A3B8);
  font-size: .72rem;
  line-height: 1.4;
}

.atlas-mobile-search-results-more {
  margin: .85rem .25rem;
}

.atlas-area-sheet-options {
  display: grid;
  gap: .35rem;
}

.atlas-area-sheet-option,
.atlas-mobile-menu-list button,
.atlas-mobile-menu-list a {
  align-items: center;
  background: rgba(255, 255, 255, .045);
  border: 1px solid transparent;
  border-radius: 14px;
  color: var(--atlas-ink, #F5F7FF);
  cursor: pointer;
  display: flex;
  font-size: .92rem;
  justify-content: space-between;
  box-sizing: border-box;
  max-width: 100%;
  min-height: 3.5rem;
  min-width: 0;
  overflow: hidden;
  padding: .72rem .85rem;
  text-align: left;
  touch-action: manipulation;
  width: 100%;
}

.atlas-area-sheet-option[aria-selected="true"] {
  background: color-mix(in srgb, var(--atlas-brand-sky, #7DB5E4) 18%, transparent);
  border-color: color-mix(in srgb, var(--atlas-brand-sky, #7DB5E4) 52%, transparent);
  font-weight: 700;
}

.atlas-area-sheet-option[aria-selected="true"]::after {
  color: var(--atlas-brand-sky, #7DB5E4);
  content: "✓";
  font-size: 1.1rem;
}

.atlas-mobile-menu-list {
  display: grid;
  gap: .25rem;
  margin-top: .85rem;
}

.atlas-mobile-menu-list button,
.atlas-mobile-menu-list a {
  font-size: .9rem;
  gap: .65rem;
  line-height: 1.2;
  min-height: 2.9rem;
  padding: .48rem .72rem;
}

.atlas-mobile-menu-list button > span:first-child,
.atlas-mobile-menu-list a > span:first-child {
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
}

.atlas-mobile-menu-list a {
  text-decoration: none;
}

.atlas-mobile-menu-list button:active,
.atlas-mobile-menu-list button:focus-visible,
.atlas-mobile-menu-list a:active,
.atlas-mobile-menu-list a:focus-visible {
  background: color-mix(in srgb, var(--atlas-brand-sky, #7DB5E4) 18%, transparent);
  border-color: color-mix(in srgb, var(--atlas-brand-sky, #7DB5E4) 48%, transparent);
}

.atlas-mobile-menu-arrow,
.atlas-mobile-menu-value {
  color: var(--atlas-muted, #94A3B8);
  flex: 0 0 auto;
  font-size: .75rem;
  max-width: 45%;
  min-width: 0;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.atlas-mobile-menu-arrow {
  font-size: 1.1rem;
}

.atlas-mobile-menu-institutional {
  align-items: center;
  border-top: 1px solid var(--atlas-line, rgba(220, 235, 255, .12));
  color: var(--atlas-muted, #94A3B8);
  display: flex;
  flex-wrap: wrap;
  font-size: .64rem;
  gap: .35rem .7rem;
  justify-content: center;
  line-height: 1.35;
  margin-top: .75rem;
  padding: .65rem .2rem 0;
  text-align: center;
}

.atlas-mobile-menu-institutional nav {
  display: inline-flex;
  flex-wrap: wrap;
  gap: .25rem .6rem;
  justify-content: center;
}

.atlas-mobile-menu-institutional a {
  color: inherit;
  text-decoration: none;
}

.atlas-mobile-menu-institutional a:hover,
.atlas-mobile-menu-institutional a:focus-visible {
  color: var(--atlas-ink, #F5F7FF);
  text-decoration: underline;
  text-underline-offset: .16em;
}

html.atlas-modal-open,
html.atlas-modal-open body {
  overflow: hidden;
  overscroll-behavior: none;
}

:root[data-theme="light"] .atlas-mobile-sheet-card {
  color: #07152A;
}

:root[data-theme="light"] .atlas-mobile-sheet-header h2,
:root[data-theme="light"] #atlas-mobile-search,
:root[data-theme="light"] .atlas-mobile-search-result,
:root[data-theme="light"] .atlas-area-sheet-option,
:root[data-theme="light"] .atlas-mobile-menu-list button,
:root[data-theme="light"] .atlas-mobile-menu-list a,
:root[data-theme="light"] .atlas-touch-hint {
  color: #07152A;
}

:root[data-theme="light"] .atlas-mobile-search-form {
  background: rgba(255, 255, 255, .38);
}

:root[data-theme="light"] .atlas-mobile-search-result,
:root[data-theme="light"] .atlas-area-sheet-option,
:root[data-theme="light"] .atlas-mobile-menu-list button,
:root[data-theme="light"] .atlas-mobile-menu-list a {
  background: rgba(255, 255, 255, .3);
}

:root[data-theme="light"] .atlas-mobile-sheet-status,
:root[data-theme="light"] .atlas-mobile-search-result-meta,
:root[data-theme="light"] .atlas-mobile-search-results-more,
:root[data-theme="light"] .atlas-mobile-menu-arrow,
:root[data-theme="light"] .atlas-mobile-menu-value {
  color: #526277;
}

@media all and (max-width: 1024px) {
  .atlas-access-form input {
    font-size: 16px;
  }

  .atlas-password-toggle {
    height: 2.75rem;
    min-height: 2.75rem;
    min-width: 2.75rem;
    width: 2.75rem;
  }

  .atlas-mobile-sheet-card {
    width: min(100%, 42rem);
  }

  #atlas-onboarding,
  #atlas-help,
  #atlas-report {
    align-items: flex-start;
    justify-content: flex-start;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .atlas-onboarding-card,
  .atlas-help-card,
  .atlas-report-card {
    max-height: none;
    overflow: visible;
    margin: 0 auto;
  }
}

@media all and (max-width: 600px) {
  .atlas-touch-hint {
    bottom: calc(100vh - var(--atlas-viewport-offset-top, 0px) - var(--atlas-visual-height, 100vh) + 4.55rem + var(--atlas-safe-bottom, env(safe-area-inset-bottom, 0px)));
    font-size: .7rem;
    max-width: calc(var(--atlas-visual-width, 100vw) - 2rem);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .atlas-mobile-sheet-card {
    max-height: calc(var(--atlas-visual-height, 100dvh) - max(.75rem, calc(var(--atlas-safe-top, env(safe-area-inset-top, 0px)) + .5rem)) - max(.75rem, calc(var(--atlas-safe-bottom, env(safe-area-inset-bottom, 0px)) + .5rem)));
    padding-inline: .85rem;
    width: 100%;
  }

  #atlas-search-sheet .atlas-mobile-sheet-card {
    height: 100%;
    min-height: 0;
  }

  @media all and (max-width: 240px) {
    :root.atlas-narrow-viewport .atlas-mobile-menu-value {
      overflow-wrap: break-word;
      text-overflow: clip;
      white-space: normal;
    }
  }
}

@media all and (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
  .atlas-mobile-sheet {
    align-items: stretch;
    justify-content: flex-end;
  }

  .atlas-mobile-sheet-card {
    border-radius: 26px 0 0 26px;
    height: 100%;
    max-height: none;
    transform: translateX(14px);
    width: min(28rem, calc(var(--atlas-visual-width, 100vw) - 2rem));
  }
}

`

  AtlasAccessComponent.beforeDOMLoaded = 'document.documentElement.dataset.atlasAccess = "locked";'

  AtlasAccessComponent.afterDOMLoaded = createAccessRuntime(
    options.passwordHash,
    options.storageKey,
  )

  return AtlasAccessComponent
}

export const AtlasApp = () => {
  const AtlasAppComponent = ({ fileData }) => {
    const asset = logoPath(fileData)
    const currentSlug = String(fileData?.slug || "index")
    const isRoadmap = currentSlug === "roadmap"
    const institutionalLinks = [
      ["Privacidade", "privacidade"],
      ["Termos", "termos"],
      ["Segurança", "seguranca"],
      ["Acessibilidade", "acessibilidade"],
    ]
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
          id: "atlas-touch-hint",
          class: "atlas-touch-hint",
          role: "status",
          hidden: true,
        },
        h("span", null, "Arraste para explorar"),
        h("span", { class: "atlas-touch-hint-separator", "aria-hidden": "true" }, "·"),
        h("span", null, "Pinça para aproximar"),
      ),
      h(
        "section",
        {
          id: "atlas-search-sheet",
          class: "atlas-mobile-sheet atlas-search-sheet",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "atlas-search-sheet-title",
          "aria-hidden": "true",
          hidden: true,
        },
        h("button", {
          class: "atlas-mobile-sheet-backdrop",
          type: "button",
          "aria-label": "Fechar busca",
          "data-atlas-action": "close-search",
        }),
        h(
          "div",
          { class: "atlas-mobile-sheet-card" },
          h(
            "header",
            { class: "atlas-mobile-sheet-header" },
            h(
              "div",
              null,
              h("p", { class: "atlas-mobile-sheet-kicker" }, "EXPLORAR O GRAFO"),
              h("h2", { id: "atlas-search-sheet-title" }, "Buscar conceito"),
            ),
            h(
              "button",
              {
                class: "atlas-mobile-sheet-close",
                type: "button",
                "aria-label": "Fechar busca",
                "data-atlas-action": "close-search",
              },
              "×",
            ),
          ),
          h(
            "div",
            { class: "atlas-mobile-search-form", role: "search" },
            h("span", { class: "atlas-mobile-search-icon", "aria-hidden": "true" }, "⌕"),
            h("input", {
              id: "atlas-mobile-search",
              type: "search",
              placeholder: "Digite um conceito",
              autocomplete: "off",
              autocapitalize: "none",
              spellcheck: false,
              "aria-label": "Buscar conceitos no Atlas",
              "aria-controls": "atlas-search-results",
              "aria-describedby": "atlas-search-results-status",
            }),
          ),
          h("p", {
            id: "atlas-search-results-status",
            class: "atlas-mobile-sheet-status",
            role: "status",
          }),
          h("ul", {
            id: "atlas-search-results",
            class: "atlas-mobile-search-results",
            role: "listbox",
            "aria-label": "Resultados da busca",
          }),
        ),
      ),
      h(
        "section",
        {
          id: "atlas-area-sheet",
          class: "atlas-mobile-sheet atlas-area-sheet",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "atlas-area-sheet-title",
          "aria-hidden": "true",
          hidden: true,
        },
        h("button", {
          class: "atlas-mobile-sheet-backdrop",
          type: "button",
          "aria-label": "Fechar filtro por área",
          "data-atlas-action": "close-area",
        }),
        h(
          "div",
          { class: "atlas-mobile-sheet-card" },
          h(
            "header",
            { class: "atlas-mobile-sheet-header" },
            h(
              "div",
              null,
              h("p", { class: "atlas-mobile-sheet-kicker" }, "FILTRO DO GRAFO"),
              h("h2", { id: "atlas-area-sheet-title" }, "Escolher área"),
            ),
            h(
              "button",
              {
                class: "atlas-mobile-sheet-close",
                type: "button",
                "aria-label": "Fechar filtro por área",
                "data-atlas-action": "close-area",
              },
              "×",
            ),
          ),
          h(
            "p",
            { class: "atlas-mobile-sheet-status" },
            "Mostre apenas o contexto que deseja explorar.",
          ),
          h("div", {
            id: "atlas-area-sheet-options",
            class: "atlas-area-sheet-options",
            role: "listbox",
            "aria-label": "Áreas do grafo",
          }),
        ),
      ),
      h(
        "section",
        {
          id: "atlas-mobile-menu",
          class: "atlas-mobile-sheet atlas-mobile-menu",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "atlas-mobile-menu-title",
          "aria-hidden": "true",
          hidden: true,
        },
        h("button", {
          class: "atlas-mobile-sheet-backdrop",
          type: "button",
          "aria-label": "Fechar menu",
          "data-atlas-action": "close-mobile-menu",
        }),
        h(
          "div",
          { class: "atlas-mobile-sheet-card" },
          h(
            "header",
            { class: "atlas-mobile-sheet-header" },
            h(
              "div",
              null,
              h("p", { class: "atlas-mobile-sheet-kicker" }, "NUTRIWORK / ATLAS"),
              h("h2", { id: "atlas-mobile-menu-title" }, "Menu do Atlas"),
            ),
            h(
              "button",
              {
                class: "atlas-mobile-sheet-close",
                type: "button",
                "aria-label": "Fechar menu",
                "data-atlas-action": "close-mobile-menu",
              },
              "×",
            ),
          ),
          h(
            "nav",
            { class: "atlas-mobile-menu-list", "aria-label": "Ações do Atlas" },
            h(
              "a",
              {
                class: "atlas-mobile-menu-link",
                href: resolveRelative(String(fileData?.slug || "index"), "roadmap"),
                "data-router-ignore": "",
                "aria-current": isRoadmap ? "page" : undefined,
              },
              h("span", null, "Roadmap"),
              h("span", { class: "atlas-mobile-menu-arrow", "aria-hidden": "true" }, "→"),
            ),
            h(
              "button",
              {
                type: "button",
                "data-atlas-daily-action": "open",
                hidden: isRoadmap,
                "aria-haspopup": "dialog",
                "aria-controls": "atlas-daily-task-panel",
              },
              h("span", null, "Tarefas de hoje"),
              h("span", { class: "atlas-mobile-menu-arrow", "aria-hidden": "true" }, "→"),
            ),
            h(
              "button",
              { type: "button", "data-atlas-action": "open-search", hidden: isRoadmap },
              h("span", null, "Buscar conceito"),
              h("span", { class: "atlas-mobile-menu-arrow", "aria-hidden": "true" }, "→"),
            ),
            h(
              "button",
              { type: "button", "data-atlas-action": "open-area", hidden: isRoadmap },
              h("span", null, "Filtrar por área"),
              h(
                "span",
                { class: "atlas-mobile-menu-value", id: "atlas-mobile-menu-area-value" },
                "Todas as áreas",
              ),
            ),
            h(
              "button",
              { type: "button", "data-atlas-action": "open-onboarding", hidden: isRoadmap },
              h("span", null, "Como funciona?"),
              h("span", { class: "atlas-mobile-menu-arrow", "aria-hidden": "true" }, "→"),
            ),
            h(
              "button",
              { type: "button", "data-atlas-action": "open-help" },
              h("span", null, "Ajuda e suporte"),
              h("span", { class: "atlas-mobile-menu-arrow", "aria-hidden": "true" }, "→"),
            ),
            h(
              "button",
              { type: "button", "data-atlas-action": "toggle-theme" },
              h("span", null, "Tema"),
              h(
                "span",
                { class: "atlas-mobile-menu-value", id: "atlas-theme-menu-label" },
                "Usar modo escuro",
              ),
            ),
            h(
              "button",
              { type: "button", "data-atlas-action": "toggle-nav" },
              h("span", null, "Ocultar barra de navegação"),
              h("span", { class: "atlas-mobile-menu-arrow", "aria-hidden": "true" }, "−"),
            ),
            h(
              "button",
              { type: "button", "data-atlas-logout": "true" },
              h("span", null, "Sair do Atlas"),
              h("span", { class: "atlas-mobile-menu-arrow", "aria-hidden": "true" }, "↗"),
            ),
          ),
          h(
            "div",
            { class: "atlas-mobile-menu-institutional" },
            h("span", null, "Informações institucionais"),
            h(
              "nav",
              { "aria-label": "Links institucionais" },
              institutionalLinks.map(([label, slug]) =>
                h(
                  "a",
                  {
                    href: withQuery(resolveRelative(currentSlug, slug), "atlasReturn", "atlas"),
                    "data-router-ignore": "",
                  },
                  label,
                ),
              ),
            ),
          ),
        ),
      ),
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
      h(
        "div",
        {
          id: "atlas-report",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "atlas-report-title",
          "aria-hidden": "true",
          hidden: true,
        },
        h("button", {
          class: "atlas-report-backdrop",
          type: "button",
          "aria-label": "Fechar reporte de problema",
          "data-atlas-action": "close-report",
        }),
        h(
          "section",
          { class: "atlas-report-card" },
          h(
            "header",
            { class: "atlas-report-header" },
            h("p", { class: "atlas-report-kicker" }, "REPORTE"),
            h(
              "button",
              {
                class: "atlas-report-close",
                type: "button",
                "data-atlas-action": "close-report",
                "aria-label": "Fechar reporte de problema",
              },
              "×",
            ),
          ),
          h("h2", { id: "atlas-report-title" }, "Encontrou um problema?"),
          h(
            "p",
            { class: "atlas-report-copy" },
            "Avise o suporte sobre o conceito ",
            h("strong", { "data-atlas-report-concept": "" }, "desta nota"),
            ".",
          ),
          h(
            "a",
            {
              class: "atlas-report-link",
              "data-atlas-report-link": "",
              href: "https://wa.me/5512997505188",
              target: "_blank",
              rel: "noreferrer",
            },
            "Falar com o suporte no WhatsApp",
          ),
        ),
      ),
    )
  }

  AtlasAppComponent.afterDOMLoaded = String.raw`
;(() => {
  function fitNoBreakHeadings() {
    for (const heading of document.querySelectorAll("[data-atlas-fit-title]")) {
      if (!(heading instanceof HTMLElement)) continue
      heading.style.fontSize = ""
      heading.style.maxWidth = ""
      if (!heading.clientWidth) continue
      if (heading.scrollWidth > heading.clientWidth + 1) heading.style.maxWidth = "100%"
      const availableWidth = heading.parentElement?.clientWidth || heading.clientWidth
      let fontSize = Number.parseFloat(window.getComputedStyle(heading).fontSize)
      if (!Number.isFinite(fontSize)) continue
      const minimum = Math.max(14, Math.min(22, fontSize * 0.45))
      while (heading.scrollWidth > availableWidth + 1 && fontSize > minimum) {
        fontSize = Math.max(minimum, fontSize - 1)
        heading.style.fontSize = fontSize + "px"
      }
    }
  }
  fitNoBreakHeadings()
  const mount = document.getElementById("atlas-graph-root")
  const roadmap = document.querySelector('.atlas-frame[data-atlas-route="roadmap"]')
  const source = mount
    ? "/static/atlas-runtime.js"
    : roadmap
      ? "/static/atlas-roadmap-runtime.js"
      : ""
  const alreadyLoaded = [...document.querySelectorAll("script[data-atlas-runtime]")].some(
    (script) => script.dataset.atlasRuntime === source,
  )
  if (!source || alreadyLoaded) return

  const runtime = document.createElement("script")
  let settled = false
  let timeout = 0
  const fail = () => {
    if (settled) return
    settled = true
    if (timeout) window.clearTimeout(timeout)
    runtime.remove()
    if (!mount) return
    mount.replaceChildren()
    const message = document.createElement("p")
    message.className = "atlas-graph-error"
    message.textContent = "Não foi possível iniciar o grafo."
    const retry = document.createElement("button")
    retry.type = "button"
    retry.className = "atlas-graph-retry"
    retry.textContent = "Tentar novamente"
    retry.addEventListener("click", () => window.location.reload())
    mount.append(message, retry)
  }

  runtime.src = source
  runtime.async = false
  runtime.dataset.atlasRuntime = source
  runtime.addEventListener("load", () => {
    settled = true
    if (timeout) window.clearTimeout(timeout)
  }, { once: true })
  runtime.addEventListener("error", fail, { once: true })
  timeout = window.setTimeout(fail, 15000)
  document.head.append(runtime)
})()
`
  return AtlasAppComponent
}
