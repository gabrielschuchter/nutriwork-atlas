import { normalizeEmail } from "./identification.js"

// Serialized into Quartz's existing access script; no backend configuration enters this module.
export function installAccessGate(expectedHash, storageKey, normalizeEmail) {
  const runtimeKey = "__nutriworkAtlasAccessRuntime"
  if (window[runtimeKey]) return
  window[runtimeKey] = true
  const root = document.documentElement
  const identityKey = "nutriwork-atlas-identification-v1"
  let email = null
  try {
    const saved = JSON.parse(window.localStorage.getItem(identityKey))
    if (saved?.version === 1) email = normalizeEmail(saved.email)
  } catch {}
  let registered = false
  let pending = false
  let visitId = null
  let memoryUnlocked = false
  const byId = (id) => document.getElementById(id)
  const readPasswordState = () => {
    try {
      return memoryUnlocked || window.localStorage.getItem(storageKey) === expectedHash
    } catch {
      return memoryUnlocked
    }
  }
  const announce = (message, state = "") => {
    const status = byId(email ? "atlas-access-status" : "atlas-identification-status")
    if (status) {
      status.textContent = message
      status.dataset.state = state
    }
  }
  const render = () => {
    const identityForm = byId("atlas-identification-form")
    const passwordForm = byId("atlas-access-form")
    if (identityForm) identityForm.hidden = Boolean(email)
    if (passwordForm) passwordForm.hidden = !email
    const identitySubmit = byId("atlas-identification-submit")
    if (identitySubmit) {
      identitySubmit.disabled = pending
      identitySubmit.textContent = pending ? "Preparando seu acesso…" : "Continuar"
    }
    const input = byId("atlas-identification-email")
    if (input) input.readOnly = pending
    identityForm?.setAttribute("aria-busy", String(pending && !email))
    const passwordSubmit = byId("atlas-access-submit")
    if (passwordSubmit) passwordSubmit.disabled = !registered || pending
    const retry = byId("atlas-identification-retry")
    if (retry) retry.hidden = !email || registered || pending
    const change = byId("atlas-identification-change")
    if (change) change.disabled = pending
    const hint = byId("atlas-device-hint")
    if (hint) {
      const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
      hint.hidden = !(
        navigator.userAgentData?.mobile ||
        /Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent || "",
        ) ||
        iPadOs
      )
    }
  }
  const focusInput = () => {
    // Avoid summoning the mobile keyboard automatically.
    if (navigator.maxTouchPoints > 0) return
    window.requestAnimationFrame(() =>
      byId(email ? "atlas-access-password" : "atlas-identification-email")?.focus({
        preventScroll: true,
      }),
    )
  }
  const setState = (unlocked) => {
    const next = unlocked && registered ? "unlocked" : "locked"
    const changed = root.dataset.atlasAccess !== next
    root.dataset.atlasAccess = next
    if (changed) document.dispatchEvent(new CustomEvent("atlas-access"))
  }
  const register = async (candidate, isNew = false) => {
    if (pending) return
    pending = true
    render()
    announce("Preparando seu acesso…", "loading")
    const started = Date.now()
    try {
      visitId ||= crypto.randomUUID()
      const response = await fetch("/api/atlas-identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: candidate, visitId }),
        signal: AbortSignal.timeout(20000),
      })
      const result = await response.json()
      if (!response.ok || result?.ok !== true || result.email !== candidate) {
        throw new Error(response.status === 429 ? "rate_limited" : "registration_failed")
      }
      await new Promise((resolve) =>
        window.setTimeout(resolve, Math.max(0, 350 - (Date.now() - started))),
      )
      announce("E-mail registrado.", "success")
      registered = true
      email = candidate
      try {
        window.localStorage.setItem(identityKey, JSON.stringify({ version: 1, email }))
        // Existing installations also identify before seeing the password gate once.
        if (isNew) window.localStorage.removeItem(storageKey)
      } catch {}
      if (isNew) memoryUnlocked = false
      pending = false
      render()
      announce("E-mail registrado. Digite a senha do Atlas.", "success")
      setState(!isNew && readPasswordState())
      if (root.dataset.atlasAccess === "locked") focusInput()
    } catch (error) {
      registered = false
      pending = false
      render()
      announce(
        error?.message === "rate_limited"
          ? "Muitas tentativas. Aguarde alguns minutos e tente novamente."
          : "Não foi possível registrar seu acesso agora. Tente novamente.",
        "error",
      )
      setState(false)
    }
  }
  const digest = async (value) => {
    const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
    return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
  }
  document.addEventListener("submit", async (event) => {
    const form = event.target
    if (!(form instanceof HTMLFormElement)) return
    if (form.id === "atlas-identification-form") {
      event.preventDefault()
      if (pending) return
      const input = byId("atlas-identification-email")
      const candidate = normalizeEmail(input?.value)
      if (!candidate || !input.validity.valid) {
        input?.setAttribute("aria-invalid", "true")
        announce(
          input?.value.trim()
            ? "Digite um e-mail válido, como nome@exemplo.com."
            : "Informe seu e-mail.",
          "error",
        )
        input?.focus()
        return
      }
      input.removeAttribute("aria-invalid")
      await register(candidate, true)
      return
    }
    if (form.id !== "atlas-access-form") return
    event.preventDefault()
    if (!email || !registered || pending) return
    const input = byId("atlas-access-password")
    if (!(input instanceof HTMLInputElement) || !input.value) {
      announce("Informe a senha.", "error")
      input?.focus()
      return
    }
    try {
      if ((await digest(input.value)) !== expectedHash) {
        announce("Senha incorreta.", "error")
        input.select()
        return
      }
      try {
        window.localStorage.setItem(storageKey, expectedHash)
      } catch {}
      memoryUnlocked = true
      input.value = ""
      announce("")
      setState(true)
    } catch {
      announce("Não foi possível validar a senha neste navegador.", "error")
    }
  })
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return
    const toggle = event.target.closest("#atlas-access-password-toggle")
    if (toggle) {
      const input = byId("atlas-access-password")
      const visible = input.type === "text"
      input.type = visible ? "password" : "text"
      toggle.setAttribute("aria-pressed", String(!visible))
      toggle.setAttribute("aria-label", visible ? "Mostrar senha" : "Ocultar senha")
      input.focus({ preventScroll: true })
      return
    }
    if (event.target.closest("#atlas-identification-retry")) {
      if (email) void register(email)
      return
    }
    if (event.target.closest("#atlas-identification-change") && !pending) {
      try {
        window.localStorage.removeItem(identityKey)
        window.localStorage.removeItem(storageKey)
      } catch {}
      email = null
      memoryUnlocked = false
      registered = false
      visitId = null
      render()
      announce("")
      setState(false)
      focusInput()
      return
    }
    if (event.target.closest("#atlas-access-logout, [data-atlas-logout]")) {
      try {
        window.localStorage.removeItem(storageKey)
      } catch {}
      memoryUnlocked = false
      announce("Sessão encerrada.")
      setState(false)
      render()
      focusInput()
    }
  })
  document.addEventListener("nav", () => {
    render()
    setState(readPasswordState())
  })
  render()
  setState(false)
  if (email) void register(email)
  else focusInput()
}

export function createAccessRuntime(passwordHash, storageKey) {
  const safe = (value) => JSON.stringify(value).replace(/</g, "\\u003c")
  return `(${installAccessGate.toString()})(${safe(passwordHash)}, ${safe(storageKey)}, ${normalizeEmail.toString()});`
}
