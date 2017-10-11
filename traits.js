
/*
 * # I Feel... (2017 redux)
 *
 * An interactive digital artwork by [Jonathan Hogg][1],
 * originally commissioned by [The Resilience Space][2]
 *
 * Copyright 2017 Jonathan Hogg; all rights reserved. This source is provided
 * for study purposes only and may not be reproduced, modified or hosted
 * without permission.
 *
 * [1]: https://www.jonathanhogg.com/
 * [2]: http://www.theresiliencespace.com/
 *
 * ## traits.js
 *
 * This module defines named sets of parameters that describe the behaviour
 * and look of each type of firework.
 *
 */


import {choose, random, normal} from './utils.js';


const LARGE_SIZE = 55,
      SMALL_SIZE = 25;

const Patterns = {
    large_blue:      {color: '#0533ff', size: LARGE_SIZE},
    small_blue:      {color: '#0533ff', size: SMALL_SIZE},
    large_carnation: {color: '#f78ad8', size: LARGE_SIZE},
    small_carnation: {color: '#f78ad8', size: SMALL_SIZE},
    large_cyan:      {color: '#50fdff', size: LARGE_SIZE},
    small_cyan:      {color: '#50fdff', size: SMALL_SIZE},
    large_green:     {color: '#7dfa2e', size: LARGE_SIZE},
    small_green:     {color: '#7dfa2e', size: SMALL_SIZE},
    large_magenta:   {color: '#f540ff', size: LARGE_SIZE},
    small_magenta:   {color: '#f540ff', size: SMALL_SIZE},
    large_orange:    {color: '#f99300', size: LARGE_SIZE},
    small_orange:    {color: '#f99300', size: SMALL_SIZE},
    large_purple:    {color: '#952193', size: LARGE_SIZE},
    small_purple:    {color: '#952193', size: SMALL_SIZE},
    large_red:       {color: '#f62400', size: LARGE_SIZE},
    small_red:       {color: '#f62400', size: SMALL_SIZE},
    large_white:     {color: '#ffffff', size: LARGE_SIZE},
    small_white:     {color: '#ffffff', size: SMALL_SIZE},
    large_yellow:    {color: '#fffb00', size: LARGE_SIZE},
    small_yellow:    {color: '#fffb00', size: SMALL_SIZE},
};


class FireworkTraits
{
    constructor()
    {
        this.patterns = Object.values(Patterns);
        this.min_particles = 0;
        this.max_particles = 25;
        this.max_death_row = 100;
        this.rotational_speed = 0;
        this.speed = 0;
        this.randomness = 0.1;
        this.conformity = 0.1;
        this.particle_attraction = [];
        this.centre_attraction = [];
        this.particle_start_distance = [10];
        this.particle_start_theta = [];
        this.particle_start_theta_i = 0;
        this.particle_drag = 0.1;
        this.particle_creation_rate = 0;
        this.maturation_rate = 1;
        this.decay_rate = 1;
        this.particle_start_spin = [0];
        this.particle_start_drive = [0];
        this.brightness = 1;
    }

    adjust(current, target, jitter, frame_ratio)
    {
        return current + ((target-current)*this.conformity + jitter*this.randomness*normal()) * frame_ratio;
    }

    applyToFirework(firework, frame_ratio)
    {
        firework.number_of_particles = Math.max(this.min_particles, firework.number_of_particles + this.particle_creation_rate * frame_ratio);
        firework.speed = this.adjust(firework.speed, this.speed, this.speed*0.1, frame_ratio);
        firework.direction = this.adjust(firework.direction, firework.direction, 0.1, frame_ratio);
        firework.rotational_speed = this.adjust(firework.rotational_speed, this.rotational_speed, this.rotational_speed*0.1, frame_ratio);
        firework.brightness = this.adjust(firework.brightness, this.brightness, this.brightness*0.1, frame_ratio);
    }

    newParticleArgs()
    {
        let distance = choose(this.particle_start_distance),
            theta = this.particle_start_theta.length == 0 ? random(0, 2*Math.PI)
                     : this.particle_start_theta[this.particle_start_theta_i++ % this.particle_start_theta.length],
            pattern = choose(this.patterns), x = distance*Math.cos(theta), y = distance*Math.sin(theta),
            direction = this.particle_start_theta.length == 0 ? random(0, 2*Math.PI) : theta,
            spin = choose(this.particle_start_spin), drive = choose(this.particle_start_drive);

        return [pattern, x, y, direction, spin, drive];
    }
}

export class Flame extends FireworkTraits
{
    constructor()
    {
        super();
        this.patterns = [choose([Patterns.large_magenta, Patterns.large_orange, Patterns.large_red])];
        this.speed = 2;
        this.particle_attraction = [5];
        this.centre_attraction = [-30, 0, -0.01];
        this.particle_creation_rate = 1;
        this.maturation_rate = 5;
        this.decay_rate = 10;
        this.randomness = 0.25;
    }
}

export class Burst extends FireworkTraits
{
    constructor()
    {
        super();
        this.max_particles = 50;
        this.speed = 2;
        this.centre_attraction = [-10];
        this.particle_creation_rate = 0.25;
        this.maturation_rate = 5;
        this.particle_start_distance = [1];
        this.particle_start_spin = [-0.1, 0.1];
        this.particle_start_drive = [0.1];
        this.conformity = 0.05;
    }
}

export class Virus extends FireworkTraits
{
    constructor()
    {
        super();
        this.patterns = choose([[Patterns.large_cyan], [Patterns.large_orange]]);
        this.min_particles = 10;
        this.rotational_speed = 0.01;
        this.speed = 2.0;
        this.particle_attraction = [choose([-1, -2, -3])];
        this.centre_attraction = [0, 0, 0.01];
        this.particle_creation_rate = 0.05;
    }

    applyToFirework(firework, frame_ratio)
    {
        let n = (performance.now() % 900);
        this.centre_attraction = [0, 0, n < 150 ? 0 : (n < 300 ? 0.02 : 0.01)];
        super.applyToFirework(firework, frame_ratio);
    }
}

export class Ring extends FireworkTraits
{
    constructor()
    {
        super();
        this.patterns = [Patterns.large_blue];
        this.min_particles = 20;
        this.max_particles = 24;
        this.rotational_speed = -0.02;
        this.speed = 1.5;
        this.particle_attraction = [-1];
        this.centre_attraction = [0, -10, 0.1];
        this.particle_creation_rate = 0.05;
        this.particle_start_distance = [100];
        this.maturation_rate = 2;
        this.decay_rate = 2;
        this.conformity = 0.2;
    }

    applyToFirework(firework, frame_ratio)
    {
        let n = (performance.now() % 2000);
        this.centre_attraction = [0, n < 100 ? -13.5 : (n > 350 && n < 550 ? -14.4 : -15), 0.15];
        this.brightness = n < 300 ? 1.0 : 0.5;
        super.applyToFirework(firework, frame_ratio);
    }
}

export class BlackDeath extends FireworkTraits
{
    constructor()
    {
        super();
        this.max_particles = 0;
        this.speed = 10;
    }
}

export class BlackHole extends FireworkTraits
{
    constructor()
    {
        super();
        this.max_particles = 0;
        this.centre_attraction = [0, 1];
    }
}

export class Snow extends FireworkTraits
{
    constructor()
    {
        super();
        this.patterns = [Patterns.large_white, Patterns.small_white];
        this.centre_attraction = [-20];
        this.speed = 1;
        this.particle_creation_rate = 0.025;
        this.particle_start_distance = [50, 100, 125, 150, 175, 200, 225, 250, 275, 300];
        this.particle_start_spin = [-0.2, -0.1, 0.1, 0.2];
        this.particle_start_drive = [0.05, 0.1, 0.15, 0.2];
    }
}

export class WhiteHole extends Snow
{
    constructor()
    {
        super();
        this.centre_attraction = [0, 2];
        this.rotational_speed = 0.05;
        this.particle_creation_rate = 0.3;
        this.particle_start_distance = [300];
        this.maturation_rate = 5;
        this.decay_rate = 5;
    }
}

export class Swarm extends FireworkTraits
{
    constructor()
    {
        super();
        this.patterns = [Patterns.large_orange, Patterns.large_orange, Patterns.large_orange, Patterns.large_orange,
                         Patterns.large_red, Patterns.large_red, Patterns.large_yellow, Patterns.small_blue];
        this.centre_attraction = choose([[-1000], [], [-1, 10]]);
        this.particle_attraction = [-10, 0, 0.001];
        this.speed = 5;
        this.particle_creation_rate = 0.2;
        this.particle_start_spin = [-0.5, -0.25, 0.25, 0.5];
        this.particle_start_drive = [1, 2, 3, 4, 5];
        this.randomness = 0.5;
    }
}

export class Crackler extends FireworkTraits
{
    constructor()
    {
        super();
        this.patterns = [Patterns.large_white, Patterns.small_white, Patterns.large_carnation, Patterns.small_carnation];
        this.max_particles = 100;
        this.rotational_speed = choose([-0.005, -0.0025, 0.0025, 0.005])
        this.speed = 1;
        this.particle_start_distance = [50, 100, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400,
                                        425, 450, 475, 500];
        this.particle_creation_rate = 2;
        this.maturation_rate = 20;
        this.decay_rate = 20;
        this.particle_start_drive = [0, 0.05, 0.1];
    }
}

export class Streaker extends FireworkTraits
{
    constructor()
    {
        super();
        this.min_particles = 25;
        this.max_particles = 50;
        this.speed = 20;
        this.particle_start_distance = [1];
        this.particle_creation_rate = 0.5;
        this.centre_attraction = [0, 0, 0.01];
        this.maturation_rate = 5;
        this.decay_rate = 10;
        this.particle_start_drive = [0, 0, 0, 0, 0.1, 0.2];
    }
}

export class Explosion extends FireworkTraits
{
    constructor()
    {
        super();
        this.max_particles = 0;
        this.speed = 1;
        this.centre_attraction = [0, -1];
        this.decay_rate = 0.5;
    }
}

export class Rose extends FireworkTraits
{
    constructor()
    {
        super();
        this.patterns = [Patterns.large_magenta, Patterns.large_carnation, Patterns.large_carnation,
                         Patterns.large_white, Patterns.large_purple];
        this.max_particles = 50;
        this.particle_creation_rate = 1;
        this.particle_start_theta = [0, Math.PI*0.4, Math.PI*0.8, Math.PI*1.2, Math.PI*1.6];
        this.particle_start_spin = [-0.085];
        this.particle_start_drive = [0.5];
        this.speed = 1;
        this.rotational_speed = 0.025;
        this.decay_rate = 10;
        this.maturation_rate = 5;
    }
}

export class Galaxy extends FireworkTraits
{
    constructor()
    {
        super();
        this.patterns = [Patterns.large_white, Patterns.large_yellow, Patterns.large_orange];
        this.max_particles = 50;
        this.particle_creation_rate = 0.5;
        this.particle_start_theta = [0, Math.PI];
        this.particle_start_distance = [0];
        this.particle_start_spin = [0.01, 0.017, 0.03];
        this.particle_start_drive = [0.15];
        this.speed = 1;
        this.rotational_speed = -0.01;
    }
}

export class Stars extends FireworkTraits
{
    constructor()
    {
        super();
        this.max_particles = 10;
        this.patterns = [Patterns.small_white, Patterns.small_yellow, Patterns.small_orange];
        this.particle_start_distance = [50, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350];
        this.particle_creation_rate = 0.1;
    }
}

export class RedMist extends FireworkTraits
{
    constructor()
    {
        super();
        this.max_particles = 60;
        this.patterns = [Patterns.small_red, Patterns.large_red, Patterns.large_red, Patterns.large_purple];
        this.particle_start_distance = [100, 150, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450];
        this.particle_creation_rate = 0.5;
        this.particle_start_spin = [-1, 1];
        this.speed = 1;
        this.conformity = 0.2;
        this.base_brightness = 0.5;
        this.peak_brightness = 0.75;
        this.rotational_speed = choose([-0.002, 0, 0.002]);
        this.rate = random(490, 510);
        this.decay_rate = 2;
    }

    applyToFirework(firework, frame_ratio)
    {
        this.brightness = (performance.now() % this.rate) < 250 ? this.base_brightness : this.peak_brightness;
        super.applyToFirework(firework, frame_ratio);
    }
}

export class RedFist extends RedMist
{
    constructor()
    {
        super();
        this.max_particles = 40;
        this.centre_attraction = [0, 0, .05];
        this.particle_attraction = [-5];
        this.base_brightness = 0.25;
        this.peak_brightness = 1;
        this.speed = 5;
        this.rotational_speed = choose([-0.002, 0, 0.002]);
        this.rate = 500;
    }
}

export class RedPissed extends RedMist
{
    constructor()
    {
        super();
        this.max_particles = 25;
        this.centre_attraction = [-1000];
        this.rotational_speed = choose([-0.002, 0, 0.002]);
        this.rate = random(490, 510);
    }
}

export class GreenBlob extends FireworkTraits
{
    constructor()
    {
        super();
        this.patterns = [Patterns.large_green, Patterns.large_green, Patterns.large_cyan];
        this.min_particles = 25;
        this.max_particles = 50;
        this.particle_creation_rate = 0.1;
        this.particle_start_distance = [50, 75, 100, 125, 150];
        this.centre_attraction = [-150, 0, 0.12];
        this.particle_attraction = [0.5, 0, -0.002];
        this.particle_start_drive = [0, 0.1, 0.25, 0.5, 0.75, 1, 1.25, 2];
        this.particle_start_spin = [-0.01, 0, 0.01];
        this.speed = 1;
        this.rotational_speed = choose([-0.01, 0, 0.01]);
        this.decay_rate = 2;
        this.start = performance.now();
    }

    applyToFirework(firework, frame_ratio)
    {
        let n = (performance.now() - this.start) % 500;
        this.centre_attraction = n > 350 ? [-300, 0, 0.12] : [-150, 0, 0.12];
        super.applyToFirework(firework, frame_ratio);
    }
}

export class Bawble extends FireworkTraits
{
    constructor()
    {
        super();
        this.patterns = [Patterns.small_white, Patterns.small_cyan, Patterns.small_white,
                         choose([Patterns.large_green, Patterns.large_magenta, Patterns.large_magenta, Patterns.large_blue])];
        this.min_particles = 20;
        this.max_particles = 50;
        this.rotational_speed = choose([-0.01, 0.01]);
        this.speed = 3;
        this.particle_attraction = [-3];
        this.centre_attraction = [0, 0, 0.05];
        this.particle_creation_rate = 0.1;
        this.particle_start_spin = [-0.2, -0.1, 0.05, 0.15];
        this.particle_start_drive = [0, 0, 0, 0, 2];
        this.maturation_rate = 10;
        this.particle_start_distance = [1];
    }

    applyToFirework(firework, frame_ratio)
    {
        let n = (performance.now() % 1000);
        this.centre_attraction = [0, 0, n < 150 ? 0.045 : 0.05];
        super.applyToFirework(firework, frame_ratio);
    }
}

export class DeadDuck extends FireworkTraits
{
    constructor()
    {
        super();
        this.max_particles = 0;
        this.randomness = 0;
        this.conformity = 0;
    }
}

