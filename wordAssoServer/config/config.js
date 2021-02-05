let config = {
  defaults: {
    display: {
      hashtag: true,
      user: true,
      tweet: false,
      link: false
    },
    // displayTweets: false,
    // displayLinks: false,
    rxNodeQueueMax: 100,
    keepaliveInterval: 15000,
    linkStrength: 0.5,
    linkStrengthRange: {
      min: 0,
      max: 1,
      step: 0.001
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
    ageRate: 1.0,
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
      max: 0.200,
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
    },
    panzoom: {
      transform: {
        ratio: 1.0,
        scale: 0.6,
        x: 960,
        y: 0
      }
    },
    displayNodeHashMap: {
      emoji: "hide",
      hashtag: "show",
      place: "hide",
      url: "hide",
      user: "show",
      word: "hide"
    },
    pauseOnMouseMove: true,
    metricMode: "rate",
    autoCategoryFlag: false,
    forceXmultiplier: 25.0,
    forceYmultiplier: 25.0,
    collisionIterations: 1,
    collisionRadiusMultiplier: 1.0
  }
}
config.settings = Object.assign({}, config.defaults)
