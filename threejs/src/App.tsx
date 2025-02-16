import { Canvas } from '@react-three/fiber'
import GalaxySimulation from './components/GalaxySimulation'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <Canvas camera={{ position: [0, 15, 15], fov: 60 }}>
        <color attach="background" args={['#000']} />
        <GalaxySimulation />
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
    </div>
  )
}

export default App
