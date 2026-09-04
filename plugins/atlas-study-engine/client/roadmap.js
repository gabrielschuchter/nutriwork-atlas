;(() => {
  const route = document.querySelector('.atlas-frame[data-atlas-route="roadmap"]')
  if (!route) return

  const state = (window.__nutriworkAtlasRoadmap = window.__nutriworkAtlasRoadmap || {})
  if (state.ready) return
  state.ready = true

  const root = document.documentElement
  const overlay = document.getElementById("atlas-roadmap-suggestion")
  const form = document.getElementById("atlas-roadmap-suggestion-form")
  const title = document.getElementById("atlas-roadmap-suggestion-title-input")
  const description = document.getElementById("atlas-roadmap-suggestion-description")
  const status = document.getElementById("atlas-roadmap-suggestion-status")
  const submit = form?.querySelector('button[type="submit"]')
  const toast = document.getElementById("atlas-roadmap-toast")
  const toastTitle = toast?.querySelector("[data-atlas-roadmap-toast-title]")
  const toastCopy = toast?.querySelector("[data-atlas-roadmap-toast-copy]")
  let opener = null
  let toastTimer = 0
  let submitting = false

  function setStatus(message, stateName = "") {
    if (!status) return
    status.textContent = message
    status.dataset.state = stateName
  }

  function setInvalid(input, invalid) {
    if (!input) return
    if (invalid) input.setAttribute("aria-invalid", "true")
    else input.removeAttribute("aria-invalid")
  }

  function setModalOpen(open) {
    if (!overlay) return
    if (open) {
      overlay.hidden = false
      overlay.setAttribute("aria-hidden", "false")
      root.classList.add("atlas-modal-open")
      window.requestAnimationFrame(() => {
        overlay.classList.add("is-open")
        title?.focus()
      })
    } else {
      overlay.classList.remove("is-open")
      overlay.setAttribute("aria-hidden", "true")
      root.classList.remove("atlas-modal-open")
      window.setTimeout(() => {
        if (!overlay.classList.contains("is-open")) overlay.hidden = true
      }, 220)
      window.requestAnimationFrame(() => opener?.focus())
      opener = null
    }
  }

  function showToast(kind, heading, copy) {
    if (!toast) return
    if (toastTimer) window.clearTimeout(toastTimer)
    toast.dataset.state = kind
    if (toastTitle) toastTitle.textContent = heading
    if (toastCopy) toastCopy.textContent = copy
    toast.hidden = false
    window.requestAnimationFrame(() => toast.classList.add("is-open"))
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-open")
      window.setTimeout(() => {
        if (!toast.classList.contains("is-open")) toast.hidden = true
      }, 220)
    }, 6200)
  }

  function submissionId() {
    return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return
    const trigger = event.target.closest("[data-atlas-roadmap-action]")
    if (!trigger) return
    const action = trigger.dataset.atlasRoadmapAction
    if (action === "open-suggestion") {
      event.preventDefault()
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : trigger
      setStatus("")
      setInvalid(title, false)
      setInvalid(description, false)
      setModalOpen(true)
    } else if (action === "close-suggestion") {
      event.preventDefault()
      if (!submitting) setModalOpen(false)
    }
  })

  form?.addEventListener("submit", async (event) => {
    event.preventDefault()
    if (submitting) return
    const cleanTitle = title?.value.trim() || ""
    const cleanDescription = description?.value.trim() || ""
    const titleInvalid = !cleanTitle || cleanTitle.length > 160
    const descriptionInvalid = !cleanDescription || cleanDescription.length > 2000
    setInvalid(title, titleInvalid)
    setInvalid(description, descriptionInvalid)
    if (titleInvalid || descriptionInvalid) {
      setStatus("Preencha o título e a descrição para enviar.", "error")
      ;(titleInvalid ? title : description)?.focus()
      return
    }

    submitting = true
    if (submit) {
      submit.disabled = true
      submit.textContent = "Enviando…"
    }
    setStatus("Enviando…", "loading")
    try {
      const response = await fetch("/api/atlas-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title: cleanTitle,
          description: cleanDescription,
          submissionId: submissionId(),
        }),
        signal: AbortSignal.timeout(30000),
      })
      let result = null
      try {
        result = await response.json()
      } catch {
        // The user-facing error below is enough when the upstream is malformed.
      }
      if (!response.ok || result?.ok !== true) throw new Error(result?.code || "failed")
      form.reset()
      setStatus("")
      setModalOpen(false)
      showToast(
        "success",
        "Sugestão recebida!",
        "Obrigado por contribuir com o Atlas. Sua sugestão será considerada em futuras melhorias.",
      )
    } catch (error) {
      setStatus(
        error?.message === "rate_limited"
          ? "Muitas tentativas. Aguarde alguns minutos e tente novamente."
          : "Não foi possível concluir o envio. Tente novamente em instantes.",
        "error",
      )
      showToast(
        "error",
        "Envio não concluído",
        "Não foi possível enviar sua sugestão. Tente novamente em instantes.",
      )
    } finally {
      submitting = false
      if (submit) {
        submit.disabled = false
        submit.textContent = "Enviar sugestão"
      }
    }
  })

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !overlay || overlay.hidden || submitting) return
    setModalOpen(false)
  })
})()
