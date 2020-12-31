const config = {
  defaults: {
    velocityDecay: 0.5,
    nodeRadiusRatioRange: {
      min: 0.0,
      max: 1.0,
      step: 0.001
    },
    nodeRadiusRatio: {
      min: 0.047,
      max: 0.47
    }
  },
  settings: {
    velocityDecay: 0.33,
    nodeRadiusRatio: {
      min: 0.012,
      max: 0.345
    }
  }
}

export default config;