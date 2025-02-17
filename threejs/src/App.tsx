import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import GalaxySimulation from './components/GalaxySimulation';
import LandingPage from './components/LandingPage';
import type { Particle } from './types';
import './styles/App.css';
import './styles/LandingPage.css';
import GalaxyVisualization, { Point } from './components/GalaxyVisualization';

interface GalaxyData {
  particles: Particle[];
}

function App() {
  const [showSimulation, setShowSimulation] = useState(false);
  const [galaxyData, setGalaxyData] = useState<GalaxyData | null>(null);
  const [points, setPoints] = useState<Point[]>([]);

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

  const handleStartData = async () => {
    try {
      const response = await fetch('/initial_galaxy.json');
      const initialData = await response.json();
      setPoints(initialData.particles);

    } catch (error) {
      console.error('Error loading initial galaxy:', error);
      alert('Failed to load galaxy configuration');
    }
  };

  if (!showSimulation) {
    return <LandingPage onStartSimulation={handleStartSimulation} />;
  }

  if (points.length > 0) {
    return (
      <div className="app">
        <div className="canvas-container">
          <GalaxyVisualization particles={points} />
          <button 
            className="back-button"
            onClick={() => setShowSimulation(false)}
          >
            ← Back to Information
          </button>
          <button
            className="data-button"
            onClick={handleStartData}
          >
            Show Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="canvas-container">
        <Canvas camera={{ position: [12, 4, 8], fov: 45 }}>
          <color attach="background" args={['#000000']} />
          <GalaxySimulation initialData={galaxyData!} />
        </Canvas>
        <button 
          className="back-button"
          onClick={() => setShowSimulation(false)}
        >
          ← Back to Information
        </button>
        <button
          className="data-button"
          onClick={handleStartData}
        >
          Show Data
        </button>
      </div>
    </div>
  );
}

export default App;
