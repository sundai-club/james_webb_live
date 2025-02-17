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
 */

/** 
 * @param {number} [numStars]
 * @param {number} [numParticles]
 * @returns {{ particles: Particle[] }}
 */
function generateGalaxy(numStars = 50, numParticles = 5000) {
  /** @type {Particle[]} */
  const particles = [];
  
  // Generate massive stars first
  for (let i = 0; i < numStars; i++) {
    const radius = Math.random() * 8;
    const angle = (i / numStars) * Math.PI * 2;
    const armOffset = Math.floor(i % 3) * (Math.PI * 2 / 3);
    const spiralAngle = angle + (radius * 0.5) + armOffset;
    
    const x = Math.cos(spiralAngle) * radius;
    const z = Math.sin(spiralAngle) * radius;
    const y = (Math.random() - 0.5) * 0.2;
    
    particles.push({
      position: [Number(x.toFixed(3)), Number(y.toFixed(3)), Number(z.toFixed(3))],
      color: rgbToHex(1, 1, Math.random() * 0.5), // Bright white to yellowish color
      mass: 100 + Math.random() * 200,
      type: 'star'
    });
  }

  // Generate light particles
  for (let i = 0; i < numParticles; i++) {
    const radius = Math.random() * 10;
    const angle = Math.random() * Math.PI * 2;
    const nearestStar = Math.floor(Math.random() * numStars);
    const starPos = particles[nearestStar].position;
    
    const armOffset = Math.floor(Math.random() * 3) * (Math.PI * 2 / 3);
    const spiralAngle = angle + (radius * 2) + armOffset;
    
    const x = Math.cos(spiralAngle) * radius + starPos[0] * 0.3;
    const z = Math.sin(spiralAngle) * radius + starPos[2] * 0.3;
    const y = (Math.random() - 0.5) * 0.5;
    
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    
    // Color calculation based on radius and arm
    const normalizedRadius = radius / 10;
    const armIndex = Math.floor((spiralAngle / (Math.PI * 2)) * 3);
    
    let color;
    switch(armIndex % 3) {
      case 0:
        color = rgbToHex(
          0.5 + normalizedRadius * 0.5,
          0.5 + normalizedRadius * 0.5,
          0.8 + normalizedRadius * 0.2
        );
        break;
      case 1:
        color = rgbToHex(
          0.8 + normalizedRadius * 0.2,
          0.4 + normalizedRadius * 0.4,
          0.3 + normalizedRadius * 0.2
        );
        break;
      default:
        color = rgbToHex(
          0.6 + normalizedRadius * 0.4,
          0.3 + normalizedRadius * 0.4,
          0.7 + normalizedRadius * 0.3
        );
    }
    
    particles.push({
      position: [Number(x.toFixed(3)), Number(y.toFixed(3)), Number(z.toFixed(3))],
      color: color,
      mass: 0.1,
      type: 'particle'
    });
  }

  return { particles };
}

const outputPath = join(dirname(__dirname), 'public', 'initial_galaxy.json');
const galaxyData = generateGalaxy();
writeFileSync(outputPath, JSON.stringify(galaxyData, null, 2));