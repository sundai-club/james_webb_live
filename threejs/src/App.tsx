import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import GalaxySimulation from './components/GalaxySimulation';
import GalaxySelector from './components/GalaxySelector';
import './App.css';

interface GalaxyData {
  particles: {
    position: [number, number, number];
    velocity: [number, number, number];
    color: [number, number, number];
    mass: number;
  }[];
}

function App() {
  const [galaxyData, setGalaxyData] = useState<GalaxyData | null>(null);

  const handleGalaxySelect = async (source: string) => {
    if (source === 'initial') {
      try {
        const response = await fetch('/initial_galaxy.json');
        const data = await response.json();
        setGalaxyData(data);
      } catch (error) {
        console.error('Error loading initial galaxy:', error);
        alert('Failed to load initial galaxy configuration');
      }
    }
  };

  return (
    <div className="app-container">
      {!galaxyData ? (
        <GalaxySelector onSelect={handleGalaxySelect} />
      ) : (
        <>
          <Canvas camera={{ position: [0, 20, 20], fov: 45 }}>
            <color attach="background" args={['#000']} />
            <GalaxySimulation initialData={galaxyData} />
          </Canvas>          
          <button 
            onClick={() => setGalaxyData(null)}
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              zIndex: 1000,
              background: '#333',
              color: 'white',
              border: '1px solid #666',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            Back to Selection
          </button>
        </>
      )}
    </div>
  );
}

export default App;
