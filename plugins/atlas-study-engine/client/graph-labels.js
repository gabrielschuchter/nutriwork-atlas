;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})

  // Ratios are relative to the camera scale that frames the whole map. This
  // keeps the experience consistent when the world size or viewport changes.
  const regimes = Object.freeze([
    { minRatio: 1.9, maxLabels: 4, maxDistance: 0.62 },
    { minRatio: 2.45, maxLabels: 8, maxDistance: 0.82 },
    { minRatio: 3.15, maxLabels: 14, maxDistance: 1.02 },
    { minRatio: 4.2, maxLabels: 22, maxDistance: 1.28 },
    { minRatio: 5.5, maxLabels: 30, maxDistance: 1.65 },
  ])

  function regimeFor(scale, overviewScale) {
    const ratio =
      Number.isFinite(scale) && Number.isFinite(overviewScale) && overviewScale > 0
        ? scale / overviewScale
        : 0
    let selected = { minRatio: Infinity, maxLabels: 0, maxDistance: 0 }
    for (const regime of regimes) {
      if (ratio >= regime.minRatio) selected = regime
      else break
    }
    return { ...selected, ratio }
  }

  function viewportBudget(width, height, maximum) {
    const cap = Math.max(0, Math.floor(Number(maximum) || 0))
    if (!cap) return 0
    const area = Math.max(1, Number(width) || 1) * Math.max(1, Number(height) || 1)
    return Math.min(cap, Math.max(1, Math.floor(area / 56000)))
  }

  atlas.graphLabels = { regimes, regimeFor, viewportBudget }
})()
