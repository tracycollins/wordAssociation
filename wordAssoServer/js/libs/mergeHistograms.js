function MergeHistograms() {

  var self = this;

  this.merge = function(params){

    return new Promise(function(resolve, reject){

      let histA = params.histogramA || {};
      let histB = params.histogramB || {};

      let histogramMerged = {};

      const entityTypeArray = _.union(Object.keys(histA), Object.keys(histB));

      entityTypeArray.forEach(function(entityType){

        histogramMerged[entityType] = {};

        if (!histA[entityType] || histA[entityType] === undefined || histA[entityType] === null) { histA[entityType] = {}; }
        if (!histB[entityType] || histB[entityType] === undefined || histB[entityType] === null) { histB[entityType] = {}; }

        // console.log(chalkLog("histogramMerged | histA[entityType]: " + jsonPrint(histA[entityType])));
        // console.log(chalkLog("histogramMerged | histB[entityType]: " + jsonPrint(histB[entityType])));

        const entityArray = _.union(Object.keys(histA[entityType]), Object.keys(histB[entityType]));

        // console.log(chalkLog("histogramMerged | entityArray: " + entityArray));

        entityArray.forEach(function(e){

          let entity = e.trim();

          if (!entity || entity === "" || entity === " " || entity === null || entity === undefined || entity === "-") { return; }

          histogramMerged[entityType][entity] = 0;

          if (histA[entityType][entity] && histA[entityType][entity] !== undefined) {  histogramMerged[entityType][entity] += histA[entityType][entity]; }
          if (histB[entityType][entity] && histB[entityType][entity] !== undefined) {  histogramMerged[entityType][entity] += histB[entityType][entity]; }

          // console.log(chalkLog("histogramMerged | " + entityType + " | " + entity + ": " + histogramMerged[entityType][entity]));

        });

      });

      debug(chalkLog("histogramMerged\n" + jsonPrint(histogramMerged)));

      resolve(histogramMerged);

    });

  }
}