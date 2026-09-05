;(() => {
  const state = (window.__nutriworkAtlasRoadmap = window.__nutriworkAtlasRoadmap || {})
  if (state.handlersInstalled) {
    void state.flush?.()
    return
  }
  state.handlersInstalled = true

  const root = document.documentElement
  const suggestionQueueKey = "nutriwork-atlas-roadmap-suggestions-v1"
  let opener = null
  let toastTimer = 0
  let submitting = false
  let flushing = null
  let automaticRetryUsed = false

  function elements() {
    const form = document.getElementById("atlas-roadmap-suggestion-form")
    const toast = document.getElementById("atlas-roadmap-toast")
    return {
      overlay: document.getElementById("atlas-roadmap-suggestion"),
      form,
      title: document.getElementById("atlas-roadmap-suggestion-title-input"),
      description: document.getElementById("atlas-roadmap-suggestion-description"),
      status: document.getElementById("atlas-roadmap-suggestion-status"),
      submit: form?.querySelector('button[type="submit"]'),
      toast,
      toastTitle: toast?.querySelector("[data-atlas-roadmap-toast-title]"),
      toastCopy: toast?.querySelector("[data-atlas-roadmap-toast-copy]"),
    }
  }

  function setStatus(message, stateName = "") {
    const { status } = elements()
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
    const { overlay, title } = elements()
    if (!overlay) return
    if (open) {
      overlay.hidden = false
      overlay.setAttribute("aria-hidden", "false")
      root.classList.add("atlas-modal-open")
      window.requestAnimationFrame(() => {
        overlay.classList.add("is-open")
        title?.focus()
      })
      return
    }
    overlay.classList.remove("is-open")
    overlay.setAttribute("aria-hidden", "true")
    root.classList.remove("atlas-modal-open")
    window.setTimeout(() => {
      if (!overlay.classList.contains("is-open")) overlay.hidden = true
    }, 220)
    window.requestAnimationFrame(() => opener?.focus?.())
    opener = null
  }

  function showToast(kind, heading, copy) {
    const { toast, toastTitle, toastCopy } = elements()
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
    return (
      window.crypto?.randomUUID?.() ||
      `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0").slice(-12)}`
    )
  }

  function readSuggestionQueue() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(suggestionQueueKey) || "[]")
      return Array.isArray(saved)
        ? saved.filter(
            (item) =>
              item &&
              typeof item.title === "string" &&
              typeof item.description === "string" &&
              typeof item.submissionId === "string",
          )
        : []
    } catch {
      return []
    }
  }

  function writeSuggestionQueue(items) {
    try {
      if (items.length) window.localStorage.setItem(suggestionQueueKey, JSON.stringify(items))
      else window.localStorage.removeItem(suggestionQueueKey)
    } catch {
      // The request still runs when storage is unavailable.
    }
  }

  function enqueueSuggestion(item) {
    const queue = readSuggestionQueue().filter(
      (queued) => queued.submissionId !== item.submissionId,
    )
    queue.push(item)
    writeSuggestionQueue(queue)
  }

  function removeQueuedSuggestion(id) {
    writeSuggestionQueue(readSuggestionQueue().filter((item) => item.submissionId !== id))
  }

  async function sendSuggestion(item) {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 25000)
    try {
      const response = await fetch("/api/atlas-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(item),
        signal: controller.signal,
      })
      let result = null
      try {
        result = await response.json()
      } catch {
        // The caller handles malformed upstream responses as a failed submission.
      }
      if (!response.ok || result?.ok !== true) throw new Error(result?.code || "failed")
    } finally {
      window.clearTimeout(timeout)
    }
  }

  function scheduleSuggestionRetry() {
    if (automaticRetryUsed || !readSuggestionQueue().length) return
    automaticRetryUsed = true
    window.setTimeout(() => void flushSuggestionQueue(), 5000)
  }

  function flushSuggestionQueue(currentSubmissionId = "") {
    if (flushing) return flushing
    flushing = (async () => {
      const queue = readSuggestionQueue()
      const current = queue.find((item) => item.submissionId === currentSubmissionId)
      const items = current
        ? [current, ...queue.filter((item) => item.submissionId !== currentSubmissionId)]
        : queue
      for (const item of items) {
        try {
          await sendSuggestion(item)
          removeQueuedSuggestion(item.submissionId)
          if (item.submissionId === currentSubmissionId) {
            showToast(
              "success",
              "Sugestão recebida!",
              "Obrigado por contribuir com o Atlas. Sua sugestão será considerada em futuras melhorias.",
            )
          }
        } catch (error) {
          if (item.submissionId === currentSubmissionId) {
            showToast(
              "error",
              "Envio não concluído",
              error?.message === "rate_limited"
                ? "Muitas tentativas. Aguarde alguns minutos e tente novamente."
                : "Não foi possível confirmar o envio agora. Vamos tentar novamente em segundo plano.",
            )
          }
          scheduleSuggestionRetry()
          break
        }
      }
    })().finally(() => {
      flushing = null
      if (readSuggestionQueue().length && !automaticRetryUsed) void flushSuggestionQueue()
    })
    return flushing
  }

  function handleClick(event) {
    if (!(event.target instanceof Element)) return
    const trigger = event.target.closest("[data-atlas-roadmap-action]")
    if (!trigger) return
    const action = trigger.dataset.atlasRoadmapAction
    if (action === "open-suggestion") {
      event.preventDefault()
      const { title, description } = elements()
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : trigger
      setStatus("")
      setInvalid(title, false)
      setInvalid(description, false)
      setModalOpen(true)
    } else if (action === "close-suggestion") {
      event.preventDefault()
      if (!submitting) setModalOpen(false)
    }
  }

  async function handleSubmit(event) {
    const form = event.target instanceof HTMLFormElement ? event.target : null
    if (!form || form.id !== "atlas-roadmap-suggestion-form") return
    event.preventDefault()
    if (submitting) return
    const { title, description, submit } = elements()
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
    automaticRetryUsed = false
    if (submit) {
      submit.disabled = true
      submit.textContent = "Enviando…"
    }
    const item = {
      title: cleanTitle,
      description: cleanDescription,
      submissionId: submissionId(),
    }
    enqueueSuggestion(item)
    form.reset()
    setStatus("")
    setModalOpen(false)
    submitting = false
    if (submit) {
      submit.disabled = false
      submit.textContent = "Enviar sugestão"
    }
    showToast("loading", "Sugestão em envio", "Estamos encaminhando sua sugestão em segundo plano.")
    void flushSuggestionQueue(item.submissionId)
  }

  function handleKeydown(event) {
    const { overlay } = elements()
    if (event.key === "Escape" && overlay && !overlay.hidden && !submitting) setModalOpen(false)
  }

  document.addEventListener("click", handleClick)
  document.addEventListener("submit", (event) => void handleSubmit(event))
  document.addEventListener("keydown", handleKeydown)
  document.addEventListener("nav", () => void flushSuggestionQueue())
  state.flush = flushSuggestionQueue
  state.ready = true
  void flushSuggestionQueue()
})()
