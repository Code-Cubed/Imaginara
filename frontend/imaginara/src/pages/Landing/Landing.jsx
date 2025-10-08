// landing.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import './landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    camera.position.z = 5;

    // Create floating geometric shapes
    const geometries = [
      new THREE.OctahedronGeometry(0.5),
      new THREE.TetrahedronGeometry(0.5),
      new THREE.IcosahedronGeometry(0.5),
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
    ];

    const materials = [
      new THREE.MeshPhongMaterial({ color: 0x6366f1, shininess: 100, transparent: true, opacity: 0.8 }),
      new THREE.MeshPhongMaterial({ color: 0x8b5cf6, shininess: 100, transparent: true, opacity: 0.8 }),
      new THREE.MeshPhongMaterial({ color: 0xec4899, shininess: 100, transparent: true, opacity: 0.8 }),
      new THREE.MeshPhongMaterial({ color: 0x06b6d4, shininess: 100, transparent: true, opacity: 0.8 }),
    ];

    const meshes = [];
    for (let i = 0; i < 15; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const material = materials[Math.floor(Math.random() * materials.length)];
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.position.x = (Math.random() - 0.5) * 10;
      mesh.position.y = (Math.random() - 0.5) * 10;
      mesh.position.z = (Math.random() - 0.5) * 5;
      
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;
      
      mesh.userData.velocity = {
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
        rotation: (Math.random() - 0.5) * 0.02,
      };
      
      scene.add(mesh);
      meshes.push(mesh);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x8b5cf6, 1, 100);
    pointLight.position.set(-5, 5, 0);
    scene.add(pointLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      meshes.forEach((mesh) => {
        mesh.rotation.x += mesh.userData.velocity.rotation;
        mesh.rotation.y += mesh.userData.velocity.rotation;
        
        mesh.position.x += mesh.userData.velocity.x;
        mesh.position.y += mesh.userData.velocity.y;
        
        if (Math.abs(mesh.position.x) > 6) mesh.userData.velocity.x *= -1;
        if (Math.abs(mesh.position.y) > 6) mesh.userData.velocity.y *= -1;
      });
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  const photos = [
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1504198458649-3128b932f49e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1499084732479-de2c02d45fcc?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
  ];

  return (
    <div className="landing-container">
      {/* 3D Background Canvas */}
      <canvas
        ref={canvasRef}
        className="canvas-3d"
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay" />
        
        <div className="hero-grid">
          {/* Left Content */}
          <div className="hero-content">
            <div className="hero-content-inner">
              <div className="hero-title-section">
                <h1 className="hero-title">
                  Welcome to{' '}
                  <span className="hero-title-gradient">
                    Imaginara
                  </span>
                </h1>
                <p className="hero-description">
                  Where creativity meets innovation. Share your art, discover masterpieces, and connect with creators worldwide.
                </p>
              </div>
              
              

              <div className="hero-stats">
                <div className="stat-item">
                  <div className="stat-number">100K+</div>
                  <div className="stat-label">Artists</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number pink">5M+</div>
                  <div className="stat-label">Artworks</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number cyan">50+</div>
                  <div className="stat-label">Countries</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="hero-image-container">
            <div className="hero-image-glow" />
            <img
              src="https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&w=600&q=80"
              alt="Creative art"
              className="hero-image"
            />
            <div className="hero-image-decoration" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-title">
            Why Choose Imaginara?
          </h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3 className="feature-title">Share Your Art</h3>
              <p className="feature-description">
                Upload and showcase your creative works to a global audience
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">✨</div>
              <h3 className="feature-title">Discover Inspiration</h3>
              <p className="feature-description">
                Explore millions of artworks from talented creators worldwide
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3 className="feature-title">Connect & Grow</h3>
              <p className="feature-description">
                Build your network and collaborate with fellow artists
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="gallery-section">
        <div className="section-container">
          <h2 className="section-title gallery-title">
            Featured Artworks
          </h2>
          <p className="gallery-subtitle">
            Discover stunning pieces from our creative community
          </p>
          
          <div className="gallery-masonry">
            {photos.map((photo, idx) => (
              <div key={idx} className="gallery-item">
                <img
                  src={photo}
                  alt={`Artwork ${idx + 1}`}
                  className="gallery-image"
                />
                <div className="gallery-overlay">
                  <div>
                    <h4 className="gallery-info-title">Amazing Creation</h4>
                    <p className="gallery-info-author">by Creative Artist</p>
                  </div>
                </div>
                <button className="gallery-like-btn">
                  <svg className="gallery-like-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">
              Ready to Share Your{' '}
              <span className="cta-title-gradient">
                Masterpiece?
              </span>
            </h2>
            <p className="cta-description">
              Join thousands of creators and start showcasing your work today.
            </p>
            <button className="cta-button" onClick={() => navigate("/signup")}>
              Join Imaginara Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p className="footer-text">© 2024 Imaginara. Where creativity comes alive.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;




