;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const d3 = window.__nutriworkD3Force
  const { clamp } = atlas.dom

  const DEFAULTS = {
    spacing: 1.35,
    repulsion: 1.18,
    linkStrength: 0.72,
    collisionPadding: 10,
    centerForce: 0.28,
  }

  function densityFactor(nodeCount) {
    return clamp(1.08 - nodeCount / 700, 0.72, 1.02)
  }

  function linkDistance(config) {
    return clamp(120 + Number(config.spacing || DEFAULTS.spacing) * 36, 145, 220)
  }

  function chargeStrength(config, nodeCount) {
    const factor = densityFactor(nodeCount)
    return -190 * Number(config.repulsion || DEFAULTS.repulsion) * factor
  }

  function linkStrength(config, nodeCount) {
    const factor = densityFactor(nodeCount)
    return clamp(
      (0.18 + Number(config.linkStrength || DEFAULTS.linkStrength) * 0.54) * factor,
      0.16,
      0.8,
    )
  }

  function radiusFor(node) {
    return Math.max(5, Number(node.collisionRadius || node.radius || 8))
  }

  function create(nodes, links, config, width, height) {
    if (!d3?.forceSimulation) {
      console.error("A engine física D3 do Atlas não foi carregada")
      return null
    }

    const settings = { ...DEFAULTS, ...(config || {}) }
    const dimensions = { width: Number(width) || 1800, height: Number(height) || 1100 }
    const charge = d3
      .forceManyBody()
      .strength((node) => {
        const degreeWeight = 1 + Math.min(32, Number(node.degree || 0)) / 170
        return chargeStrength(settings, nodes.length) * degreeWeight
      })
      .distanceMax(Math.max(dimensions.width, dimensions.height) * 0.92)
    const center = d3
      .forceCenter(dimensions.width / 2, dimensions.height / 2)
      .strength(clamp(Number(settings.centerForce) || DEFAULTS.centerForce, 0.04, 0.55))
    const gravityStrength = clamp(
      (Number(settings.centerForce) || DEFAULTS.centerForce) * 0.11,
      0.004,
      0.045,
    )
    const gravityX = d3.forceX(dimensions.width / 2).strength(gravityStrength)
    const gravityY = d3.forceY(dimensions.height / 2).strength(gravityStrength)
    const link = d3
      .forceLink(links)
      .id((node) => node.id || node.slug)
      .distance(linkDistance(settings))
      .strength(linkStrength(settings, nodes.length))
    const collide = d3
      .forceCollide()
      .radius((node) => radiusFor(node) + Number(settings.collisionPadding || 0))
      .iterations(4)

    const simulation = d3
      .forceSimulation(nodes)
      .force("charge", charge)
      .force("center", center)
      .force("gravityX", gravityX)
      .force("gravityY", gravityY)
      .force("link", link)
      .force("collide", collide)
      .velocityDecay(0.38)
      .alphaDecay(0.022)
      .alphaMin(0.001)
      .alpha(1)

    function update(nextConfig, nextWidth, nextHeight) {
      Object.assign(settings, DEFAULTS, nextConfig || {})
      if (Number(nextWidth) > 0) dimensions.width = Number(nextWidth)
      if (Number(nextHeight) > 0) dimensions.height = Number(nextHeight)
      charge.strength((node) => {
        const degreeWeight = 1 + Math.min(32, Number(node.degree || 0)) / 170
        return chargeStrength(settings, nodes.length) * degreeWeight
      })
      charge.distanceMax(Math.max(dimensions.width, dimensions.height) * 0.92)
      center
        .x(dimensions.width / 2)
        .y(dimensions.height / 2)
        .strength(clamp(Number(settings.centerForce) || DEFAULTS.centerForce, 0.04, 0.55))
      gravityX
        .x(dimensions.width / 2)
        .strength(
          clamp((Number(settings.centerForce) || DEFAULTS.centerForce) * 0.11, 0.004, 0.045),
        )
      gravityY
        .y(dimensions.height / 2)
        .strength(
          clamp((Number(settings.centerForce) || DEFAULTS.centerForce) * 0.11, 0.004, 0.045),
        )
      link.distance(linkDistance(settings)).strength(linkStrength(settings, nodes.length))
      collide
        .radius((node) => radiusFor(node) + Number(settings.collisionPadding || 0))
        .iterations(4)
      simulation.alpha(Math.max(simulation.alpha(), 0.48)).restart()
    }

    function reheat(alpha) {
      simulation.alpha(Math.max(simulation.alpha(), Number(alpha) || 0.72)).restart()
    }

    function resize(nextWidth, nextHeight) {
      update(settings, nextWidth, nextHeight)
    }

    return {
      dimensions,
      nodes,
      links,
      simulation,
      update,
      reheat,
      resize,
      forces: { charge, center, link, collide },
    }
  }

  atlas.graphPhysics = {
    chargeStrength,
    create,
    linkDistance,
    linkStrength,
  }
})()
