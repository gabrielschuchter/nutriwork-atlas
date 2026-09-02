;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const d3 = window.__nutriworkD3Force
  const { clamp } = atlas.dom

  const WORLD = { width: 2400, height: 1600 }

  function create(nodes, links) {
    if (!d3?.forceSimulation) {
      console.error("A engine física D3 do Atlas não foi carregada.")
      return null
    }

    const charge = d3
      .forceManyBody()
      .strength((node) => -150 - Math.min(30, Number(node.degree || 0)) * 3.2)
      .distanceMax(1250)
    const link = d3
      .forceLink(links)
      .id((node) => node.id || node.slug)
      .distance((edge) => (edge.source?.degree > 12 || edge.target?.degree > 12 ? 96 : 118))
      .strength(0.44)
    const collide = d3
      .forceCollide()
      .radius((node) => 8 + Math.min(12, Math.sqrt(Number(node.degree || 0) + 1) * 1.5))
      .iterations(3)
    const gravityX = d3.forceX(WORLD.width / 2).strength(0.018)
    const gravityY = d3.forceY(WORLD.height / 2).strength(0.018)
    const center = d3.forceCenter(WORLD.width / 2, WORLD.height / 2).strength(0.06)

    const simulation = d3
      .forceSimulation(nodes)
      .force("charge", charge)
      .force("link", link)
      .force("collide", collide)
      .force("gravityX", gravityX)
      .force("gravityY", gravityY)
      .force("center", center)
      .velocityDecay(0.42)
      .alphaDecay(0.028)
      .alphaMin(0.002)
      .alpha(0.92)

    return {
      dimensions: WORLD,
      nodes,
      links,
      simulation,
      reheat(alpha = 0.45) {
        simulation.alpha(clamp(alpha, 0.08, 0.9)).restart()
      },
    }
  }

  atlas.graphPhysics = { WORLD, create }
})()
