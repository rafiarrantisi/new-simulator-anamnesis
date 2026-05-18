// Slit Lamp VOLUMETRIK (plan §5.7 Phase 3, L4). R3F + GLSL — lazy
// (three/r3f berat, init GPU ditunda). Beam dapat dirotasi, lebar/ tinggi
// adjustable; Tyndall via shader bila ada flare. Observasi-saja; pencatatan
// tetap di panel skematik (skor server-side tak berubah). Fallback WebGL
// gagal ditangani App (plan §3.3).
import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Mesh, ShaderMaterial } from 'three';

const VERT = `
varying vec3 vPos;
void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Tyndall: partikel tersuspensi bila flareGrade tinggi (plan §5.7 sketch).
const FRAG = `
precision mediump float;
varying vec3 vPos;
uniform float uFlare;
uniform float uTime;
float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
void main() {
  float core = smoothstep(0.5, 0.0, abs(vPos.x));
  float tyndall = uFlare * hash(floor(vPos*40.0)+floor(uTime*2.0));
  vec3 col = vec3(0.78,0.86,1.0);
  gl_FragColor = vec4(col, core*0.55 + tyndall*0.30);
}`;

function Beam({ angle, width, height, flare }: { angle: number; width: number; height: number; flare: number }) {
  const mat = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uFlare: { value: flare }, uTime: { value: 0 } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useFrame((s) => {
    if (mat.current) {
      mat.current.uniforms.uTime.value = s.clock.elapsedTime;
      mat.current.uniforms.uFlare.value = flare;
    }
  });
  return (
    <mesh rotation={[0, (angle * Math.PI) / 180, 0]} position={[0, 0, 1.2]}>
      <boxGeometry args={[width, height, 0.04]} />
      <shaderMaterial
        ref={mat}
        args={[{ uniforms, vertexShader: VERT, fragmentShader: FRAG }]}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

function Cornea() {
  const m = useRef<Mesh>(null);
  return (
    <mesh ref={m}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial color="#cfe0ea" transparent opacity={0.35} roughness={0.2} />
    </mesh>
  );
}

export function SlitLampVolumetric() {
  const [angle, setAngle] = useState(20);
  const [width, setWidth] = useState(0.16);
  const [height, setHeight] = useState(2.2);
  const [flare, setFlare] = useState(0.4);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="border-exam-line overflow-hidden rounded-xl border bg-black"
        style={{ height: 320 }}
      >
        <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[3, 3, 5]} intensity={0.7} />
          <Cornea />
          <Beam angle={angle} width={width} height={height} flare={flare} />
        </Canvas>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ['Sudut beam', angle, 0, 90, 1, setAngle],
            ['Lebar (mm)', width, 0.04, 0.8, 0.02, setWidth],
            ['Tinggi', height, 0.5, 3, 0.1, setHeight],
            ['Flare/Tyndall', flare, 0, 1, 0.05, setFlare],
          ] as const
        ).map(([lbl, val, mn, mx, st, set]) => (
          <label key={lbl} className="text-xs">
            <div className="text-exam-mut mb-1 flex justify-between">
              <span>{lbl}</span>
              <span>{Number(val).toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={mn}
              max={mx}
              step={st}
              value={val}
              onChange={(e) => set(+e.target.value)}
              className="accent-exam-accent w-full"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
