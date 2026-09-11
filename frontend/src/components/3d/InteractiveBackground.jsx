import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function InteractiveBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera & Renderer
    const scene = new THREE.Scene();
    // Deep void midnight fog for atmospheric depth
    scene.fog = new THREE.FogExp2(0x030712, 0.0018);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 80;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x030712, 1);
    container.appendChild(renderer.domElement);

    // 2. Lighting System (Primary Blues & Electric Cyan)
    const ambientLight = new THREE.AmbientLight(0x0a192f, 2.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x2563eb, 3, 200);
    pointLight1.position.set(40, 30, 40);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06b6d4, 2.5, 200);
    pointLight2.position.set(-40, -30, 30);
    scene.add(pointLight2);

    // 3. Central Interactive Floating 3D Geometric Crystal (Icosahedron & Wireframe)
    const crystalGroup = new THREE.Group();

    // Solid inner faceted polyhedron with deep blue specular material
    const innerGeom = new THREE.IcosahedronGeometry(18, 1);
    const innerMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f274a,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.8,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      wireframe: false,
      transparent: true,
      opacity: 0.75,
    });
    const innerMesh = new THREE.Mesh(innerGeom, innerMat);
    crystalGroup.add(innerMesh);

    // Outer luminous wireframe lattice
    const wireGeom = new THREE.IcosahedronGeometry(18.2, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(wireGeom, wireMat);
    crystalGroup.add(wireMesh);

    // Outer orbital geometric ring
    const ringGeom = new THREE.TorusGeometry(26, 0.3, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.45,
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    crystalGroup.add(ringMesh);

    scene.add(crystalGroup);
    crystalGroup.position.set(32, 0, -10);

    // 4. Luminous 3D Particle Starfield
    const particleCount = 1200;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const bluePalette = [
      new THREE.Color(0x3b82f6), // Sapphire
      new THREE.Color(0x60a5fa), // Azure
      new THREE.Color(0x06b6d4), // Cyan
      new THREE.Color(0x1d4ed8), // Royal
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 350;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 250;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

      const chosenColor = bluePalette[Math.floor(Math.random() * bluePalette.length)];
      colors[i * 3] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // 5. Smooth Mouse Tracking with Exponential Decay Lerping
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const onMouseMove = (event) => {
      // Normalize cursor coordinates from -1 to 1
      targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // 6. Responsive Viewport Resizing
    const onWindowResize = () => {
      if (!renderer || !camera) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', onWindowResize);

    // 7. Animation & Render Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Fluid exponential lerping for buttery-smooth mouse tracking
      currentMouseX += (targetMouseX - currentMouseX) * 0.045;
      currentMouseY += (targetMouseY - currentMouseY) * 0.045;

      // Camera subtle parallax tilt based on mouse position
      camera.position.x = currentMouseX * 14;
      camera.position.y = currentMouseY * 10;
      camera.lookAt(scene.position);

      // Rotating the 3D crystal with continuous motion + mouse responsiveness
      crystalGroup.rotation.y += 0.35 * delta;
      crystalGroup.rotation.x = Math.sin(elapsedTime * 0.4) * 0.2 + currentMouseY * 0.5;
      crystalGroup.rotation.z = Math.cos(elapsedTime * 0.3) * 0.2 + currentMouseX * 0.5;

      ringMesh.rotation.z += 0.5 * delta;

      // Particle system gentle wave drift
      particleSystem.rotation.y = elapsedTime * 0.02 + currentMouseX * 0.15;
      particleSystem.rotation.x = currentMouseY * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Cleanup on Unmount
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
