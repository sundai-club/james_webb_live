import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Particle } from '../types';

interface GalaxySimulationProps {
  initialData?: {
    particles: Particle[];
  };
}

// Add custom star shader
const starVertexShader = `
  attribute float size;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  void main() {
    vec2 center = gl_PointCoord * 2.0 - 1.0;
    float dist = length(center);
    
    // Create soft sphere effect
    float strength = 1.0 - smoothstep(0.0, 1.0, dist);
    
    // Add glow effect
    float glow = exp(-2.0 * dist);
    
    // Combine core and glow
    vec3 color = vColor;
    float alpha = strength * 0.8 + glow * 0.4;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// Adjust constants for spiral galaxy behavior
const FRICTION = 0.995;
const RANDOM_FORCE = 0.00002; // Reduced random force
const MAX_VELOCITY = 0.5; // Reduced max velocity
const FORCE_MULTIPLIER = 0.0002;
const MIN_ORBITAL_SPEED = 0.02;
const POSITION_MULTIPLIER = 10;
const SPIRAL_TIGHTNESS = 0.5; // Controls how tight the spiral arms are
const NUM_ARMS = 4; // Number of spiral arms

const GalaxySimulation: React.FC<GalaxySimulationProps> = ({ initialData }) => {
  const starsRef = useRef<THREE.Points>(null!);
  const particlesRef = useRef<THREE.Points>(null!);
  const particleVelocities = useRef<Float32Array | null>(null);

  const { stars, particles } = useMemo(() => {
    if (!initialData?.particles) {
      // Provide default empty arrays with proper types
      return {
        stars: [] as Particle[],
        particles: [] as Particle[]
      };
    }

    const stars: Particle[] = [];
    const particles: Particle[] = [];

    // Split particles and stars, ensure velocity exists
    initialData.particles.forEach(particle => {
      // Ensure particle has velocity, if not initialize with zeros
      const particleWithVelocity: Particle = {
        ...particle,
        velocity: particle.velocity || [0, 0, 0]
      };

      if (particle.type === 'star') {
        stars.push(particleWithVelocity);
      } else {
        particles.push(particleWithVelocity);
      }
    });

    return { stars, particles };
  }, [initialData]);

  const { starPositions, starColors, starSizes } = useMemo(() => {
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);

    stars.forEach((star, i) => {
      const i3 = i * 3;
      positions[i3] = star.position[0];
      positions[i3 + 1] = star.position[1];
      positions[i3 + 2] = star.position[2];

      const color = new THREE.Color(star.color);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // Vary star sizes based on mass
      sizes[i] = star.mass ? Math.min(2.0, Math.max(0.5, star.mass / 200)) : 1.0;
    });

    return { starPositions: positions, starColors: colors, starSizes: sizes };
  }, [stars]);

  const { particlePositions, particleColors, particleVels } = useMemo(() => {
    const positions = new Float32Array(particles.length * 3);
    const colors = new Float32Array(particles.length * 3);
    const velocities = new Float32Array(particles.length * 3);

    particles.forEach((particle, i) => {
      const i3 = i * 3;
      
      // Calculate spiral arm position
      const radius = Math.sqrt(
        particle.position[0] * particle.position[0] + 
        particle.position[2] * particle.position[2]
      );
      const angle = Math.atan2(particle.position[2], particle.position[0]);
      
      // Assign to spiral arm
      const armIndex = Math.floor(angle / (2 * Math.PI) * NUM_ARMS);
      const armAngle = (armIndex / NUM_ARMS) * Math.PI * 2;
      const spiralAngle = armAngle + (radius * SPIRAL_TIGHTNESS);
      
      // Add some random offset from perfect spiral
      const randomOffset = (Math.random() - 0.5) * 0.3;
      const finalAngle = spiralAngle + randomOffset;

      // Position
      positions[i3] = Math.cos(finalAngle) * radius;
      positions[i3 + 1] = particle.position[1] * 0.2; // Flatter galaxy
      positions[i3 + 2] = Math.sin(finalAngle) * radius;

      // Calculate orbital velocity tangent to the spiral
      const orbitalSpeed = Math.sqrt(0.1 / Math.max(0.5, radius));
      velocities[i3] = -Math.sin(finalAngle) * orbitalSpeed;
      velocities[i3 + 1] = 0;
      velocities[i3 + 2] = Math.cos(finalAngle) * orbitalSpeed;

      // Color based on radius (bluer in arms, redder in center)
      const normalizedRadius = Math.min(radius / 8, 1);
      colors[i3] = 0.8 - normalizedRadius * 0.5;     // Red (stronger in center)
      colors[i3 + 1] = 0.3 + normalizedRadius * 0.2; // Green
      colors[i3 + 2] = 0.2 + normalizedRadius * 0.6; // Blue (stronger in arms)
    });

    particleVelocities.current = velocities;
    return { particlePositions: positions, particleColors: colors, particleVels: velocities };
  }, [particles]);

  // Create custom star material
  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        scale: { value: 1 }
      },
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: true
    });
  }, []);

  useFrame((state, delta) => {
    if (!particlesRef.current || !starsRef.current || !particleVelocities.current) return;

    const starPositions = starsRef.current.geometry.attributes.position.array as Float32Array;
    const particlePos = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const velocities = particleVelocities.current;

    const cappedDelta = Math.min(delta, 0.016);

    // Update particles
    for (let i = 0; i < particles.length; i++) {
      const i3 = i * 3;
      
      const radius = Math.sqrt(
        particlePos[i3] * particlePos[i3] + 
        particlePos[i3 + 2] * particlePos[i3 + 2]
      );
      
      // Calculate tangential and radial forces
      let totalForceX = 0;
      let totalForceY = 0;
      let totalForceZ = 0;

      // Gravitational forces from stars
      for (let j = 0; j < stars.length; j++) {
        const j3 = j * 3;
        
        const dx = starPositions[j3] - particlePos[i3];
        const dy = starPositions[j3 + 1] - particlePos[i3 + 1];
        const dz = starPositions[j3 + 2] - particlePos[i3 + 2];
        
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        const distance = Math.sqrt(distanceSquared);
        
        if (distance > 0.1) {
          // Stronger central force, weaker outer forces
          const force = FORCE_MULTIPLIER * stars[j].mass / (distanceSquared * Math.sqrt(distance));
          
          // Add tangential component to maintain spiral structure
          const angle = Math.atan2(particlePos[i3 + 2], particlePos[i3]);
          const tangentialForce = force * 0.5; // Reduced tangential component
          
          totalForceX += (dx / distance) * force;
          totalForceY += (dy / distance) * force;
          totalForceZ += (dz / distance) * force;
          
          // Add spiral motion
          totalForceX += -Math.sin(angle) * tangentialForce;
          totalForceZ += Math.cos(angle) * tangentialForce;
        }
      }

      // Add very small random force
      totalForceX += (Math.random() - 0.5) * RANDOM_FORCE;
      totalForceY += (Math.random() - 0.5) * RANDOM_FORCE * 0.1; // Less vertical randomness
      totalForceZ += (Math.random() - 0.5) * RANDOM_FORCE;

      // Update velocities with forces
      velocities[i3] = velocities[i3] * FRICTION + totalForceX * cappedDelta;
      velocities[i3 + 1] = velocities[i3 + 1] * FRICTION + totalForceY * cappedDelta;
      velocities[i3 + 2] = velocities[i3 + 2] * FRICTION + totalForceZ * cappedDelta;

      // Stronger vertical damping to maintain disk shape
      velocities[i3 + 1] *= 0.98;

      // Update positions
      particlePos[i3] += velocities[i3] * cappedDelta * POSITION_MULTIPLIER;
      particlePos[i3 + 1] += velocities[i3 + 1] * cappedDelta * POSITION_MULTIPLIER;
      particlePos[i3 + 2] += velocities[i3 + 2] * cappedDelta * POSITION_MULTIPLIER;

      // Reset particles that go too far
      if (radius > 12) {
        // Reset to spiral arm
        const armIndex = Math.floor(Math.random() * NUM_ARMS);
        const armAngle = (armIndex / NUM_ARMS) * Math.PI * 2;
        const newRadius = 4 + Math.random() * 4;
        const spiralAngle = armAngle + (newRadius * SPIRAL_TIGHTNESS);
        const randomOffset = (Math.random() - 0.5) * 0.3;
        const finalAngle = spiralAngle + randomOffset;

        particlePos[i3] = Math.cos(finalAngle) * newRadius;
        particlePos[i3 + 1] = (Math.random() - 0.5) * 0.2;
        particlePos[i3 + 2] = Math.sin(finalAngle) * newRadius;

        // Reset velocity to follow spiral
        const orbitalSpeed = Math.sqrt(0.1 / Math.max(0.5, newRadius));
        velocities[i3] = -Math.sin(finalAngle) * orbitalSpeed;
        velocities[i3 + 1] = 0;
        velocities[i3 + 2] = Math.cos(finalAngle) * orbitalSpeed;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={stars.length}
            array={starPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={stars.length}
            array={starColors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={stars.length}
            array={starSizes}
            itemSize={1}
          />
        </bufferGeometry>
        <primitive object={starMaterial} attach="material" />
      </points>

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particles.length}
            array={particlePositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particles.length}
            array={particleColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.015}
          sizeAttenuation={true}
          vertexColors
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  );
};

export default GalaxySimulation;