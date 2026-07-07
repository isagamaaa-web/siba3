import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import teethImage from "@/assets/teeth-hero.png";

export default function TeethHero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: isMobile ? 40 : 55,
    damping: isMobile ? 28 : 26,
    mass: 0.25,
    restDelta: 0.001,
  });

  // Pointer-driven tilt (subtle 3D feel).
  const tiltX = useSpring(0, { stiffness: 90, damping: 16, mass: 0.25 });
  const tiltY = useSpring(0, { stiffness: 90, damping: 16, mass: 0.25 });
  const glowX = useSpring(50, { stiffness: 120, damping: 20 });
  const glowY = useSpring(50, { stiffness: 120, damping: 20 });

  const range = isMobile ? 18 : 48;
  const rotRange = isMobile ? 3 : 8;
  const yScroll = useTransform(smooth, [0, 1], [-range * 0.5, range]);
  const rotateScroll = useTransform(smooth, [0, 1], [-rotRange * 0.5, rotRange]);
  const scale = useTransform(smooth, [0, 0.5, 1], [0.98, 1.04, 1]);

  const motionStyle = reduce
    ? undefined
    : {
        y: yScroll,
        rotateZ: rotateScroll,
        rotateX: tiltX,
        rotateY: tiltY,
        scale,
        transformPerspective: 1000,
      };

  // Auto-rotation: continuously rotates the mouth gently on its own.
  const autoAnim = reduce
    ? undefined
    : {
        animate: {
          y: [0, -12, 0, -6, 0],
          rotateY: [0, 8, 0, -8, 0],
          rotateX: [0, -4, 0, 4, 0],
          rotateZ: [0, 1.5, 0, -1.5, 0],
        },
        transition: {
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      };

  const floatAnim = reduce
    ? undefined
    : { animate: { y: [0, -10, 0] }, transition: { duration: 6, repeat: Infinity, ease: "easeInOut" as const } };

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    tiltY.set((px - 0.5) * 16);
    tiltX.set((0.5 - py) * 14);
    glowX.set(px * 100);
    glowY.set(py * 100);
  };

  const onLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
    glowX.set(50);
    glowY.set(50);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative h-full w-full"
      style={{ contain: "layout paint" }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[2rem] blur-2xl"
        style={{
          background: useTransform(
            [glowX, glowY] as never,
            ([x, y]: number[]) =>
              `radial-gradient(circle at ${x}% ${y}%, color-mix(in oklab, var(--primary) 28%, transparent), transparent 60%)`
          ),
        }}
      />

      <motion.div
        style={motionStyle}
        {...(autoAnim ?? {})}
        className="relative flex h-full w-full items-center justify-center will-change-transform [transform-style:preserve-3d]"
      >
        <motion.img
          src={teethImage}
          alt="Realistic 3D model of upper and lower dental arches"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          draggable={false}
          whileHover={reduce ? undefined : { scale: 1.02 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          {...(floatAnim ?? {})}
          className="relative z-10 max-h-full w-auto max-w-[88%] select-none object-contain drop-shadow-[0_30px_50px_rgba(0,80,90,0.3)] sm:max-w-[80%] md:max-w-full"
        />
      </motion.div>

      <motion.div
        style={reduce ? undefined : { scale }}
        className="pointer-events-none absolute bottom-4 left-1/2 h-6 w-2/3 -translate-x-1/2 rounded-[50%] bg-foreground/25 blur-2xl"
      />
    </div>
  );
}
