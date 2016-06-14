const msgs = [
  {
    time: 0,
    msg: {"type":"initial","data":{"gameState":0,"self":{"id":2,"color":"#b74bed","name":"Amazing Backspin"},"isObserver":false,"players":[{"id":2,"color":"#b74bed","name":"Amazing Backspin","position":[46,184.5],"velocity":[0,0]}],"level":{"points":[[0,191],[36,187],[56,187],[97,151],[129,177],[150,207],[169,207],[186,207],[234,172],[264,192],[283,228],[310,228],[349,237],[395,209],[427,209],[444,209],[472,203],[508,234],[546,234],[568,239],[586,239],[600,208]],"hole":[577,239],"spawn":[46,187],"color":"red"},"expiresIn":34218,"time":1465512947084}},
  },
  {
    time: 200,
    msg: {
      "type":"levelOver",
      "data": {
        "expTime": Date.now() + 6000,
        "roundRankedPlayers": [
          {"id":2,"color":"#b74bed","name":"Amazing Backspin","strokes":4,"scoreTime":33627,"prevPoints":20,"addedPoints":10, scored: true},
          {"id":3,"color":"#b74bed","name":"Fred Goodatgolf","strokes":4,"scoreTime":33627,"prevPoints":50,"addedPoints":8, scored: true},
          {"id":7,"color":"#b74bed","name":"asdfadsfads asdfdasf","strokes":4,"scoreTime":33627,"prevPoints":500,"addedPoints":6, scored: true},
          {"id":9,"color":"#b74bed","name":"garbage text","strokes":4,"scoreTime":33627,"prevPoints":20,"addedPoints":4, scored: true},
          {"id":5,"color":"#b74bed","name":"blah foo","strokes":4,"scoreTime":33627,"prevPoints":10,"addedPoints":0, scored: false},
        ]
      }
    }
  }
];

export default msgs;