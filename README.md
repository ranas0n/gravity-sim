# Gravity Sim

Some cool stuff, made with Three.js

## What it does

It's a little physics sandbox where you can toss celestial bodies into space and watch them orbit each other. The cool part is the spacetime grid underneath them - it bends and warps based on the masses, giving you a rough idea of how gravity might curve space. Not scientifically accurate, but it looks neat and feels intuitive.

## Tech stuff

Built with Three.js for the 3D rendering, TypeScript, and Vite. The physics is a straightforward n-body simulation using semi-implicit Euler integration - nothing fancy, but it's stable enough to make pretty orbits.

The curvature effect is just a visual trick - moving grid vertices toward the bodies based on their gravitational influence. I'm sure a real physicist would have words about it, but it captures the feeling I was going for.

## Files you might care about

- src/main.ts - entry point
- src/features/physics/ - the physics engine bits
- src/features/rendering/ - Three.js scene setup and all the visualizers
- src/domain/ - core types and state
- src/app/InitialState.ts - default setup