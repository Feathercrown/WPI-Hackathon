# WPI-Hackathon
Yet another GRID attempt, for the WPI Hackathon this time.

# TODO
Create client framework
Fix chess specifically
Create a text-based client
Name changing and accounts

# Maybe TODOs
Server.log and server.error instead of using console directly, to allow logging etc.? Potentially the server should act on different   errors automatically?
Game replays and archive?
Game lifecycle - ready up, set up, play!

# List of potential client actions
Click and drag (eg. draggables)
Click (eg. buttons)
Click --> click (eg. click once to select, click again to fire)
Right click menu --> Option
Be able to set states that affect your available options? Eg. click and drag to move and set to "fire" state, then click anywhere to fire a weapon?
- No; any states should instead be actions sent to the server?
Keypresses?? YES (eg. think of Into the Breach's control scheme)