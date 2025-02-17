import React from 'react';
import ngc5584Image from '../assets/ngc5584.jpg'; // You'll need to add this image

interface LandingPageProps {
  onStartSimulation: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartSimulation }) => {
  return (
    <div className="landing-page">
      <div className="content">
        <section className="telescope-info">
          <h1>James Webb Space Telescope</h1>
          <p>
            The James Webb Space Telescope (JWST) is NASA's largest and most powerful space telescope
            ever built. Launched in December 2021, it observes the universe in infrared light,
            revealing never-before-seen details of cosmic objects, including stars, galaxies,
            and exoplanets.
          </p>
          <p>
            With its 6.5-meter primary mirror and suite of sophisticated instruments, JWST peers
            through cosmic dust clouds to reveal the hidden secrets of the universe, from the
            first galaxies that formed after the Big Bang to the birth of stellar systems.
          </p>
        </section>

        <section className="galaxy-info">
          <h2>NGC 5584: A Spectacular Spiral Galaxy</h2>
          <p>
            NGC 5584 is a beautiful spiral galaxy located approximately 72 million light-years away
            in the constellation Virgo. This galaxy showcases prominent spiral arms adorned with
            bright blue star clusters and reddish regions of star formation.
          </p>
          <p>
            The galaxy's well-defined spiral structure and numerous star-forming regions make it
            an excellent example of a typical spiral galaxy, similar to our own Milky Way.
          </p>
          <div className="galaxy-image-container" onClick={onStartSimulation}>
            <img src={ngc5584Image} alt="NGC 5584 Galaxy" className="galaxy-image" />
            <div className="image-overlay">
              <span>Click to Launch Interactive Simulation</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage; 