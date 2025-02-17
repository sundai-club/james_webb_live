import React from 'react';
import ngc5584Image from '../assets/ngc5584.jpg';

interface LandingPageProps {
  onStartSimulation: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartSimulation }) => {
  return (
    <div className="landing-page">
      <div className="content-wrapper">
        <div className="left-panel" onClick={onStartSimulation}>
          <div className="image-container">
            <img src={ngc5584Image} alt="NGC 5584 Galaxy" />
            <div className="image-overlay">
              <div className="launch-button">
                <span className="launch-text">Initialize Simulation</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="right-panel">
          <div className="header">
            <div className="hal-logo">JWST 2024</div>
            <p className="status-text">
              Telescope systems operational. All instruments functioning perfectly.
            </p>
          </div>

          <div className="info-section">
            <h1>James Webb Space Telescope</h1>
            <p className="description">
              JWST is humanity's premier space observatory, 
              both a scientific and engineering marvel. The telescope 
              observes the universe in infrared, revealing cosmic secrets 
              hidden from visible light.
            </p>
          </div>

          <div className="galaxy-section">
            <h2>NGC 5584</h2>
            <p className="subtitle">A Spectacular Spiral Galaxy</p>
            <p className="description">
              Located 72 million light-years away in the constellation Virgo, 
              this beautiful spiral galaxy showcases prominent arms adorned with 
              bright blue star clusters and reddish regions of star formation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 