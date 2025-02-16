import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateGalaxy(numParticles = 5000) {
  const particles = [{
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    color: [1, 0.6, 0.2],
    mass: 1000
  }];

  for (let i = 1; i < numParticles; i++) {
    const radius = Math.random() * 10;
    const angle = Math.random() * Math.PI * 2;
    const armOffset = Math.floor(Math.random() * 3) * (Math.PI * 2 / 3);
    const spiralAngle = angle + (radius * 2) + armOffset;
    
    const x = Math.cos(spiralAngle) * radius;
    const z = Math.sin(spiralAngle) * radius;
    const y = (Math.random() - 0.5) * 0.5;
    
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    const orbitalSpeed = 0.001 / Math.sqrt(Math.max(0.1, distanceFromCenter));
    const tangentialAngle = Math.atan2(z, x) + Math.PI / 2;
    
    const colorGradient = radius / 10;
    
    particles.push({
      position: [Number(x.toFixed(3)), Number(y.toFixed(3)), Number(z.toFixed(3))],
      velocity: [
        Number((Math.cos(tangentialAngle) * orbitalSpeed).toFixed(6)), 
        0, 
        Number((Math.sin(tangentialAngle) * orbitalSpeed).toFixed(6))
      ],
      color: [
        Number((1 - colorGradient * 0.7).toFixed(3)),
        Number((0.3 + colorGradient * 0.2).toFixed(3)),
        Number((0.2 + colorGradient * 0.6).toFixed(3))
      ],
      mass: 0.1
    });
  }

  return JSON.stringify({ particles }, null, 2);
}

const outputPath = join(dirname(__dirname), 'public', 'initial_galaxy.json');
const galaxyData = generateGalaxy();
writeFileSync(outputPath, galaxyData);