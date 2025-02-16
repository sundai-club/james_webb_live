import React from 'react';
import './App.css';

const App: React.FC = () => {
  const handleLaunchParticles = () => {
    window.location.href = '/particle.html';
  };

  return (
    <div className="app-container">
      <h1>Welcome to Particle Dream</h1>
      <p>Experience an interactive particle simulation for your mind</p>
      <button onClick={handleLaunchParticles} className="launch-button">
        Launch Particle Simulation
      </button>
    </div>
  );
};

export default App;