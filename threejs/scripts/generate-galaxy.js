import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateGalaxy(numStars = 100, numParticles = 5000) {
  const stars = [];
  const particles = [];

  // Generate central supermassive black hole
  stars.push({
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    mass: 100000,  // Increased central mass
    type: 'star'
  });

  // Generate stars in spiral arms
  const numArms = 4; // 4 spiral arms like in the image
  for (let i = 0; i < numStars; i++) {
    const arm = Math.floor(Math.random() * numArms);
    const radius = 1 + Math.random() * 6; // Start from radius 1
    const armOffset = (arm * Math.PI * 2) / numArms;
    const randomOffset = (Math.random() - 0.5) * 0.3; // Spread within arm
    const spiralTightness = 0.5;
    const spiralAngle = armOffset + (radius * spiralTightness) + randomOffset;
    
    const x = Math.cos(spiralAngle) * radius;
    const z = Math.sin(spiralAngle) * radius;
    const y = (Math.random() - 0.5) * 0.1; // Very flat galaxy
    
    // Circular orbital velocity (v = sqrt(GM/r))
    const orbitSpeed = Math.sqrt(0.1 / radius);
    
    stars.push({
      position: [Number(x.toFixed(3)), Number(y.toFixed(3)), Number(z.toFixed(3))],
      velocity: [
        Number((-Math.sin(spiralAngle) * orbitSpeed).toFixed(6)),
        0,
        Number((Math.cos(spiralAngle) * orbitSpeed).toFixed(6))
      ],
      mass: 20 + Math.random() * 30, // Reduced star mass
      type: 'star'
    });
  }

  // Generate particles following the spiral arms
  for (let i = 0; i < numParticles; i++) {
    const arm = Math.floor(Math.random() * numArms);
    const radius = 0.5 + Math.random() * 8; // Particles can be closer to center
    const armOffset = (arm * Math.PI * 2) / numArms;
    const randomOffset = (Math.random() - 0.5) * 0.5; // More spread for particles
    const spiralTightness = 0.5;
    const spiralAngle = armOffset + (radius * spiralTightness) + randomOffset;
    
    const x = Math.cos(spiralAngle) * radius;
    const z = Math.sin(spiralAngle) * radius;
    const y = (Math.random() - 0.5) * 0.2;
    
    // Slightly slower orbital velocity for particles
    const orbitSpeed = Math.sqrt(0.08 / radius);
    
    // Color based on radius and arm
    const colorGradient = radius / 8;
    const blueGradient = Math.min(0.8, colorGradient); // More blue in outer regions
    
    particles.push({
      position: [Number(x.toFixed(3)), Number(y.toFixed(3)), Number(z.toFixed(3))],
      velocity: [
        Number((-Math.sin(spiralAngle) * orbitSpeed).toFixed(6)),
        0,
        Number((Math.cos(spiralAngle) * orbitSpeed).toFixed(6))
      ],
      color: [
        Number((0.8 - colorGradient * 0.4).toFixed(3)),  // Red decreases outward
        Number((0.3 + colorGradient * 0.2).toFixed(3)),  // Some green for yellow core
        Number((0.2 + blueGradient).toFixed(3))          // Blue increases outward
      ],
      mass: 0.001,  // Much smaller mass
      type: 'particle'
    });
  }

  return JSON.stringify({ 
    stars,
    particles 
  }, null, 2);
}

const outputPath = join(dirname(__dirname), 'public', 'initial_galaxy.json');
const galaxyData = generateGalaxy();
writeFileSync(outputPath, galaxyData);