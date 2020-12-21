
# I Feel... (2017 redux)

An interactive digital artwork by [Jonathan Hogg][jh],
originally commissioned by [The Resilience Space][rs]

Copyright 2017 Jonathan Hogg. This work is licensed under the [Creative
Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc].

![CC BY-NC-SA 4.0](https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png)

In short, you're welcome to use, share and remix this artwork provided
that: you do not do so commercially; you acknowledge me as the original
artist; you mark clearly any derivative version and you apply the same license
to any such work. Note that my summary here is not a substitute for the [full
license text][cl].

If you wish to use this work outside of these terms, then please contact
me to discuss; you'll find contact details on [my website][jh].

[jh]: https://www.jonathanhogg.com/
[rs]: http://www.theresiliencespace.com/
[gh]: https://github.com/jonathanhogg/i-feel
[cc]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cl]: https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode

## Notes

- There are no external code dependencies. This code should work in a good
modern browser as-is. You should be able to [preview it right from raw
Github][rg].
- I wrote this back in 2012 as a commission for [The Resilience Space][rs].
The intention was to produce an interactive artwork that would make their
website a little different and reflect their mission of considering mental
health at work. This update mostly updates the code to use more recent
JavaScript syntax, fixes some bugs, removes some workarounds that are no
longer necessary as browsers have moved on, and makes the code completely
self-contained.
- Click anywhere to bring up the `MoodWheel` radial menu. If touch events
are available, then the mood wheel will respond to these and will alter its
display to better support a finger by pushing the mood names out of the way
so that they can be clearly read and selected.
- The `background-color` of the canvas container element is used to fade-out
the particle display while the mood wheel is active – this is done by drawing
an alpha-faded rectangle in this colour over the top of the particles before
the mood wheel is drawn. Firefox **hates** this and will slow the animation to
a ridiculous degree (seconds-per-frame). Avoid having a `background-color` on
the container if you want this to work in Firefox; see [my own website][jh] for
a hacky example of browser-specific CSS for this.
- Each spot is a `Particle`; a group of these particles is a `Firework`,
the behaviour and look of which is controlled by a `FireworkTraits` object -
these can be (and are) switched on-the-fly to cause a firework to transition
to a different type; the `FireworksDisplay` controls all of the fireworks;
a mood defines the different traits that will be chosen from at random and
how often the fireworks will change.
- The notional frame rate for animation is 20fps; however, a ratio is applied
to all calculated movements to support a variable animation rate. The code
actually attempts to target at least 40fps for the animation part of the
cycle, draw frames will be dropped if necessary to achieve this. If the draw
rate falls below 25fps then fireworks will be successively dropped from the
display. These values are constants at the top of `fireworks.js`.
- Add the `#stats` location hash to the URL to turn on display of animation
and draw rates, and firework and particle counts. Add the `#test` location
hash to switch to a special debugging mood that contains all of the different
firework types.
- All drawing is done in JavaScript with 2D canvas operations - there is no
use of external images. Drawing should be done at the native device pixel
density, but scaled to the CSS pixel size; so on a high resolution display
(such as an Apple retina display), the drawing should look crisp but will
retain the same overall look. Note that high resolution displays mean *much*
more pixel blitting, so your mileage may vary.
- The JavaScript should all be ES6-compliant except for use of the ES2017
module syntax. In the absence of a browser that supports ES modules one can
flatten the code with [Rollup][rl] or a similar tool. I'd include a rolled-up
version with a `nomodule` script tag, but browser support for this seems to
be a bit patchy.
- Do say hi - contact details on [my website][jh].

[rg]: https://rawgit.com/jonathanhogg/i-feel/main/feel.html
[rl]: https://github.com/rollup/rollup
