import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import GalaxySimulation from './components/GalaxySimulation';
import LandingPage from './components/LandingPage';
import GalaxyInfo from './components/GalaxyInfo';
import type { Particle } from './types';
import './styles/App.css';
import './styles/LandingPage.css';

interface GalaxyData {
  particles: Particle[];
}

function App() {
  const [showSimulation, setShowSimulation] = useState(false);
  const [galaxyData, setGalaxyData] = useState<GalaxyData | null>(null);

  const handleStartSimulation = async () => {
    try {
      const response = await fetch('/initial_galaxy.json');
      const initialData = await response.json();
      setGalaxyData(initialData);
      setShowSimulation(true);
    } catch (error) {
      console.error('Error loading initial galaxy:', error);
      alert('Failed to load galaxy configuration');
    }
  };

  return (
    <div className="app">
      {showSimulation ? (
        <>
          <div className="canvas-container">
            <Canvas camera={{ position: [12, 4, 8], fov: 45 }}>
              <color attach="background" args={['#000000']} />
              <GalaxySimulation initialData={galaxyData!} />
            </Canvas>
          </div>
          <button 
            className="back-button"
            onClick={() => setShowSimulation(false)}
          >
            ← Back to Information
          </button>
          <GalaxyInfo />
        </>
      ) : (
        <LandingPage onStartSimulation={handleStartSimulation} />
      )}
    </div>
  );
}

export default App;
