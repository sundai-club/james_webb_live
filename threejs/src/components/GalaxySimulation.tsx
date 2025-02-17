import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Slider } from '@react-three/drei';
import * as THREE from 'three';
import type { Particle } from '../types';
import { GPUParticleSystem } from '../utils/GPUParticleSystem';

interface GalaxySimulationProps {
  initialData?: {
    particles: Particle[];
  };
}

const GalaxySimulation: React.FC<GalaxySimulationProps> = ({ initialData }) => {
  const { gl } = useThree();
  const particleSystemRef = useRef<GPUParticleSystem | null>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const [gravityStrength, setGravityStrength] = useState(0.5);
  const [orbitalStrength, setOrbitalStrength] = useState(1.0);

  useEffect(() => {
    if (!initialData) return;

    particleSystemRef.current = new GPUParticleSystem(gl, initialData.particles);
    const points = particleSystemRef.current.getMesh();
    if (pointsRef.current) {
      pointsRef.current.geometry = points.geometry;
      pointsRef.current.material = points.material;
    }

    return () => {
      particleSystemRef.current?.dispose();
    };
  }, [initialData, gl]);

  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.setGravityStrength(gravityStrength);
    }
  }, [gravityStrength]);

  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.setOrbitalStrength(orbitalStrength);
    }
  }, [orbitalStrength]);

  useFrame((state, deltaTime) => {
    if (particleSystemRef.current) {
      particleSystemRef.current.update(deltaTime);
    }
  });

  const points = useMemo(() => {
    if (!initialData) return null;
    return new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.PointsMaterial()
    );
  }, [initialData]);

  if (!initialData || !points) return null;

  return (
    <>
      <primitive object={points} ref={pointsRef} />
      <group position={[-2, 2, 0]}>
        <Slider 
          value={gravityStrength}
          min={0}
          max={2}
          step={0.1}
          onChange={setGravityStrength}
          onPointerEnter={() => gl.domElement.style.cursor = 'pointer'}
          onPointerLeave={() => gl.domElement.style.cursor = 'default'}
        >
          Gravity Strength
        </Slider>
        <Slider 
          value={orbitalStrength}
          min={0}
          max={2}
          step={0.1}
          position={[0, -0.5, 0]}
          onChange={setOrbitalStrength}
          onPointerEnter={() => gl.domElement.style.cursor = 'pointer'}
          onPointerLeave={() => gl.domElement.style.cursor = 'default'}
        >
          Orbital Strength
        </Slider>
      </group>
    </>
  );
};

export default GalaxySimulation;
