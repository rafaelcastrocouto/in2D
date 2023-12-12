#in2D gamedev notes

light 2d offline framework to develop games and ai (eg playcanvas)

  * light enough to run on low non gpu devices (like pico8, js13k etc)
  * super intuitive wysiwyg basic tools, singleton editor and file export
  * free with paid pro plan to: use host service, serve the game on a pretty url, add to the store

  2d physics, quadtrees, pathfind, keyframe animation, camera,
  responsive gui, control and user input, state helpers, etc

    1 pixel (sprites (images with layers), dom canvas api convert all to webp)
      image editor (paint, phostoshop, aseprite), (draw textures for units, weapons, map assets, etc)
    2 vector (ui and units with properties, create html document, svg)
      element editor (corel, cad, godot basic node2d use) (ui and edit properties and sprites)
    3 level (maps and tiles) (pre baked grids - ortho hex, tri) 
      map editor with tools for procedural generation (place and control units, pathfind, etc),
    4 rules (predefined rules for game modding)
      war3 inspired rules editor (event-condition-action scheme)
    5 time (timeline with keyframes easing tools)
      easy animation control (like flash or godot animationNode)
    6 flow (linked nodes like blender or unity visal script editor - visual coding with nodes) 
      audio, ai and complex rules https://docs.unity3d.com/Packages/com.unity.visualscripting@1.7/manual/vs-nodes-reference.html
    7 code (files editor like codepen + shadertory)
      zip filetree and custom editor (acejs)
    8 share (integration with git services github gitlab butbucket huggingface)
      auto deploy and share link (sia gitpages) https://itch.io/game/new

  export to single html file, pro allow binaries on server side with deno
  shared reference list and console with auto complete and debug tools
  provide tutorials with trained neural networks (brain.js)
  multiplayer p2p with blockchain inspired security (https://github.com/foxql/peer)
  own store with games, mods, assets, hosting plans, etc. (multiplayer central hub)

develop a very simple concept example game that would require some of the features
filter what goes on embeded from what's on the "user file", make tutorials

repeat until the basic features are mature
test out the security, scalabilty and any issues of ther multiplayer system
optimize trained ai to be part of the game bundle

main purpose: allow a new dev to quickly make the game they want *specially with ai

1st iteration: vertical squares avoid game
2nd iteration: maze and enemy paths
3rd iteration: physics and multiplayer
