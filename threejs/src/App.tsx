import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import GalaxySimulation from './components/GalaxySimulation'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <Canvas camera={{ position: [20, 10, 20], fov: 60 }}>
        <color attach="background" args={['#000']} />
        <OrbitControls target={[0, 0, 0]} />
        <GalaxySimulation />
      </Canvas>
    </div>
  )
}

export default App
