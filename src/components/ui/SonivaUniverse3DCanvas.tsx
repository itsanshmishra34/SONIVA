import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useMusic } from '../../context/MusicContext';
import { Sparkles, Play, Pause, Disc, Volume2 } from 'lucide-react';

export const SonivaUniverse3DCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { isPlaying, currentTrack, togglePlay } = useMusic();
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.035);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x1e1b4b, 2.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x38bdf8, 5, 50);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa855f7, 5, 50);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xec4899, 4, 50);
    pointLight3.position.set(0, 8, -5);
    scene.add(pointLight3);

    // Create Abstract Musical Sculpture (Nested Torus Knots & Glowing Rings)
    const sculptureGroup = new THREE.Group();
    scene.add(sculptureGroup);

    // 1. Core Luminous Torus Knot
    const knotGeometry = new THREE.TorusKnotGeometry(3.2, 0.9, 128, 32, 2, 3);
    const knotMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x3b82f6,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.4,
      roughness: 0.15,
      metalness: 0.85,
      transmission: 0.3,
      thickness: 1.2,
      ior: 1.5,
      wireframe: false
    });
    const knotMesh = new THREE.Mesh(knotGeometry, knotMaterial);
    sculptureGroup.add(knotMesh);

    // 2. Outer Flowing Rings
    const ringCount = 4;
    const ringMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < ringCount; i++) {
      const radius = 4.5 + i * 1.1;
      const ringGeom = new THREE.TorusGeometry(radius, 0.06, 16, 100);
      const ringMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x06b6d4 : 0x8b5cf6,
        emissive: i % 2 === 0 ? 0x0891b2 : 0x7c3aed,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.9,
        transparent: true,
        opacity: 0.75
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      sculptureGroup.add(ring);
      ringMeshes.push(ring);
    }

    // 3. Particle Starfield / Sound Nodes
    const particleCount = 350;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color(0x38bdf8), // Cyan
      new THREE.Color(0xa855f7), // Violet
      new THREE.Color(0xec4899), // Magenta
      new THREE.Color(0x818cf8)  // Indigo
    ];

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 25;
      particlePositions[i + 1] = (Math.random() - 0.5) * 25;
      particlePositions[i + 2] = (Math.random() - 0.5) * 25;

      const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      particleColors[i] = randomColor.r;
      particleColors[i + 1] = randomColor.g;
      particleColors[i + 2] = randomColor.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouseY = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse damping
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      // Rotate sculpture based on time & play state
      const pulseSpeed = isPlayingRef.current ? 1.5 : 0.6;
      sculptureGroup.rotation.x = elapsedTime * 0.18 * pulseSpeed + targetY * 0.5;
      sculptureGroup.rotation.y = elapsedTime * 0.22 * pulseSpeed + targetX * 0.5;

      // Pulse scale if playing music
      if (isPlayingRef.current) {
        const scalePulse = 1 + Math.sin(elapsedTime * 6) * 0.06;
        sculptureGroup.scale.set(scalePulse, scalePulse, scalePulse);
      } else {
        sculptureGroup.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05);
      }

      // Rotate outer rings dynamically
      ringMeshes.forEach((ring, index) => {
        ring.rotation.x += (index + 1) * 0.003 * pulseSpeed;
        ring.rotation.y += (index + 1) * 0.004 * pulseSpeed;
      });

      // Slowly rotate particle field
      particles.rotation.y = elapsedTime * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[420px] md:h-[500px] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-slate-900 border border-white/10 shadow-2xl shadow-blue-900/30 group">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Atmospheric Aurora Overlay Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/15 via-transparent to-purple-950/30 pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cinematic HUD Overlay */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-cyan-300 tracking-wider">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>SONIVA IMMERSIVE 3D UNIVERSE</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>Interactive Audio Visualizer</span>
        </div>
      </div>

      {/* Bottom Track HUD & Play Controls */}
      <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center overflow-hidden relative">
            {currentTrack?.artwork ? (
              <img src={currentTrack.artwork} alt={currentTrack.title} className="w-full h-full object-cover" />
            ) : (
              <Disc className={`w-6 h-6 text-cyan-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            )}
            {isPlaying && (
              <div className="absolute inset-0 bg-cyan-500/20 mix-blend-overlay flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-white animate-pulse" />
              </div>
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              {currentTrack ? currentTrack.title : 'No track playing'}
            </h4>
            <p className="text-xs text-slate-400">
              {currentTrack ? currentTrack.artist : 'Select a track to activate 3D resonance'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={togglePlay}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 hover:from-blue-500 hover:to-fuchsia-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>PAUSE UNIVERSE</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>PLAY UNIVERSE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
