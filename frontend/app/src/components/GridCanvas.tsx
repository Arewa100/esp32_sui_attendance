import { useEffect, useRef } from 'react';

// For random hacking characters
const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;':,./<>?";

class Particle {
  color: string;
  speed: number;
  x: number = 0;
  y: number = 0;
  direction: 'horizontal' | 'vertical' = 'horizontal';
  trail: Array<{ x: number; y: number }> = [];
  active: boolean = false;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  occupiedLines: { horizontal: Set<number>; vertical: Set<number> };
  particleColors: string[];
  trailLength: number;
  particleSpeedMin: number;
  particleSpeedMax: number;
  gridSize: number;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    occupiedLines: { horizontal: Set<number>; vertical: Set<number> },
    particleColors: string[],
    trailLength: number,
    particleSpeedMin: number,
    particleSpeedMax: number,
    gridSize: number
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.occupiedLines = occupiedLines;
    this.particleColors = particleColors;
    this.trailLength = trailLength;
    this.particleSpeedMin = particleSpeedMin;
    this.particleSpeedMax = particleSpeedMax;
    this.gridSize = gridSize;
    this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
    this.speed = Math.random() * (particleSpeedMax - particleSpeedMin) + particleSpeedMin;
    this.reset();
  }

  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.trailLength) this.trail.shift();

    if (this.active) {
      if (this.direction === 'horizontal') {
        this.x += this.speed;
        if (this.x > this.canvas.width) {
          this.active = false;
          this.occupiedLines.horizontal.delete(this.y);
        }
      } else {
        this.y += this.speed;
        if (this.y > this.canvas.height) {
          this.active = false;
          this.occupiedLines.vertical.delete(this.x);
        }
      }
    } else {
      const allTrailPointsOffScreen = this.trail.every(point =>
        (this.direction === 'horizontal' && point.x > this.canvas.width) ||
        (this.direction === 'vertical' && point.y > this.canvas.height)
      );

      if (allTrailPointsOffScreen) {
        this.reset();
      }
    }
  }

  draw() {
    for (let i = 0; i < this.trail.length; i++) {
      const point = this.trail[i];
      const alpha = i / this.trail.length;
      this.ctx.fillStyle = this.color.replace('1)', `${alpha})`).replace('0.6)', `${alpha * 0.6})`).replace('0.4)', `${alpha * 0.4})`);
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 0.4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  findAvailableLine() {
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      if (Math.random() > 0.5) {
        // Try horizontal
        const y = Math.round(Math.random() * this.canvas.height / this.gridSize) * this.gridSize;
        if (!this.occupiedLines.horizontal.has(y)) {
          this.direction = 'horizontal';
          this.x = 0;
          this.y = y;
          this.occupiedLines.horizontal.add(y);
          return true;
        }
      } else {
        // Try vertical
        const x = Math.round(Math.random() * this.canvas.width / this.gridSize) * this.gridSize;
        if (!this.occupiedLines.vertical.has(x)) {
          this.direction = 'vertical';
          this.x = x;
          this.y = 0;
          this.occupiedLines.vertical.add(x);
          return true;
        }
      }
      attempts++;
    }
    return false;
  }

  reset() {
    if (this.findAvailableLine()) {
      this.trail = [];
      this.active = true;
      this.speed = Math.random() * (this.particleSpeedMax - this.particleSpeedMin) + this.particleSpeedMin;
    } else {
      this.active = false;
      this.trail = [];
    }
  }
}

class Ripple {
  x: number;
  y: number;
  radius: number = 0;
  maxRadius: number;
  startTime: number;
  ctx: CanvasRenderingContext2D;
  rippleColor: string;
  rippleDuration: number;

  constructor(x: number, y: number, ctx: CanvasRenderingContext2D, rippleColor: string, maxRadius: number, duration: number) {
    this.x = x;
    this.y = y;
    this.maxRadius = maxRadius;
    this.rippleDuration = duration;
    this.startTime = Date.now();
    this.ctx = ctx;
    this.rippleColor = rippleColor;
  }

  update() {
    const elapsed = Date.now() - this.startTime;
    this.radius = (elapsed / this.rippleDuration) * this.maxRadius;
  }

  draw() {
    const alpha = 1 - (this.radius / this.maxRadius);
    // Extract RGB values from rippleColor and apply alpha
    const colorMatch = this.rippleColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (colorMatch) {
      const r = colorMatch[1];
      const g = colorMatch[2];
      const b = colorMatch[3];
      this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } else {
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    }
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    this.ctx.stroke();

    // Draw random characters along the ripple
    if (Math.random() < 0.3) {
      if (colorMatch) {
        const r = colorMatch[1];
        const g = colorMatch[2];
        const b = colorMatch[3];
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      } else {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      }
      this.ctx.font = "16px monospace";
      const char = characters[Math.floor(Math.random() * characters.length)];
      this.ctx.fillText(
        char,
        this.x + (Math.random() - 0.5) * this.radius * 2,
        this.y + (Math.random() - 0.5) * this.radius * 2
      );
    }
  }

  isComplete() {
    return this.radius >= this.maxRadius;
  }
}

export default function GridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const occupiedLinesRef = useRef<{ horizontal: Set<number>; vertical: Set<number> }>({
    horizontal: new Set(),
    vertical: new Set()
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    const gridSize = 40;
    // Reduce particle count on low-end devices
    const particleCount = navigator.hardwareConcurrency <= 4 ? 25 : 50;
    const particleSpeedMin = 0.5;
    const particleSpeedMax = 5;
    const trailLength = 100;
    const rippleDuration = 2000;
    const rippleMaxRadius = 200;
    
    let isVisible = false;

    // Get current theme
    const getIsDark = (): boolean => {
      if (typeof window === 'undefined') return true;
      return document.documentElement.classList.contains('dark') || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    };

    // Get colors - always use dark mode colors regardless of theme
    const getColors = () => {
      return {
        gridColor: 'rgba(51, 65, 85, 0.3)', // Slate-700 with opacity
        // Primary blue color (HSL 217, 91%, 60%) converted to RGB: rgb(33, 144, 255)
        particleColors: ['rgba(33, 144, 255, 0.8)', 'rgba(33, 144, 255, 0.6)', 'rgba(59, 130, 246, 0.7)'],
        rippleColor: 'rgba(33, 144, 255, 0.4)'
      };
    };

    // Set canvas size
    const resizeCanvas = () => {
      const section = canvas.closest('section');
      if (section) {
        canvas.width = section.offsetWidth;
        canvas.height = section.offsetHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      // Clear occupied lines
      occupiedLinesRef.current.horizontal.clear();
      occupiedLinesRef.current.vertical.clear();

      // Update particles with new colors if they exist
      const colors = getColors();
      particlesRef.current.forEach(particle => {
        particle.particleColors = colors.particleColors;
      });
    };

    resizeCanvas();

    // Grid tracking system
    const occupiedLines = occupiedLinesRef.current;

    function createGrid() {
      // Clear canvas to show section's background color
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const colors = getColors();
      ctx.strokeStyle = colors.gridColor;

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
    }

    // Initialize particles
    const colors = getColors();
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array(particleCount)
        .fill(null)
        .map(() => new Particle(
          canvas, 
          ctx, 
          occupiedLines,
          colors.particleColors,
          trailLength,
          particleSpeedMin,
          particleSpeedMax,
          gridSize
        ));
    }

    function animate() {
      // Only animate when visible
      if (!isVisible) {
        animationFrameRef.current = null;
        return;
      }
      
      createGrid();

      particlesRef.current.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Update and draw ripples
      ripplesRef.current = ripplesRef.current.filter(ripple => !ripple.isComplete());
      ripplesRef.current.forEach(ripple => {
        ripple.update();
        ripple.draw();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    // Intersection Observer to pause animation when off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && animationFrameRef.current === null) {
            // Resume animation when visible
            animationFrameRef.current = requestAnimationFrame(animate);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    observer.observe(canvas);

    // Handle canvas click
    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const colors = getColors();
      ripplesRef.current.push(new Ripple(x, y, ctx, colors.rippleColor, rippleMaxRadius, rippleDuration));
    };

    canvas.addEventListener('click', handleClick);

    // Handle window resize
    const handleResize = () => {
      resizeCanvas();
    };

    // Set up ResizeObserver for section
    resizeObserverRef.current = new ResizeObserver(() => {
      resizeCanvas();
      occupiedLinesRef.current.horizontal.clear();
      occupiedLinesRef.current.vertical.clear();
      particlesRef.current.forEach((particle) => particle.reset());
    });

    const section = canvas.closest('section');
    if (section) {
      resizeObserverRef.current.observe(section);
    } else {
      resizeObserverRef.current.observe(canvas);
    }

    window.addEventListener('resize', handleResize);

    // Start animation only if visible
    isVisible = true;
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      observer.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="gridCanvas"
      className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
      style={{ zIndex: 1 }}
    />
  );
}