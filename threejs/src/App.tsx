import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import GalaxySimulation from './components/GalaxySimulation';
import LandingPage from './components/LandingPage';
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

  if (!showSimulation) {
    return <LandingPage onStartSimulation={handleStartSimulation} />;
  }

  return (
    <div className="app">
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 20, 20], fov: 45 }}>
          <color attach="background" args={['#000000']} />
          <GalaxySimulation initialData={galaxyData!} />
        </Canvas>
        <button 
          className="back-button"
          onClick={() => setShowSimulation(false)}
        >
          ← Back to Information
        </button>
      </div>
    </div>
  );
}

export default App;
