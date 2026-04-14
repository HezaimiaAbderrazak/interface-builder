import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, Float, Html } from '@react-three/drei';
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
  const [dragPos, setDragPos] = useState<[number, number, number]>(position);
  const color = noteColorHex[note.color] || noteColorHex.default;

  useFrame((_, delta) => {
    if (ref.current) {
      const s = isSelected ? 1.35 : hovered ? 1.18 : 1;
      ref.current.scale.lerp(new THREE.Vector3(s, s, s), delta * 8);
    }
  });

  const currentPos = dragPos;

  return (
    <group position={currentPos}>
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.2}>
        <mesh
          ref={ref}
          onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick(note); }}
          onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
        >
          <dodecahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.85}
            emissive={color}
            emissiveIntensity={isSelected ? 0.7 : hovered ? 0.5 : 0.25}
            roughness={0.15}
            metalness={0.35}
          />
        </mesh>
        {/* Glow ring */}
        <mesh scale={1.6}>
          <ringGeometry args={[0.45, 0.55, 32]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.2 : 0.06} side={THREE.DoubleSide} />
        </mesh>
      </Float>
      {/* Label */}
      <Html position={[0, -1.1, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: `1px solid ${color}40`,
            whiteSpace: 'nowrap',
            maxWidth: '160px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <span style={{ color: '#f8fafc', fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
            {note.title.length > 28 ? note.title.slice(0, 28) + '…' : note.title}
          </span>
        </div>
      </Html>
    </group>
  );
}

function ConnectionLine({ start, end, color }: { start: [number, number, number]; end: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Line>(null!);
  const geo = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2 + 0.6,
        (start[2] + end[2]) / 2
      ),
      new THREE.Vector3(...end)
    );
    const pts = curve.getPoints(30);
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    return g;
  }, [start, end]);

  return (
    <line ref={ref} geometry={geo}>
      <lineBasicMaterial color={color} transparent opacity={0.35} linewidth={1} />
    </line>
  );
}

function MindMapScene({ notes, onNoteClick, selectedId }: {
  notes: Note[]; onNoteClick: (note: Note) => void; selectedId: string | null;
}) {
  const positions = useMemo(() => {
    const radius = Math.max(3.5, notes.length * 0.65);
    return notes.map((_, i) => {
      const angle = (i / notes.length) * Math.PI * 2;
      const r = radius + Math.sin(i * 1.5) * 1.5;
      return [Math.cos(angle) * r, Math.sin(i * 0.7) * 1.5, Math.sin(angle) * r] as [number, number, number];
    });
  }, [notes.length]);

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
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.7} color="#8b5cf6" />
      <pointLight position={[-10, -5, 5]} intensity={0.35} color="#06b6d4" />
      <pointLight position={[0, -8, -8]} intensity={0.2} color="#f97316" />

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
    <div className="w-full h-[calc(100vh-120px)] rounded-xl overflow-hidden relative border border-border">
      <Canvas camera={{ position: [0, 3, 10], fov: 55 }} dpr={[1, 1.5]}>
        <MindMapScene notes={notes} onNoteClick={handleClick} selectedId={selectedId} />
      </Canvas>
      <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground">
        🖱️ Drag to rotate • Scroll to zoom • Click a node to open
      </div>
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">Connections</p>
        <p>Lines link notes sharing tags</p>
      </div>
    </div>
  );
}
