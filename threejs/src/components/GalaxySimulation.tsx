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

    stars.forEach((particle, i) => {
      const i3 = i * 3;
      positions[i3] = particle.position[0];
      positions[i3 + 1] = particle.position[1];
      positions[i3 + 2] = particle.position[2];

      const color = new THREE.Color(particle.color);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = particle.mass / 100;
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

  useFrame(() => {
    if (!orbitControlsRef.current) return;
    
    const controls = orbitControlsRef.current;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    
    // Adjust rotation constraints for side view
    controls.minPolarAngle = Math.PI / 3;    // About 60 degrees
    controls.maxPolarAngle = Math.PI * 2/3;  // About 120 degrees
    
    // Set the up vector to Z instead of Y
    controls.object.up.set(0, 0, 1);
    controls.update();
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
        position={[12, 0, 0]}
        up={[0, 0, 1]}
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
