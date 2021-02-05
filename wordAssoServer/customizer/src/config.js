const config = {
  defaults: {
    keepaliveInterval: 15000,
    display: {
      hashtag: true,
      user: true,
      tweet: false,
      link: false
    },
    linkStrength: 0.2,
    linkStrengthRange: {
      min: 0,
      max: 1.0,
      step: 0.01
    },
    linkDistance: 10,
    linkDistanceRange: {
      min: 0,
      max: 1000,
      step: 1
    },
    maxNodesLimit: 50,
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
      max: 0.01,
      step: 0.00001
    },
    nodeRadiusRatioRange: {
      min: 0.0,
      max: 0.100,
      step: 0.001
    },
    nodeRadiusRatio: {
      min: 0.007,
      max: 0.047
    },
    fontSizeRatioRange: {
      min: 0.0,
      max: 0.100,
      step: 0.001
    },
    fontSizeRatio: {
      min: 0.015,
      max: 0.045
    }
  }
}

config.settings = Object.assign({}, config.defaults)

export default config;