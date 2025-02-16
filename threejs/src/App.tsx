import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import GalaxySimulation from './components/GalaxySimulation'
import './App.css'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 2, 5], fov: 75 }}>
        <color attach="background" args={['#000']} />
        <OrbitControls />
        <GalaxySimulation />
      </Canvas>
    </div>
  )
}

export default App
