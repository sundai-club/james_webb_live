import '../styles/GalaxyInfo.css';

const GalaxyInfo = () => {
  return (
    <div className="galaxy-info">
      <h3>NGC 5584</h3>
      <p><span className="data-label">Type:</span> Spiral Galaxy</p>
      <p><span className="data-label">Distance:</span> ~72 million light years</p>
      <p><span className="data-label">Constellation:</span> Virgo</p>
      <p><span className="data-label">Diameter:</span> ~50,000 light years</p>
      <p><span className="data-label">Discovery:</span> William Herschel, 1786</p>
    </div>
  );
};

export default GalaxyInfo;