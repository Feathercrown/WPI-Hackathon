# WPI-Hackathon
A comprehensive game server that allows multiple types of clients to connect to turn-based board games!

# TODO
 - Create client framework v2
 - Update chess to allow castling and for the game to end
 - Name changing and accounts

# Maybe TODOs
 - Server.log and server.error instead of using console directly, to allow logging etc.? Potentially the server should act on different   errors automatically?
 - Game replays and archive?
 - Game lifecycle - ready up, set up, play!
 - Better error handling - crashes within a game should not be fatal to the server!

# List of potential client actions
 - Click and drag (eg. draggables)
 - Click (eg. buttons)
 - Click --> click (eg. click once to select, click again to fire)
 - Right click menu --> Option
 - Be able to set states that affect your available options? Eg. click and drag to move and set to "fire" state, then click anywhere to fire a weapon?
   - No; any states should instead be actions sent to the server?
 - Keypresses?? YES (eg. think of Into the Breach's control scheme)