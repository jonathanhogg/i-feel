
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
 * ## fireworks.js
 *
 * This module contains the bulk of the physics and drawing engines.
 *
 */


import {choose, random, wrap, FrameCounter, Color} from './utils.js';
import {DeadDuck} from './traits.js';
import * as moods from './moods.js';


const TARGET_ANIMATION_RATE    = 40,
      DECENT_DRAW_RATE         = 30,
      ACCEPTABLE_DRAW_RATE     = 25,
      NOTIONAL_ANIMATION_RATE  = 20,
      FIREWORK_CHANGE_INTERVAL = 5000,
      PIXELS_PER_FIREWORK      = 300**2;


class Particle
{
    initialize(pattern, x, y, direction, spin, drive)
    {
        this.pattern = pattern;
        this.x = x;
        this.y = y;
        this.x_speed = 0;
        this.y_speed = 0;
        this.direction = direction;
        this.spin = spin;
        this.drive = drive;
        this.age = 0;
    }

    static createImage(size, color)
    {
        if (!('_cache' in Particle.constructor))
        {
            Particle.constructor._cache = new Map();
        }
        let bySize = Particle.constructor._cache.get(color);
        if (bySize == undefined)
        {
            bySize = new Map();
            Particle.constructor._cache.set(color, bySize);
        }
        if (!bySize.has(size))
        {
            let h = size/2, canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            let context = canvas.getContext('2d'),
                gradient = context.createRadialGradient(h, h, 0, h, h, h);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, Color.fromHex(color).alpha(0));
            context.fillStyle = gradient;
            context.globalAlpha = 0.5;
            context.fillRect(0, 0, size, size);
            gradient = context.createRadialGradient(h, h, 0, h, h, h);
            gradient.addColorStop(0, 'rgb(255,255,255)');
            gradient.addColorStop(0.2, 'rgba(255,255,255,0.75)');
            gradient.addColorStop(0.4, 'rgba(255,255,255,0)');
            context.globalAlpha = 0.75;
            context.fillStyle = gradient;
            context.fillRect(0, 0, size, size);
            let image = new Image();
            image.src = canvas.toDataURL();
            bySize.set(size, image);
        }
        return bySize.get(size);
    }

    get size()
    {
        return this.pattern.size;
    }

    draw(context, x, y, scale)
    {
        const image = Particle.createImage(this.pattern.size*scale, this.pattern.color);
        context.drawImage(image, x, y, this.pattern.size, this.pattern.size);
    }
}


class Firework
{
    constructor(traits, x, y, direction)
    {
        this.traits = traits;
        this.x = x;
        this.y = y;
        this.theta = direction;
        this.direction = direction;
        this.speed = 0;
        this.rotational_speed = 0;
        this.number_of_particles = 0;
        this.particles = [];
        this.death_row = [];
        this.recycling_bin = [];
        this.brightness = 1;
    }

    get is_empty()
    {
        return this.particles.length == 0 && this.death_row.length == 0;
    }

    update(frame_ratio, width, height)
    {
        const traits = this.traits;

        this.x = wrap(this.x + Math.cos(this.direction) * this.speed * frame_ratio, width);
        this.y = wrap(this.y + Math.sin(this.direction) * this.speed * frame_ratio, height);
        this.theta = wrap(this.theta + this.rotational_speed * frame_ratio, 2*Math.PI);

        traits.applyToFirework(this, frame_ratio);

        const n = Math.floor(this.number_of_particles);
        while (this.particles.length < n)
        {
            let particle = this.recycling_bin.length > 0 ? this.recycling_bin.shift() : new Particle();
            particle.initialize(...this.traits.newParticleArgs());
            this.particles.push(particle);
        }
        while (this.particles.length > traits.max_particles)
        {
            this.death_row.push(this.particles.shift());
            this.number_of_particles -= 1;
        }

        const maturation_rate = traits.maturation_rate * frame_ratio;
        for (let particle of this.particles)
        {
            particle.x += particle.x_speed * frame_ratio;
            particle.y += particle.y_speed * frame_ratio;
            particle.age = Math.min(particle.age + maturation_rate, 100);
        }
        const decay_rate = traits.decay_rate * frame_ratio;
        for (let particle of this.death_row)
        {
            particle.x += particle.x_speed * frame_ratio;
            particle.y += particle.y_speed * frame_ratio;
            particle.age = Math.max(particle.age - decay_rate, 0);
        }
        while (this.death_row.length > 0 && (this.death_row[0].age == 0 ||
                                             this.death_row.length > traits.max_death_row))
        {
            let rubbish = this.death_row.shift();
            if (this.recycling_bin.length < 100)
                this.recycling_bin.push(rubbish);
        }
    }

    recalculate(frame_ratio)
    {
        const np = this.particles.length, nd = this.death_row.length, npd = np + nd,
              pcoeffs = this.traits.particle_attraction, ccoeffs = this.traits.centre_attraction,
              drag = 1 - this.traits.particle_drag * frame_ratio;
        for (let i = 0; i < npd; i++)
        {
            let particle = i < np ? this.particles[i] : this.death_row[i-np], age = particle.age;
            if (age > 0)
            {
                let x_speed = particle.x_speed, y_speed = particle.y_speed,
                    x = particle.x, y = particle.y, force;
                if (pcoeffs.length > 0)
                {
                    let age_ratio = age / 10000 * frame_ratio;
                    for (let j = i+1; j < npd; j++)
                    {
                        let force, other = j < np ? this.particles[j] : this.death_row[j-np], other_age = other.age;
                        if (other_age > 0)
                        {
                            let xd = other.x - x, yd = other.y - y, sqrdist = xd*xd + yd*yd;
                            switch (pcoeffs.length)
                            {
                                case 1:
                                    force = pcoeffs[0]/sqrdist;
                                    break;
                                case 2:
                                    force = pcoeffs[0]/sqrdist + pcoeffs[1]/Math.sqrt(sqrdist);
                                    break;
                                case 3:
                                    force = pcoeffs[0]/sqrdist + pcoeffs[1]/Math.sqrt(sqrdist) + pcoeffs[2];
                            }
                            force *= other_age * age_ratio;
                            let xdf = xd * force, ydf = yd * force;
                            x_speed += xdf;
                            y_speed += ydf;
                            other.x_speed -= xdf;
                            other.y_speed -= ydf;
                        }
                    }
                }
                if (ccoeffs.length > 0)
                {
                    let force, sqrdist = x*x + y*y;
                    switch (ccoeffs.length)
                    {
                        case 1:
                            force = ccoeffs[0]/sqrdist;
                            break;
                        case 2:
                            force = ccoeffs[0]/sqrdist + ccoeffs[1]/Math.sqrt(sqrdist);
                            break;
                        case 3:
                            force = ccoeffs[0]/sqrdist + ccoeffs[1]/Math.sqrt(sqrdist) + ccoeffs[2];
                    }
                    force *= age / 100.0 * frame_ratio;
                    x_speed -= x * force;
                    y_speed -= y * force;
                }
                if (particle.drive != 0)
                {
                    let drive = particle.drive * frame_ratio;
                    x_speed += Math.cos(particle.direction) * drive;
                    y_speed += Math.sin(particle.direction) * drive;
                    particle.direction += wrap(particle.spin * frame_ratio, 2*Math.PI);
                }
                particle.x_speed = x_speed * drag;
                particle.y_speed = y_speed * drag;
            }
        }
    }

    draw(context, width, height, scale)
    {
        context.save();
        const np = this.particles.length, nd = this.death_row.length, npd = np + nd,
              fx = this.x, fy = this.y, cos = Math.cos(this.theta), sin = Math.sin(this.theta),
              brightness = this.brightness / 100;
        for (let i = 0; i < npd; i++)
        {
            let particle = i < np ? this.particles[i] : this.death_row[i-np], age = particle.age;
            if (age > 0)
            {
                let x = particle.x, y = particle.y, size = particle.size, half_size = size/2,
                    xt = wrap(fx + x*cos - y*sin, width) - half_size,
                    yt = wrap(fy + x*sin + y*cos, height) - half_size;
                context.globalAlpha = age * brightness;
                let xo = xt < 0 ? xt + width : (xt > width - size ? xt - width : 0),
                    yo = yt < 0 ? yt + height : (yt > height - size ? yt - height : 0);
                particle.draw(context, xt, yt, scale);
                if (xo != 0)
                    particle.draw(context, xo, yt, scale);
                if (yo != 0)
                {
                    particle.draw(context, xt, yo, scale);
                    if (xo != 0)
                        particle.draw(context, xo, yo, scale);
                }
            }
        }
        context.restore();
        return npd;
    }
}


export class FireworksDisplay
{
    constructor(container_id, mood_display_id)
    {
        this.container = document.getElementById(container_id);
        this.mood_display = document.getElementById(mood_display_id);
        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('style', 'width: 100%; height: 100%; padding: 0; margin: 0;');
        this.context = this.canvas.getContext('2d');

        const width = this.container.clientWidth, height = this.container.clientHeight;
        this.scale = window.devicePixelRatio;
        this.width = width;
        this.height = height;
        this.max_fireworks = Math.ceil(width*height / PIXELS_PER_FIREWORK);
        this.show_stats = false;
        this.wheel = null;
        this.canvas.width = this.width * this.scale;
        this.canvas.height = this.height * this.scale;
        this.container.appendChild(this.canvas);
        this.fireworks = [];
        this.dying_fireworks = [];
        this.animation_counter = new FrameCounter();
        this.drawing_counter = new FrameCounter();
        this.mood = moods.DefaultMood;
        this.mood_display.innerHTML = this.mood.title;
        this.addFirework();

        if ('ontouchstart' in window)
        {
            this.canvas.addEventListener('touchstart', (e) => this.wheel_touch_start(e));
            this.canvas.addEventListener('touchmove', (e) => this.wheel_touch_move(e));
            this.canvas.addEventListener('touchend', (e) => this.wheel_touch_end(e));
            this.canvas.addEventListener('touchcancel', (e) => this.wheel_touch_cancel(e));
        }
        else
        {
            this.canvas.addEventListener('mousedown', (e) => this.wheel_down(e));
            this.canvas.addEventListener('mousemove', (e) => this.wheel_move(e));
            this.canvas.addEventListener('mouseup', (e) => this.wheel_up(e));
        }

        this.debugControl();
        window.addEventListener('hashchange', () => this.debugControl());

        this.loop();
    }

    hideInterface()
    {
        if (this.wheel)
            this.wheel.dismiss();
    }

    changeMood(title)
    {
        if (this.wheel)
            this.wheel.dismiss();

        if (!title)
        {
            this.mood = moods.DefaultMood;
            this.mood_display.innerHTML = this.mood.title;
            return;
        }

        for (let mood of moods.AllMoods)
        {
            if (mood.title == title)
            {
                this.mood = mood;
                this.mood_display.innerHTML = this.mood.title;
                return;
            }
        }
    }

    debugControl()
    {
        var hash = window.location.hash;
        switch (hash)
        {
            case "#stats":
                this.show_stats = true;
                break;

            case "#nostats":
                this.show_stats = false;
                break;

            case "#test":
                this.mood = moods.TestMood;
                this.mood_display.innerHTML = this.mood.title;
                break;
        }
    }

    addFirework()
    {
        let width = this.width, height = this.height;
        let firework = new Firework(new (choose(this.mood.traits))(),
                                    random(width*0.25, width*0.75),
                                    random(height*0.25, height*0.75),
                                    random(0, 2*Math.PI));
        firework.mood = this.mood;
        this.fireworks.push(firework);
        this.last_firework_time = performance.now();
    }

    dropFirework()
    {
        let firework = this.fireworks.shift();
        firework.traits = new DeadDuck();
        this.dying_fireworks.push(firework);
        this.last_firework_time = performance.now();
    }

    async loop()
    {
        let dropped_last_frame = false;
        while (true)
        {
            await new Promise(requestAnimationFrame);

            let now = performance.now(),
                delta = this.animation_counter.depth > 0 ? now - this.animation_counter.last_time : 1000 / NOTIONAL_ANIMATION_RATE,
                frame_ratio = Math.min(1, delta / 1000 * NOTIONAL_ANIMATION_RATE);
            if (delta > 500 || (this.animation_counter.depth > 5 && delta > 5*this.animation_counter.average_interval))
            {
                this.animation_counter.reset();
                this.drawing_counter.reset();
            }
            this.animation_counter.push(now);
            this.doAnimation(frame_ratio);

            now = performance.now();
            let drawing_rate = this.drawing_counter.test(now);
            if (!dropped_last_frame && drawing_rate > ACCEPTABLE_DRAW_RATE && this.animation_counter.frame_rate < TARGET_ANIMATION_RATE)
            {
                dropped_last_frame = true;
            }
            else
            {
                dropped_last_frame = false;
                this.drawing_counter.push(now);
                this.doDrawing();
            }

            if (this.drawing_counter.full)
            {
                let num_fireworks = this.fireworks.length + this.dying_fireworks.length,
                    max_fireworks = this.mood.max_fireworks ? Math.min(this.max_fireworks, this.mood.max_fireworks) : this.max_fireworks;

                if (now > this.last_firework_time + FIREWORK_CHANGE_INTERVAL)
                {
                    if (num_fireworks > max_fireworks || (num_fireworks > 1 && drawing_rate < ACCEPTABLE_DRAW_RATE))
                    {
                        this.dropFirework();
                    }
                    else if (num_fireworks < max_fireworks && drawing_rate > DECENT_DRAW_RATE)
                    {
                        this.addFirework();
                    }
                }
            }
        }
    }

    doAnimation(frame_ratio)
    {
        for (let firework of this.fireworks)
        {
            var stability = firework.mood == this.mood ? this.mood.stability : 50,
                change = random(0, stability / frame_ratio);
            if (change <= 1)
            {
                firework.traits = new (choose(this.mood.traits))();
                firework.mood = this.mood;
            }

            firework.update(frame_ratio, this.width, this.height);
            firework.recalculate(frame_ratio);
        }
        for (let firework of this.dying_fireworks)
        {
            firework.update(frame_ratio, this.width, this.height);
            firework.recalculate(frame_ratio);
        }
    }

    doDrawing()
    {
        let canvas = this.canvas,
            context = this.context,
            fireworks = this.fireworks,
            dying_fireworks = this.dying_fireworks,
            width = this.container.clientWidth,
            height = this.container.clientHeight;
        this.scale = window.devicePixelRatio;
        this.width = width;
        this.height = height;
        this.max_fireworks = Math.ceil(width*height / PIXELS_PER_FIREWORK);
        if (canvas.width != width*this.scale || canvas.height != height*this.scale)
        {
            canvas.width = width * this.scale;
            canvas.height = height * this.scale;
        }

        context.save();
        context.scale(this.scale, this.scale);
        context.clearRect(0, 0, width, height);

        let firework_count = 0, particle_count = 0;
        context.globalCompositeOperation = 'lighter';
        for (let firework of fireworks)
        {
            particle_count += firework.draw(context, width, height, this.scale);
            firework_count++;
        }
        for (let firework of dying_fireworks)
        {
            particle_count += firework.draw(context, width, height, this.scale);
            firework_count++;
        }
        while (dying_fireworks.length > 0 && dying_fireworks[0].is_empty)
            dying_fireworks.shift();

        context.globalCompositeOperation = 'source-over';

        if (this.show_stats)
        {
            let x = 50, y = height - 30;
            let text = "Animation rate: " + Math.round(this.animation_counter.frame_rate) 
                     + " fps; draw rate: " + Math.round(this.drawing_counter.frame_rate) 
                     + " fps; fireworks: " + firework_count + " (" + particle_count + " particles)";

            let style = window.getComputedStyle(this.container);
            context.save();
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
            context.shadowBlur = 3;
            context.shadowColor = style['background-color'] || style['backgroundColor'];
            let font = (style['font-weight'] || style['fontWeight']) + " 12px " + (style['font-family'] || style['fontFamily']);
            context.font = font;
            context.fillStyle = style['color'];
            context.fillText(text, x, y);
            context.restore();
        }

        if (this.wheel && this.wheel.draw(context, width, height))
        {
            if (this.wheel.selection != null && this.wheel.strength > 0.5)
            {
                this.mood = this.wheel.selection;
                this.mood_display.innerHTML = this.mood.title;
            }
            this.wheel = null;
        }

        context.restore();
    }

    wheel_down(e)
    {
        if (this.wheel)
            this.wheel.down(e.clientX, e.clientY);
        else
        {
            let style = window.getComputedStyle(this.container);
            this.wheel = new moods.MoodWheel(this.mood, e.clientX, e.clientY, style);
        }
    }

    wheel_move(e)
    {
        if (this.wheel)
            this.wheel.move(e.clientX, e.clientY);
    }

    wheel_up(e)
    {
        if (this.wheel)
            this.wheel.up(e.clientX, e.clientY);
    }

    wheel_touch_start(e)
    {
        if (!this.wheel && e.targetTouches.length == 1 && e.changedTouches.length == 1 &&
            e.targetTouches[0].identifier == e.changedTouches[0].identifier)
        {
            e.preventDefault();
            let touch = e.targetTouches[0],
                style = window.getComputedStyle(this.container);
            this.wheel = new moods.MoodWheel(this.mood, touch.clientX, touch.clientY, style, touch.identifier);
        }
    }

    wheel_touch_move(e)
    {
        if (this.wheel)
            for (let touch of e.changedTouches)
            {
                if (touch.identifier == this.wheel.touch_identifier)
                {
                    e.preventDefault();
                    this.wheel.move(touch.clientX, touch.clientY);
                    return;
                }
            }
    }

    wheel_touch_end(e)
    {
        if (this.wheel)
            for (let touch of e.changedTouches)
            {
                if (touch.identifier == this.wheel.touch_identifier)
                {
                    e.preventDefault();
                    this.wheel.up(touch.clientX, touch.clientY);
                    return;
                }
            }
    }

    wheel_touch_cancel(e)
    {
        if (this.wheel)
            for (let touch of e.changedTouches)
            {
                if (touch.identifier == this.wheel.touch_identifier)
                {
                    e.preventDefault();
                    this.wheel.dismiss();
                    return;
                }
            }
    }
}

