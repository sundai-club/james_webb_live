import { Canvas } from '@react-three/fiber'
import GalaxySimulation from './components/GalaxySimulation'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <Canvas camera={{ position: [0, 25, 0], fov: 60, lookAt: [0, 0, 0] }}>
        <color attach="background" args={['#000']} />
        <GalaxySimulation />
      </Canvas>
    </div>
  )
}

export default App
