
/*
 * # I Feel... (2017 redux)
 *
 * An interactive digital artwork by [Jonathan Hogg][1],
 * originally commissioned by [The Resilience Space][2]
 *
 * Copyright 2017 Jonathan Hogg. This work is licensed under the [Creative
 * Commons Attribution-NonCommercial-ShareAlike 4.0 International License][3].
 *
 * [1]: https://www.jonathanhogg.com/
 * [2]: http://www.theresiliencespace.com/
 * [3]: http://creativecommons.org/licenses/by-nc-sa/4.0/
 *
 * ## moods.js
 *
 * This module defines the combinations of firework traits that represent each 
 * "mood". It also contains the logic for the radial menu that is used to 
 * select a mood.
 *
 */


import {wrap} from './utils.js';
import {Flame, Virus, Ring, Swarm, Rose, Galaxy, RedFist, GreenBlob, Bawble, BlackHole, BlackDeath,
        WhiteHole, Streaker, Burst, Explosion, Crackler, Stars, Snow, RedMist, RedPissed} from './traits.js';


const FADE_TIME    = 250,
      DISMISS_TIME = 10000;

const Angry      = { title: "angry",      stability: 200, traits: [RedMist, RedFist, RedPissed] },
      Wired      = { title: "wired",      stability: 100, traits: [Swarm] },
      Brilliant  = { title: "brilliant",  stability: 900, traits: [Crackler] },
      Anxious    = { title: "anxious",    stability: 300, traits: [GreenBlob] },
      Happy      = { title: "happy",      stability: 100, traits: [Streaker, Burst, Burst, Explosion] },
      Frustrated = { title: "frustrated", stability:  50, traits: [Flame, Flame, Flame, Explosion] },
      Attractive = { title: "attractive", stability: 500, traits: [Galaxy, Galaxy, Stars, Stars, Stars, BlackHole] },
      InLove     = { title: "in love",    stability: 500, traits: [Rose, Rose, Crackler, Explosion] },
      Focused    = { title: "focused",    stability: 900, traits: [Virus] },
      Fine       = { title: "fine",       stability: 900, traits: [Bawble] },
      Relaxed    = { title: "relaxed",    stability: 500, traits: [Ring] },
      Isolated   = { title: "isolated",   stability: 500, traits: [Snow] },
      Depressed  = { title: "depressed",  stability: 500, traits: [Snow, WhiteHole] },
      Broken     = { title: "broken",     stability: 500, traits: [Snow, BlackDeath] };


export const DefaultMood = { title: "...", traits: [Flame, Virus, Ring, Swarm, Rose, Galaxy, RedFist, GreenBlob, Bawble],
                             stability: 500, max_fireworks: 3 };

export const TestMood = { title: "testy",
                          traits: [Flame, Virus, Ring, Swarm, Rose, Galaxy, RedFist, GreenBlob, Bawble,
                                   Streaker, Burst, Explosion, Crackler, Stars, Snow, RedMist, RedPissed],
                          stability: 200 };

export const AllMoods = [Angry, Wired, Brilliant, Anxious, Happy, Frustrated, Attractive,
                         InLove, Focused, Fine, Relaxed, Isolated, Depressed, Broken];


export class MoodWheel
{
    constructor(mood, x, y, style, touch_identifier)
    {
        this.current = mood;
        this.x = x;
        this.y = y;
        this.style = style;
        this.touch_identifier = touch_identifier;
        this.push = this.touch_identifier != undefined;
        this.allow_sticky = this.touch_identifier == undefined;
        this.moods = AllMoods;
        this.px = x;
        this.py = y;
        this.begin = performance.now();
        this.sticky = false;
        this.closing = false;
        this.selection = null;
        this.strength = 0;
        this.theta_start = 0.8*Math.PI,
        this.theta_step = 1.4*Math.PI / (this.moods.length - 1);
    }

    down(x, y)
    {
        if (!this.closing)
            this.sticky = false;
        else
        {
            this.closing = false;
            this.sticky = false;
            this.begin = this.end;
            this.x = x;
            this.y = y;
            this.selection = null;
        }
    }

    move(x, y)
    {
        if (!this.closing)
        {
            this.px = x;
            this.py = y;

            let dx = this.px - this.x, dy = this.py - this.y,
                distance = Math.sqrt(dx*dx + dy*dy),
                theta = Math.atan2(dy, dx) - this.theta_start + this.theta_step/2,
                p = Math.floor(wrap(theta, 2*Math.PI) / this.theta_step);

            if (p >= 0 && p < this.moods.length)
            {
                this.strength = Math.max(0, Math.min((distance > 150 ? 200-distance : distance-25)/50, 1));
                if (this.strength > 0)
                {
                    this.selection = this.moods[p];
                    let now = performance.now();
                    if (now-this.begin > FADE_TIME)
                        this.begin = now - FADE_TIME;
                    return;
                }
            }
            this.selection = null;
            this.strength = 0;
        }
    }

    up(x, y)
    {
        if (this.allow_sticky && performance.now()-this.begin < FADE_TIME)
        {
            this.sticky = true;
            return true;
        }
        this.closing = true;
        this.end = performance.now() + FADE_TIME;
        return false;
    }

    dismiss()
    {
        this.selection = null;
        this.closing = true;
        this.end = performance.now() + FADE_TIME;
    }

    draw(context, width, height)
    {
        const now = performance.now();
        if (!this.closing && now-this.begin > DISMISS_TIME)
        {
            this.selection = null;
            this.closing = true;
            this.end = now + FADE_TIME;
        }
        else if (this.closing && now > this.end)
            return true;

        const alpha = Math.max(0, Math.min((this.closing ? this.end-now : now-this.begin) / FADE_TIME, 1)),
              color            = this.style.getPropertyValue('color'),
              background_color = this.style.getPropertyValue('background-color'),
              font_family      = this.style.getPropertyValue('font-family'),
              font_weight      = this.style.getPropertyValue('font-weight');

        context.save();
        context.globalAlpha = 0.667 * alpha;
        context.fillStyle = background_color;
        context.fillRect(0, 0, width, height);

        context.translate(this.x, this.y);
        context.fillStyle = color;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.shadowBlur = 5;
        context.shadowColor = background_color;
        let theta = this.theta_start;
        for (let mood of this.moods)
        {
            let offset = 75;
            if (this.push)
            {
                for (offset = 60; offset < 100; offset++)
                {
                    let tx = this.x + offset*Math.cos(theta), ty = this.y + offset*Math.sin(theta),
                        dx = tx - this.px, dy = ty - this.py, d = dx*dx + dy*dy;
                    if (d > 2500)
                        break;
                }
            }

            const font_size = Math.round(offset / 3.75);
            context.save();
            context.rotate(theta);
            context.translate(offset, 0);
            context.globalAlpha = alpha * (mood == this.selection ? 1 : 1 - this.strength*0.75)
            context.font = mood == this.current ? "bold " + font_size + "px " + font_family
                                                : font_weight + " " + font_size + "px " + font_family;
            if (theta < 1.5*Math.PI)
            {
                context.translate(context.measureText(mood.title).width, 0);
                context.rotate(Math.PI);
            }
            context.fillText(mood.title, 0, 5);
            context.restore();
            theta += this.theta_step;
        }
        context.restore();
        return false;
    }
}

