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

  const handleGalaxySelect = async (source: string, data?: GalaxyData) => {
    if (source === 'initial') {
      try {
        const response = await fetch('/initial_galaxy.json');
        const data = await response.json();
        setGalaxyData(data);
      } catch (error) {
        console.error('Error loading initial galaxy:', error);
        alert('Failed to load initial galaxy configuration');
      }
    } else if (source === 'file' && data) {
      setGalaxyData(data);
    }
  };

  return (
    <div className="app-container">
      {!galaxyData ? (
        <GalaxySelector onSelect={handleGalaxySelect} />
      ) : (
        <>
          <Canvas camera={{ position: [0, 15, 15], fov: 60 }}>
            <color attach="background" args={['#000']} />
            <GalaxySimulation initialData={galaxyData} />
          </Canvas>
          <button 
            onClick={() => window.dispatchEvent(new Event('export-galaxy-data'))}
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              zIndex: 1000,
              background: '#333',
              color: 'white',
              border: '1px solid #666'
            }}
          >
            Export Galaxy Data
          </button>
          <button 
            onClick={() => setGalaxyData(null)}
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              zIndex: 1000,
              background: '#333',
              color: 'white',
              border: '1px solid #666'
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
