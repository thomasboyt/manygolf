massively multiplayer proceedurally-generated 2d golf in the style of trackmania

architecture
  - server 
    - generate level
    - send level to client
    - level is probably a SVG-like single line?
    - stub out with json file at start
  - client
    - render level data
    - on stroke input, send direction + power to server
  - universal code bits
    - calculating final position of ball/ball physics
