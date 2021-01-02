const config = {
  defaults: {
    maxNodesLimit: 47,
    maxNodesLimitRange: {
      min: 0,
      max: 100,
      step: 1
    },
    nodeMaxAge: 0.5,
    nodeMaxAgeRange: {
      min: 0.0,
      max: 20000,
      step: 1.0
    },
    velocityDecay: 0.5,
    velocityDecayRange: {
      min: 0.0,
      max: 1.0,
      step: 0.01
    },
    charge: -50,
    chargeRange: {
      min: -1000,
      max: 1000,
      step: 10
    },
    gravity: 0.001,
    gravityRange: {
      min: -0.002,
      max: 0.002,
      step: 0.00001
    },
    nodeRadiusRatioRange: {
      min: 0.0,
      max: 1.0,
      step: 0.001
    },
    nodeRadiusRatio: {
      min: 0.047,
      max: 0.47
    },
    fontSizeRatioRange: {
      min: 0.0,
      max: 1.0,
      step: 0.001
    },
    fontSizeRatio: {
      min: 0.047,
      max: 0.47
    }
  },
  settings: {
    maxNodesLimit: 47,
    velocityDecay: 0.33,
    charge: -50,
    gravity: 0.001,
    nodeRadiusRatio: {
      min: 0.012,
      max: 0.345
    },
    fontSizeRatio: {
      min: 0.012,
      max: 0.345
    }
  }
}

export default config;