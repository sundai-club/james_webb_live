import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '../types';

interface GalaxySimulationProps {
  initialData?: {
    particles: Particle[];
  };
}

// Update the star shaders for better appearance
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
    
    // Sharp circular cutoff with very soft edge
    float circle = 1.0 - smoothstep(0.7, 0.71, dist);
    
    // Simple radial falloff
    float intensity = circle * (1.0 - dist * dist);
    
    // Discard pixels outside the circle completely
    if (dist > 0.71) {
      discard;
    }
    
    gl_FragColor = vec4(vColor, intensity * 0.9); // 90% opacity (only 10% transparent)
  }
`;

const GalaxySimulation: React.FC<GalaxySimulationProps> = ({ initialData }) => {
  const starsRef = useRef<THREE.Points>(null!);
  const particlesRef = useRef<THREE.Points>(null!);
  const orbitControlsRef = useRef<any>(null);

  const { stars, particles } = useMemo(() => {
    if (!initialData) {
      return { stars: [], particles: [] };
    }

    const stars: Particle[] = [];
    const particles: Particle[] = [];

    // Split particles and stars
    initialData.particles.forEach(particle => {
      if (particle.type === 'star') {
        stars.push(particle);
      } else {
        particles.push(particle);
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

      // Calculate distance from center for color variation
      const distanceFromCenter = Math.sqrt(
        star.position[0] * star.position[0] + 
        star.position[2] * star.position[2]
      );
      const normalizedDistance = Math.min(distanceFromCenter / 8, 1);

      // Generate varied star colors based on position and randomness
      const temperature = Math.random();
      let color: THREE.Color;
      
      if (distanceFromCenter < 2) {
        // Center region: mostly yellow-white to orange
        if (temperature < 0.7) {
          // Yellower stars
          color = new THREE.Color().setHSL(0.15 + Math.random() * 0.05, 0.8, 0.7);
        } else {
          // Some orange-red stars
          color = new THREE.Color().setHSL(0.05 + Math.random() * 0.05, 0.9, 0.6);
        }
      } else if (distanceFromCenter < 4) {
        // Mid region: mix of colors
        if (temperature < 0.4) {
          // Blue stars
          color = new THREE.Color().setHSL(0.6 + Math.random() * 0.05, 0.8, 0.8);
        } else if (temperature < 0.7) {
          // White stars
          color = new THREE.Color().setHSL(0.2 + Math.random() * 0.1, 0.2, 0.95);
        } else {
          // Some red giants
          color = new THREE.Color().setHSL(0.05 + Math.random() * 0.05, 0.9, 0.6);
        }
      } else {
        // Outer region: more blue stars
        if (temperature < 0.6) {
          // Bright blue stars
          color = new THREE.Color().setHSL(0.6 + Math.random() * 0.05, 0.9, 0.9);
        } else if (temperature < 0.8) {
          // White-blue stars
          color = new THREE.Color().setHSL(0.5 + Math.random() * 0.1, 0.5, 0.9);
        } else {
          // Some white stars
          color = new THREE.Color().setHSL(0.2 + Math.random() * 0.1, 0.3, 0.9);
        }
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // Vary star sizes based on type and position
      let baseSize;
      if (distanceFromCenter < 2) {
        // Larger stars in center
        baseSize = star.mass ? Math.min(2.5, Math.max(1.0, star.mass / 150)) : 1.5;
      } else {
        // Smaller stars in arms, but some bright ones
        baseSize = star.mass ? Math.min(1.8, Math.max(0.4, star.mass / 200)) : 1.0;
        if (temperature > 0.95) {
          // Few very bright stars in arms
          baseSize *= 2;
        }
      }
      sizes[i] = baseSize;
    });

    return { starPositions: positions, starColors: colors, starSizes: sizes };
  }, [stars]);

  const { particlePositions, particleColors } = useMemo(() => {
    const positions = new Float32Array(particles.length * 3);
    const colors = new Float32Array(particles.length * 3);

    particles.forEach((particle, i) => {
      const i3 = i * 3;
      positions[i3] = particle.position[0];
      positions[i3 + 1] = particle.position[1];
      positions[i3 + 2] = particle.position[2];

      const color = new THREE.Color(particle.color);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    });

    return { particlePositions: positions, particleColors: colors };
  }, [particles]);

  // Update star material settings
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

  useFrame((state) => {
    if (!orbitControlsRef.current) return;
    
    // Add a gentle automatic rotation
    orbitControlsRef.current.autoRotateSpeed = 0.5;
    orbitControlsRef.current.autoRotate = true;
  });

  return (
    <>
      <OrbitControls 
        ref={orbitControlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={100}
      />
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