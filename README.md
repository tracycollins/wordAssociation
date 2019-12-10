# wordAssociation
This is the top-lever server. NOTE: wordAssoClient is not longer used

### MODULES:
 #### main directory
 - **wordAssoServer.js**: server for https://word.threeceelabs.com. Runs on Google Cloud
 - **session.js**:           main client node/js; runs in browser
 - **sessionModular.html**:  main client html; runs in browser
 - **controlPanel.html**:    client controlPanel. Update data viz params, as well as update database users & hashtags
 #### js/libs
 - **sessionViewTreePack.js**  client data viz javascript. Implemented with d3.js
 - **controlPanel.js**:        client controlPanel javascript
 - **tfeChild.js**:            server twitter user db utility and nn categorizer
 - **dbuChild.js**:            server database utility
 - **tssChild.js**:            server twitter streaming interface
 - **tweetParser.js**:         server tweet data parser
    
