import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ==============================================================================
 * AMBIENT ARCHITECTURAL 3D BACKGROUND (LIGHT MODE / SUBTLE AESTHETIC)
 * ==============================================================================
 * Renders an understated, low-contrast geometric structure that rests quietly in
 * the background without distracting user focus or competing with content.
 * Responds with delicate, subtle parallax to mouse motion.
 * ==============================================================================
 */
export function InteractiveBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera & Soft Atmospheric Fog
    const scene = new THREE.Scene();
    // Soft slate-gray atmospheric fog for light mode depth
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.0025);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 85;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xf8fafc, 1);
    container.appendChild(renderer.domElement);

    // 2. Soft, Natural Lighting System (No harsh glares)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const softDirectionalLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    softDirectionalLight.position.set(30, 40, 50);
    scene.add(softDirectionalLight);

    const softFillLight = new THREE.DirectionalLight(0xe2e8f0, 0.5);
    softFillLight.position.set(-30, -30, 20);
    scene.add(softFillLight);

    // 3. Understated 3D Architectural Geometric Element
    const sculptureGroup = new THREE.Group();

    // Solid inner frosted polyhedron (very low opacity, delicate slate-blue)
    const innerGeom = new THREE.IcosahedronGeometry(17, 1);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.7,
      metalness: 0.1,
      wireframe: false,
      transparent: true,
      opacity: 0.14,
    });
    const innerMesh = new THREE.Mesh(innerGeom, innerMat);
    sculptureGroup.add(innerMesh);

    // Delicate wireframe lattice (soft slate)
    const wireGeom = new THREE.IcosahedronGeometry(17.15, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const wireMesh = new THREE.Mesh(wireGeom, wireMat);
    sculptureGroup.add(wireMesh);

    // Thin outer orbital ring (faint watermark accent)
    const ringGeom = new THREE.TorusGeometry(25, 0.15, 16, 90);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.18,
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 3.2;
    sculptureGroup.add(ringMesh);

    scene.add(sculptureGroup);
    // Placed gracefully toward the upper right / background corner
    sculptureGroup.position.set(32, 4, -12);

    // 4. Subtle Ambient Floating Micro-Particles
    const particleCount = 280;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const lightPalette = [
      new THREE.Color(0x94a3b8), // Soft slate
      new THREE.Color(0x60a5fa), // Muted sky blue
      new THREE.Color(0xcbd5e1), // Light cool gray
      new THREE.Color(0x2563eb), // Classic subtle blue
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 340;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 240;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 180;

      const chosenColor = lightPalette[Math.floor(Math.random() * lightPalette.length)];
      colors[i * 3] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 1.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.22,
      blending: THREE.NormalBlending,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // 5. Very Gentle, Smooth Mouse Lerping (Non-distracting)
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const onMouseMove = (event) => {
      targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // 6. Viewport Resizing
    const onWindowResize = () => {
      if (!renderer || !camera) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', onWindowResize);

    // 7. Animation Loop (Serene, Slow Motion)
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Soft damping interpolation
      currentMouseX += (targetMouseX - currentMouseX) * 0.025;
      currentMouseY += (targetMouseY - currentMouseY) * 0.025;

      // Restrained camera parallax tilt (does not throw off page reading)
      camera.position.x = currentMouseX * 5;
      camera.position.y = currentMouseY * 3.5;
      camera.lookAt(scene.position);

      // Slow, relaxing continuous rotation
      sculptureGroup.rotation.y += 0.12 * delta;
      sculptureGroup.rotation.x = Math.sin(elapsedTime * 0.2) * 0.1 + currentMouseY * 0.18;
      sculptureGroup.rotation.z = Math.cos(elapsedTime * 0.15) * 0.1 + currentMouseX * 0.18;

      ringMesh.rotation.z += 0.18 * delta;

      // Micro-particles gentle drift
      particleSystem.rotation.y = elapsedTime * 0.008 + currentMouseX * 0.04;
      particleSystem.rotation.x = currentMouseY * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onWindowResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      innerGeom.dispose();
      innerMat.dispose();
      wireGeom.dispose();
      wireMat.dispose();
      ringGeom.dispose();
      ringMat.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      aria-hidden="true"
    />
  );
}
