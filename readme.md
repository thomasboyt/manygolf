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
  - netcode, if you can call it that
    - when user hits ball, power+direction is sent to server
    - server sends power+direction+ball ID to all users
    - client runs physics simulation on all balls in real-time to render them
    - server runs physics simulation in real-time to determine if you hit it into the hole

protocol
  - server events
    - ball hit
      - ID
      - velocity
      - direction
    - ball in goal
      - ID
    - ball fell off side of world (reset)
      - ID
  - client events
    - ball hit
      - velocity
      - direction
    - disconnect?
