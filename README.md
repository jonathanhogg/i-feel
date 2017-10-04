
# I Feel... (2017 redux)

An interactive digital artwork by [Jonathan Hogg][1],
originally commissioned by [The Resilience Space][2]

Copyright 2017 Jonathan Hogg; all rights reserved. This source is provided
for study purposes only and may not be reproduced, modified or hosted
without permission.

If you see this code anywhere other than [my website][1] or [on Github][3]
then please let me know.

[1]: https://www.jonathanhogg.com/
[2]: http://www.theresiliencespace.com/
[3]: https://github.com/jonathanhogg/feel

## Notes

- There are no external code dependencies. This code should work in a good
modern browser as-is.
- I wrote this back in 2012 as a commission for [The Resilience Space][2].
The intention was to produce an interactive artwork that would make their
website a little different and reflect their mission of considering mental
health at work. This update mostly updates the code to use more recent
JavaScript syntax, fixes some bugs, removes some workarounds that are no
longer necessary as browsers have moved on, and makes the code completely
self-contained.
- Click anywhere to bring up the `MoodWheel` radial menu.
- If touch events are available, then the mood wheel will respond to these
and will alter its display to better support a finger by pushing the mood
names out of the way so that they can be clearly read and selected.
- Each spot is a `Particle`; a group of these particles is a `Firework`,
the behaviour and look of which is controlled by a `FireworkTraits` object -
these can be (and are) switched on-the-fly to cause a firework to transition
to a different type; the `FireworksDisplay` controls all of the fireworks;
a mood defines the different traits that will be chosen from at random and
how often the fireworks will change.
- The notional frame rate for animation is 20fps; however, a ratio is applied
to all calculated movements to support a variable animation rate. The code
actually attempts to target at least 50fps for the animation part of the
cycle, draw frames will be dropped if necessary to achieve this. If the draw
rate falls below 20fps then fireworks will be successively dropped from the
display. These values are constants at the top of `fireworks.js`.
- Add the `#stats` location hash to the URL to turn on display of animation
and draw rates, and firework and particle counts.
- Add the `#test` location hash to switch to a special debugging mood that
contains all of the different firework types.
- All drawing is done in JavaScript with 2D canvas operations - there is no
use of external images.
- The JavaScript should all be ES6-compliant except for use of the ES2017 
module syntax. In the absence of a browser that supports ES modules one can
flatten the code with [Rollup][4] or a similar tool. I'd include a rolled-up
version with a `nomodule` script tag, but browser support for this seems to
be a bit patchy.
- Do say hi - contact details on [my website][1].

[4]: https://github.com/rollup/rollup

