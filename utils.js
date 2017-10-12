
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
 * ## utils.js
 *
 * This module defines some utility functions and classes.
 *
 */


export function random(min, max)
{
    return Math.random() * (max-min) + min;
}

export function normal()
{
    return Math.sqrt(-2*Math.log(Math.random())) * Math.cos(2*Math.PI*Math.random())
}

export function choose(xs)
{
    return xs[Math.floor(random(0, xs.length-0.001))];
}

export function wrap(i, n)
{
    return i < 0 ? (i % n) + n : i % n;
}


export class FrameCounter
{
    constructor(depth=20)
    {
        this.max_depth = depth;
        this.frame_times = [];
        this.depth = 0;
        this.last_time = undefined;
        this.average_interval = undefined;
        this.frame_rate = undefined;
        this.full = false;
    }

    push(time)
    {
        if (this.full)
            this.frame_times.shift();
        else
            this.full = ++this.depth == this.max_depth;
        this.frame_times.push(time);
        if (this.depth > 1)
        {
            this.average_interval = (this.frame_times[this.depth-1] - this.frame_times[0]) / (this.depth-1)
            this.frame_rate = 1000 / this.average_interval;
        }
        this.last_time = time;
    }

    test(time)
    {
        if (this.depth > 0)
            return 1000 / (time - this.frame_times[0]) * this.depth;
        return undefined;
    }

    reset()
    {
        this.frame_times = [];
        this.depth = 0;
        this.last_time = undefined;
        this.average_interval = undefined;
        this.frame_rate = undefined;
        this.full = false;
    }
}


export class Color
{
    static fromHex(hex)
    {
        if (hex[0] == '#')
            hex = hex.substr(1);
        let n = Number.parseInt(hex, 16);
        switch (hex.length)
        {
            case 3:
                return new Color((n >> 8) * 17, ((n >> 4) & 0xf) * 17, (n & 0xf) * 17);
            case 6:
                return new Color(n >> 16, (n >> 8) & 0xff, n & 0xff);
            case 8:
                return new Color(n >> 24, (n >> 16) & 0xff, (n >> 8) & 0xff, (n & 0xff) / 255);
        }
        throw "Unrecognised hex color";
    }

    constructor(r=0, g=0, b=0, a=1)
    {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    toString()
    {
        return "rgba(" + this.r.toString() + "," + this.g.toString() + "," + this.b.toString() + "," + this.a.toString() + ")";
    }

    red(r)
    {
        return new Color(r, this.g, this.b, this.a);
    }

    green(g)
    {
        return new Color(this.r, g, this.b, this.a);
    }

    blue(b)
    {
        return new Color(this.r, this.g, b, this.a);
    }

    alpha(a)
    {
        return new Color(this.r, this.g, this.b, a);
    }
}

