import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function CrystalShape({ position, scale, color, speed }: { position: [number, number, number]; scale: number; color: string; speed: number }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    ref.current.rotation.x += delta * speed * 0.3;
    ref.current.rotation.y += delta * speed * 0.2;
  });

  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={ref} position={position} scale={scale}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.08}
          wireframe
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>
    </Float>
  );
}

function Particles() {
  const count = 60;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#8b5cf6" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

function Scene() {
  const shapes = useMemo(() => [
    { position: [-4, 2, -5] as [number, number, number], scale: 1.2, color: '#8b5cf6', speed: 0.8 },
    { position: [3, -1, -3] as [number, number, number], scale: 0.8, color: '#06b6d4', speed: 1.2 },
    { position: [-2, -3, -6] as [number, number, number], scale: 1.5, color: '#6366f1', speed: 0.6 },
    { position: [5, 3, -8] as [number, number, number], scale: 1.0, color: '#a855f7', speed: 1.0 },
    { position: [0, 0, -10] as [number, number, number], scale: 2.0, color: '#7c3aed', speed: 0.4 },
  ], []);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#8b5cf6" />
      {shapes.map((s, i) => <CrystalShape key={i} {...s} />)}
      <Particles />
    </>
  );
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <Scene />
      </Canvas>
    </div>
  );
}
