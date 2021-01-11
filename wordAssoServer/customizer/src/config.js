const config = {
  defaults: {
    maxNodesLimit: 100,
    maxNodesLimitRange: {
      min: 0,
      max: 200,
      step: 1
    },
    nodeMaxAge: 20000,
    nodeMaxAgeRange: {
      min: 0,
      max: 60000,
      step: 100
    },
    velocityDecay: 0.8,
    velocityDecayRange: {
      min: 0.0,
      max: 1.0,
      step: 0.01
    },
    charge: -500,
    chargeRange: {
      min: -1000,
      max: 1000,
      step: 10
    },
    gravity: 0.005,
    gravityRange: {
      min: -0.002,
      max: 0.002,
      step: 0.00001
    },
    nodeRadiusRatioRange: {
      min: 0.0,
      max: 0.25,
      step: 0.001
    },
    nodeRadiusRatio: {
      min: 0.007,
      max: 0.047
    },
    fontSizeRatioRange: {
      min: 0.0,
      max: 1.0,
      step: 0.001
    },
    fontSizeRatio: {
      min: 0.015,
      max: 0.45
    }
  },
  settings: {
    maxNodesLimit: 47,
    maxNodesLimitRange: {
      min: 0,
      max: 100,
      step: 1
    },
    nodeMaxAge: 10000,
    nodeMaxAgeRange: {
      min: 0,
      max: 60000,
      step: 100
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
      min: -0.0001,
      max: 0.01,
      step: 0.00001
    },
    nodeRadiusRatioRange: {
      min: 0.0,
      max: 0.25,
      step: 0.001
    },
    nodeRadiusRatio: {
      min: 0.015,
      max: 0.08
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
  }
}

export default config;