import { useEffect, useRef } from 'react';
// Named imports, not `import * as THREE`, so Rollup can tree-shake the parts of Three
// this shader layer never touches. The whole module is already behind a React.lazy
// boundary, so what survives shaking lands in its own chunk off the critical path.
import {
  Clock,
  Mesh,
  OrthographicCamera,
  PlaneBufferGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three';

/**
 * A very restrained WebGL layer over the hero image: a soft directional light wash and
 * fine grain that follow the pointer, giving the flat photograph a sense of depth.
 *
 * Deliberately minimal. This is a healthcare brand — the effect should be felt rather
 * than noticed, so it is a single full-screen shader with no geometry and no post
 * processing. Three.js is dynamically imported so it stays out of the critical path
 * and never blocks LCP.
 *
 * Mounts only on desktop pointer devices with reduced motion off; the caller enforces
 * that. Bails out safely if WebGL is unavailable — the photograph below is the content.
 */
export default function HeroDepth({ pointer }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let renderer;
    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false });
    } catch {
      return undefined; // No WebGL. The hero photograph is the content; nothing is lost.
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uPointer: { value: new Vector2(0.5, 0.5) },
      uRes: { value: new Vector2(1, 1) },
    };

    const material = new ShaderMaterial({
      uniforms,
      transparent: true,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uPointer;
        uniform vec2 uRes;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        void main() {
          vec2 uv = vUv;
          float aspect = uRes.x / max(uRes.y, 1.0);
          vec2 p = vec2(uv.x * aspect, uv.y);
          vec2 lp = vec2(uPointer.x * aspect, uPointer.y);

          // Soft light wash tracking the pointer.
          float d = distance(p, lp);
          float wash = smoothstep(1.15, 0.0, d) * 0.16;

          // Slow breath, so the layer is never completely static.
          wash *= 0.85 + 0.15 * sin(uTime * 0.35);

          // Fine grain, kept low so it reads as film rather than noise.
          float g = (hash(uv * uRes.xy * 0.5 + uTime) - 0.5) * 0.035;

          vec3 warm = vec3(1.0, 0.985, 0.96);
          gl_FragColor = vec4(warm, wash + g);
        }
      `,
    });

    const geometry = new PlaneBufferGeometry(2, 2);
    scene.add(new Mesh(geometry, material));

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w, h);
    };
    resize();
    window.addEventListener('resize', resize);

    const clock = new Clock();
    let raf = 0;
    let visible = true;

    // Stop the loop once the hero scrolls away — no reason to burn a GPU on it.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      uniforms.uTime.value = clock.getElapsedTime();
      uniforms.uPointer.value.set(pointer.current.nx, 1 - pointer.current.ny);
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [pointer]);


  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
