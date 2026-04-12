import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { Note } from '@/data/mockNotes';

const noteColorHex: Record<string, string> = {
  yellow: '#eab308', green: '#22c55e', blue: '#3b82f6',
  pink: '#ec4899', orange: '#f97316', purple: '#a855f7',
  teal: '#14b8a6', default: '#6b7280',
};

function NoteNode({ note, position, onClick, isSelected }: {
  note: Note; position: [number, number, number]; onClick: (note: Note) => void; isSelected: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const color = noteColorHex[note.color] || noteColorHex.default;

  useFrame((_, delta) => {
    if (ref.current) {
      const s = isSelected ? 1.3 : hovered ? 1.15 : 1;
      ref.current.scale.lerp(new THREE.Vector3(s, s, s), delta * 8);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group position={position}>
        <mesh
          ref={ref}
          onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick(note); }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <dodecahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.7}
            emissive={color}
            emissiveIntensity={isSelected ? 0.6 : hovered ? 0.4 : 0.2}
            roughness={0.2}
            metalness={0.3}
          />
        </mesh>
        {/* Glow sphere */}
        <mesh scale={1.4}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.12 : 0.05} />
        </mesh>
        <Text
          position={[0, -0.9, 0]}
          fontSize={0.18}
          color="white"
          anchorX="center"
          anchorY="top"
          maxWidth={2}
        >
          {note.title.length > 25 ? note.title.slice(0, 25) + '…' : note.title}
        </Text>
      </group>
    </Float>
  );
}

function ConnectionLine({ start, end, color }: { start: [number, number, number]; end: [number, number, number]; color: string }) {
  const points = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3((start[0] + end[0]) / 2, (start[1] + end[1]) / 2 + 0.5, (start[2] + end[2]) / 2),
      new THREE.Vector3(...end)
    );
    return curve.getPoints(20);
  }, [start, end]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.2} />
    </line>
  );
}

function MindMapScene({ notes, onNoteClick, selectedId }: {
  notes: Note[]; onNoteClick: (note: Note) => void; selectedId: string | null;
}) {
  // Layout notes in a circle
  const positions = useMemo(() => {
    const radius = Math.max(3, notes.length * 0.6);
    return notes.map((_, i) => {
      const angle = (i / notes.length) * Math.PI * 2;
      const r = radius + Math.sin(i * 1.5) * 1.5;
      return [Math.cos(angle) * r, Math.sin(i * 0.7) * 1.5, Math.sin(angle) * r] as [number, number, number];
    });
  }, [notes.length]);

  // Find connections based on shared tags
  const connections = useMemo(() => {
    const conns: { from: number; to: number; color: string }[] = [];
    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const sharedTags = notes[i].tags.filter(t => notes[j].tags.some(t2 => t2.name === t.name));
        if (sharedTags.length > 0) {
          conns.push({ from: i, to: j, color: noteColorHex[notes[i].color] || '#6b7280' });
        }
      }
    }
    return conns;
  }, [notes]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.6} color="#8b5cf6" />
      <pointLight position={[-10, -5, 5]} intensity={0.3} color="#06b6d4" />

      {connections.map((c, i) => (
        <ConnectionLine key={i} start={positions[c.from]} end={positions[c.to]} color={c.color} />
      ))}

      {notes.map((note, i) => (
        <NoteNode
          key={note.id}
          note={note}
          position={positions[i]}
          onClick={onNoteClick}
          isSelected={selectedId === note.id}
        />
      ))}

      <OrbitControls enableDamping dampingFactor={0.05} minDistance={3} maxDistance={25} />
    </>
  );
}

interface MindMapProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
}

export default function MindMap({ notes, onNoteClick }: MindMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleClick = useCallback((note: Note) => {
    setSelectedId(note.id);
    onNoteClick(note);
  }, [onNoteClick]);

  if (notes.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <p>No notes to visualize. Create some notes first!</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-120px)] rounded-xl overflow-hidden relative">
      <Canvas camera={{ position: [0, 3, 10], fov: 55 }} dpr={[1, 1.5]}>
        <MindMapScene notes={notes} onNoteClick={handleClick} selectedId={selectedId} />
      </Canvas>
      <div className="absolute bottom-4 left-4 glass rounded-lg px-3 py-2 text-xs text-muted-foreground">
        🖱️ Drag to rotate • Scroll to zoom • Click a node to open
      </div>
    </div>
  );
}
