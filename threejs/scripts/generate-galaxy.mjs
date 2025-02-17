// @ts-check
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @typedef {[number, number, number]} Vector3 */

/** 
 * Converts RGB values (0-1) to hex color string
 * @param {number} r - Red (0-1)
 * @param {number} g - Green (0-1)
 * @param {number} b - Blue (0-1)
 * @returns {string} Hex color string
 */
function rgbToHex(r, g, b) {
  const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** 
 * @typedef {Object} Particle
 * @property {Vector3} position
 * @property {string} color - hex color string
 * @property {number} mass
 * @property {'star' | 'particle'} type
 * @property {Vector3} [velocity]
 */

/**
 * Calculates initial velocity for a particle based on its position and the nearest star's position
 * @param {Vector3} position - Particle position
 * @param {Vector3} starPos - Nearest star position
 * @returns {Vector3} Initial velocity vector
 */
function calculateInitialVelocity(position, starPos) {
  const dx = position[0] - starPos[0];
  const dz = position[2] - starPos[2];
  const dist = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);
  const orbitalSpeed = 0.2 / Math.sqrt(Math.max(0.1, dist));
  
  return [
    -Math.sin(angle) * orbitalSpeed,
    0,
    Math.cos(angle) * orbitalSpeed
  ];
}

/** 
 * @param {number} [numStars]
 * @param {number} [numParticles]
 * @returns {{ particles: Particle[] }}
 */
function generateGalaxy(numStars = 1000, numParticles = 100000) {
  /** @type {Particle[]} */
  const particles = [];
  
  // Ensure total particle count is a perfect square for texture
  const textureSize = Math.ceil(Math.sqrt(numStars + numParticles));
  const totalParticles = textureSize * textureSize;
  numParticles = totalParticles - numStars;

  // Generate stars in a spiral pattern with multiple arms
  const numArms = 3;
  const armOffsetMax = 0.5;
  const spiralTightness = 0.8;

  for (let i = 0; i < numStars; i++) {
    const radius = 2 + Math.random() * 6;
    const armIndex = Math.floor(i / (numStars / numArms));
    const baseAngle = (i / (numStars / numArms)) * Math.PI * 2;
    const armOffset = armIndex * ((2 * Math.PI) / numArms);
    const spiralOffset = radius * spiralTightness;
    
    const randomOffset = (Math.random() - 0.5) * armOffsetMax;
    const angle = baseAngle + armOffset + spiralOffset + randomOffset;
    
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = (Math.random() - 0.5) * 0.2;

    // Star color based on temperature (mass)
    const temperature = 0.5 + Math.random() * 0.5; // 0.5-1.0
    const color = rgbToHex(
      1.0,
      0.7 + (temperature * 0.3),
      0.4 + (temperature * 0.6)
    );
    
    particles.push({
      position: [Number(x.toFixed(3)), Number(y.toFixed(3)), Number(z.toFixed(3))],
      color,
      mass: 80 + temperature * 120, // Mass between 80-200
      type: 'star'
    });
  }

  // Generate particles with colors based on their arm and distance
  for (let i = 0; i < numParticles; i++) {
    const nearestStar = Math.floor(Math.random() * numStars);
    const starPos = particles[nearestStar].position;
    
    const radius = 0.5 + Math.random() * 12;
    const angle = Math.random() * Math.PI * 2;
    const armIndex = Math.floor((angle / (Math.PI * 2)) * numArms);
    
    const spiralTightness = 1.5;
    const spiralAngle = angle + (radius * spiralTightness);
    
    const x = Math.cos(spiralAngle) * radius + starPos[0] * 0.2;
    const z = Math.sin(spiralAngle) * radius + starPos[2] * 0.2;
    const y = (Math.random() - 0.5) * 0.5;
    
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    const normalizedRadius = distanceFromCenter / 15;
    
    // Color based on arm and distance
    let color;
    switch (armIndex % numArms) {
      case 0: // Blue arm
        color = rgbToHex(
          0.4 + normalizedRadius * 0.4,
          0.5 + normalizedRadius * 0.3,
          0.8 + normalizedRadius * 0.2
        );
        break;
      case 1: // Red arm
        color = rgbToHex(
          0.8 + normalizedRadius * 0.2,
          0.3 + normalizedRadius * 0.3,
          0.3 + normalizedRadius * 0.2
        );
        break;
      default: // Purple arm
        color = rgbToHex(
          0.6 + normalizedRadius * 0.3,
          0.3 + normalizedRadius * 0.2,
          0.7 + normalizedRadius * 0.3
        );
    }
    
    const velocity = calculateInitialVelocity([x, y, z], starPos);
    
    particles.push({
      position: [Number(x.toFixed(3)), Number(y.toFixed(3)), Number(z.toFixed(3))],
      velocity: velocity.map(v => Number(v.toFixed(6))),
      color,
      mass: 0.1,
      type: 'particle'
    });
  }

  return { particles };
}

const outputPath = join(dirname(__dirname), 'public', 'initial_galaxy.json');
const galaxyData = generateGalaxy();
writeFileSync(outputPath, JSON.stringify(galaxyData, null, 2));