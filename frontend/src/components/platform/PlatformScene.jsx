import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { LAYER_COLORS, LAYER_GLOW } from "./colors";

/*
 * The Solix platform in 3D, on React Three Fiber (MIT): the four layers as
 * glass slabs in their brand colours, governed data rising through them as
 * light (blue at the sources, Solix Red once activated), and the Solix bolt
 * in red chrome crowning the stack. Code-split with three.js; the DOM
 * around it (PlatformExplorer) carries all the content.
 *
 * Budget: the loop runs ("always") only while the explorer holds the page's
 * live-canvas slot. Otherwise R3F renders on demand: a hover or selection
 * still animates to rest, then the loop stops.
 */

const LAYER_Y = { foundation: -0.96, optimize: -0.32, comply: 0.32, activate: 0.96 };
const SLAB = [2.7, 0.18, 2.7];
const BOLT = [[23.5, 3.5], [10.5, 22.5], [18.7, 22.5], [15.2, 37], [30, 17], [21.8, 17], [26, 3.5]];

// Eases `obj[key]` toward `target`; returns true while still moving.
const approach = (obj, key, target, k) => {
  const d = target - obj[key];
  if (Math.abs(d) < 1e-3) {
    obj[key] = target;
    return false;
  }
  obj[key] += d * k;
  return true;
};

function Studio() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    // Reflections from three's procedural studio room: no HDR download.
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 7, 5]} intensity={1.4} />
      <pointLight position={[0, 2.3, 0.6]} color="#EE2424" intensity={4} distance={4} decay={1.6} />
      <pointLight position={[0, -1.9, 0]} color="#0088CF" intensity={4} distance={4.5} decay={1.6} />
    </>
  );
}

function Slab({ layer, selected, hovered, lit, dim, geometry, edges, onHover, onSelect, instant }) {
  const group = useRef();
  const mat = useRef();
  const invalidate = useThree((s) => s.invalidate);
  const baseY = LAYER_Y[layer.key];

  useEffect(() => invalidate(), [selected, hovered, lit, dim, invalidate]);

  useFrame((_, dt) => {
    const k = instant ? 1 : 1 - Math.exp(-dt * 9);
    let moving = approach(group.current.position, "y", baseY + (selected ? 0.18 : hovered ? 0.09 : 0), k);
    moving = approach(mat.current, "emissiveIntensity", selected ? 0.38 : lit ? 0.26 : hovered ? 0.18 : 0.03, k) || moving;
    moving = approach(mat.current, "opacity", dim ? 0.28 : 0.9, k) || moving;
    if (moving) invalidate();
  });

  return (
    <group ref={group} position={[0, baseY, 0]}>
      <mesh
        geometry={geometry}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(layer.key);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(layer.key);
        }}
      >
        <meshPhysicalMaterial
          ref={mat}
          color={LAYER_COLORS[layer.tone]}
          emissive={LAYER_GLOW[layer.tone]}
          emissiveIntensity={0.06}
          transparent
          opacity={0.84}
          roughness={0.34}
          metalness={0.04}
          clearcoat={0.35}
          clearcoatRoughness={0.2}
          envMapIntensity={0.32}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#ffffff" transparent opacity={selected ? 0.7 : 0.26} />
      </lineSegments>
    </group>
  );
}

// Governed data rising through the stack: computed in the vertex shader, so
// the CPU only advances one uniform per frame.
const FLOW_VERT = /* glsl */ `
uniform float uTime;
uniform float uSpeed;
uniform float uPixel;
attribute vec4 aSeed;
varying float vT;
void main() {
  float t = fract(aSeed.y + uTime * uSpeed * (0.6 + aSeed.w * 0.5));
  float a = t * 1.6;
  vec3 p = vec3(aSeed.x * cos(a) - aSeed.z * sin(a), mix(-1.6, 1.85, t), aSeed.x * sin(a) + aSeed.z * cos(a));
  p.xz *= mix(1.0, 0.45, smoothstep(0.55, 1.0, t)); // converging into activation
  vT = t;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPixel * (2.4 + 2.4 * aSeed.w) * (8.0 / -mv.z);
}`;
const FLOW_FRAG = /* glsl */ `
varying float vT;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d);
  vec3 col = mix(vec3(0.16, 0.66, 0.93), vec3(0.93, 0.14, 0.14), smoothstep(0.62, 0.9, vT));
  float fade = smoothstep(0.0, 0.08, vT) * smoothstep(1.0, 0.86, vT);
  gl_FragColor = vec4(col * 1.25, a * fade);
}`;

function DataFlow({ speed, count = 640, still }) {
  const material = useRef();
  const dpr = useThree((s) => s.viewport.dpr);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(Math.random()) * 1.15;
      const a = Math.random() * Math.PI * 2;
      seeds.set([Math.cos(a) * r, Math.random(), Math.sin(a) * r, Math.random()], i * 4);
    }
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    return g;
  }, [count]);
  const uniforms = useMemo(() => ({ uTime: { value: 3.2 }, uSpeed: { value: speed }, uPixel: { value: 1 } }), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    uniforms.uSpeed.value = speed;
    uniforms.uPixel.value = dpr;
  }, [speed, dpr, uniforms]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, dt) => {
    if (!still) uniforms.uTime.value += Math.min(dt, 0.05);
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={FLOW_VERT} fragmentShader={FLOW_FRAG} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Bolt({ still }) {
  const ref = useRef();
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    BOLT.forEach(([x, y], i) => {
      const px = (x - 20) / 20;
      const py = (20 - y) / 20;
      if (i) shape.lineTo(px, py);
      else shape.moveTo(px, py);
    });
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.035, bevelSegments: 5 });
    g.center();
    g.scale(0.62, 0.62, 0.62);
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((state, dt) => {
    if (still) return;
    ref.current.rotation.y += dt * 0.55;
    ref.current.position.y = 1.98 + Math.sin(state.clock.elapsedTime * 1.3) * 0.05;
  });
  return (
    <mesh ref={ref} geometry={geometry} position={[0, 1.98, 0]} rotation={[0, -0.35, 0]}>
      <meshPhysicalMaterial color="#EE2424" metalness={1} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} envMapIntensity={1.9} />
    </mesh>
  );
}

// A slow sway and a pointer parallax, so the stack reads as an object.
function Rig({ still, children }) {
  const group = useRef();
  useFrame((state, dt) => {
    if (still) return;
    const k = 1 - Math.exp(-dt * 2.2);
    const cam = state.camera;
    cam.position.x += (6.2 + state.pointer.x * 0.8 - cam.position.x) * k;
    cam.position.y += (4.3 + state.pointer.y * 0.45 - cam.position.y) * k;
    cam.lookAt(0, 0.45, 0);
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.22) * 0.18;
  });
  return <group ref={group}>{children}</group>;
}

function Floor() {
  const grid = useMemo(() => {
    const g = new THREE.GridHelper(9, 18, "#2C4A66", "#1C2F43");
    g.material.transparent = true;
    g.material.opacity = 0.45;
    g.position.y = -1.62;
    return g;
  }, []);
  return <primitive object={grid} />;
}

function PlatformScene({ layers, selected, hovered, lit, onHover, onSelect, speed = 0.22, running, still, onReady }) {
  const geometry = useMemo(() => new RoundedBoxGeometry(SLAB[0], SLAB[1], SLAB[2], 4, 0.07), []);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(SLAB[0] + 0.004, SLAB[1] + 0.004, SLAB[2] + 0.004)), []);
  useEffect(() => () => {
    geometry.dispose();
    edges.dispose();
    document.body.style.cursor = "";
  }, [geometry, edges]);

  const hover = (key) => {
    document.body.style.cursor = key ? "pointer" : "";
    onHover(key);
  };
  const anyLit = lit.size > 0;

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [6.2, 4.3, 7.4], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      flat
      frameloop={running && !still ? "always" : "demand"}
      onCreated={({ camera }) => {
        camera.lookAt(0, 0.45, 0);
        onReady?.();
      }}
      onPointerMissed={() => onHover(null)}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden="true"
    >
      <Studio />
      <Rig still={still}>
        <Floor />
        {layers.map((layer) => (
          <Slab
            key={layer.key}
            layer={layer}
            geometry={geometry}
            edges={edges}
            selected={selected === layer.key}
            hovered={hovered === layer.key}
            lit={lit.has(layer.key)}
            dim={anyLit && !lit.has(layer.key) && selected !== layer.key}
            onHover={hover}
            onSelect={onSelect}
            instant={still}
          />
        ))}
        <DataFlow speed={speed} still={still} />
        <Bolt still={still} />
      </Rig>
    </Canvas>
  );
}

export default memo(PlatformScene);
