import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function RCTrainer() {
  const [throttle, setThrottle] = useState(0);
  const [steering, setSteering] = useState(0);

  const [car, setCar] = useState({ x: 0, y: 0, angle: 0, speed: 0, angVel: 0 });
  const [ball, setBall] = useState({ x: 0, y: -40, vx: 0, vy: 0 });
  const [score, setScore] = useState(0);

  const steeringRef = useRef(null);
  const throttleRef = useRef(null);

  const FIELD_X = 90;
  const FIELD_Y = 160;
  const GOAL_WIDTH = 50;

  /* ---------------- JOYSTICK LOGIC (NO LAG) ---------------- */

  const updateThrottle = (clientY) => {
    const rect = throttleRef.current.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const offset = center - clientY;
    const value = Math.max(-100, Math.min(100, (offset / (rect.height / 2)) * 100));
    setThrottle(value);
  };

  const updateSteering = (clientX) => {
    const rect = steeringRef.current.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const offset = clientX - center;
    const value = Math.max(-50, Math.min(50, (offset / (rect.width / 2)) * 50));
    setSteering(value);
  };

  const resetControls = () => {
    setThrottle(0);
    setSteering(0);
  };

  /* ---------------- PHYSICS ---------------- */

  useEffect(() => {
    let animationFrame;

    const updatePhysics = () => {
      setCar(prev => {
        const accel = throttle / 2600; // Slightly slower acceleration for better control // MUCH faster acceleration
        const turnAccel = steering / 900; // MUCH faster steering // MUCH faster steering response

        let speed = prev.speed + accel;
        let angVel = prev.angVel + turnAccel;

        speed *= 0.992; // less friction = higher speed
        angVel *= 0.85; // quicker turning // less damping = quicker left/right reaction

        const angle = prev.angle + angVel * 10;

        let x = prev.x + Math.sin((angle * Math.PI) / 180) * speed * 180;
        let y = prev.y - Math.cos((angle * Math.PI) / 180) * speed * 180;

        if (x > FIELD_X) { x = FIELD_X; speed *= -0.2; }
        if (x < -FIELD_X) { x = -FIELD_X; speed *= -0.2; }
        if (y > FIELD_Y) { y = FIELD_Y; speed *= -0.2; }
        if (y < -FIELD_Y) { y = -FIELD_Y; speed *= -0.2; }

        setBall(ballPrev => {
          let { x: bx, y: by, vx, vy } = ballPrev;

          bx += vx * 1.2;
          by += vy * 1.2;

          vx *= 0.992;
          vy *= 0.992;

          const dx = bx - x;
          const dy = by - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 18) {
            const impactAngle = Math.atan2(dy, dx);
            const force = Math.max(1.2, Math.abs(speed) * 3.5);

            const overlap = 18 - dist;
            bx += Math.cos(impactAngle) * overlap;
            by += Math.sin(impactAngle) * overlap;

            vx += Math.cos(impactAngle) * force;
            vy += Math.sin(impactAngle) * force;
          }

          if (bx > FIELD_X) { bx = FIELD_X; vx *= -0.8; }
          if (bx < -FIELD_X) { bx = -FIELD_X; vx *= -0.8; }
          if (by > FIELD_Y) { by = FIELD_Y; vy *= -0.8; }
          if (by < -FIELD_Y) { by = -FIELD_Y; vy *= -0.8; }

          if (by < -FIELD_Y + 5 && Math.abs(bx) < GOAL_WIDTH / 2) {
            setScore(s => s + 1);
            return { x: 0, y: -40, vx: 0, vy: 0 };
          }

          return { x: bx, y: by, vx, vy };
        });

        return { x, y, angle, speed, angVel };
      });

      animationFrame = requestAnimationFrame(updatePhysics);
    };

    animationFrame = requestAnimationFrame(updatePhysics);

    return () => cancelAnimationFrame(animationFrame);
  }, [throttle, steering]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 select-none touch-none">
      <h1 className="text-2xl font-bold mb-4">Robot Soccer Trainer ⚽</h1>

      <div className="relative w-64 h-96 bg-green-800 rounded-2xl mb-6 overflow-hidden border-2 border-green-600">
        <div className="absolute inset-0 border border-green-400" />
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-green-400" />
        <div className="absolute left-1/2 top-1/2 w-10 h-10 border border-green-400 rounded-full -translate-x-1/2 -translate-y-1/2" />

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-8 border-2 border-white rounded-sm" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-8 border-2 border-white rounded-sm" />

        <motion.div
          className="absolute"
          animate={{ x: car.x, y: car.y, rotate: car.angle }}
          transition={{ type: "tween", ease: "linear", duration: 0.05 }}
          style={{ left: "50%", top: "50%" }}
        >
          {/* Shadow */}
          <div className="absolute w-8 h-8 bg-black/40 blur-md rounded-full translate-y-1" />

          {/* Soccer Bot Body */}
          <div className="relative w-10 h-10">
            {/* Shadow */}
            <div className="absolute inset-0 bg-black/40 blur-md rounded-xl translate-y-1" />

            {/* Main H Chassis */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-300 to-gray-500 rounded-md" />

            {/* H Shape Cutout */}
            <div className="absolute left-1/2 top-1/2 w-6 h-10 bg-green-800 -translate-x-1/2 -translate-y-1/2" />

            {/* Direction Marker */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-5 h-2 bg-red-500 rounded-sm" />

            {/* Tracks / Wheels */}
            <div className="absolute -left-2 top-1 w-3 h-5 bg-black rounded-sm" />
            <div className="absolute -right-2 top-1 w-3 h-5 bg-black rounded-sm" />
            <div className="absolute -left-2 bottom-1 w-3 h-5 bg-black rounded-sm" />
            <div className="absolute -right-2 bottom-1 w-3 h-5 bg-black rounded-sm" />

            {/* Mechanical Border */}
            <div className="absolute inset-1 border border-white/30 rounded-md" />
          </div>
        </motion.div>

        <motion.div
          className="absolute w-5 h-5 bg-white rounded-full"
          animate={{ x: ball.x, y: ball.y }}
          transition={{ type: "tween", ease: "linear", duration: 0.05 }}
          style={{ left: "50%", top: "50%" }}
        />
      </div>

      {/* CONTROLS */}
      <div className="grid grid-cols-2 gap-10">
        {/* Steering Stick */}
        <div className="flex flex-col items-center">
          <p className="mb-2">Steering</p>
          <div
            ref={steeringRef}
            className="relative w-32 h-32 bg-gray-800 rounded-full touch-none"
            onPointerMove={(e) => e.pressure > 0 && updateSteering(e.clientX)}
            onPointerUp={resetControls}
            onPointerLeave={resetControls}
          >
            <div className="absolute inset-0 border border-gray-600 rounded-full" />

            <motion.div
              className="absolute w-10 h-10 bg-blue-500 rounded-full"
              animate={{ x: steering }}
              transition={{ type: "tween", duration: 0 }}
              style={{ left: "50%", top: "50%", translateX: "-50%", translateY: "-50%" }}
            />
          </div>
        </div>

        {/* Throttle Stick */}
        <div className="flex flex-col items-center">
          <p className="mb-2">Throttle</p>
          <div
            ref={throttleRef}
            className="relative w-16 h-32 bg-gray-800 rounded-xl touch-none"
            onPointerMove={(e) => e.pressure > 0 && updateThrottle(e.clientY)}
            onPointerUp={resetControls}
            onPointerLeave={resetControls}
          >
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-600" />

            <motion.div
              className="absolute w-full h-6 bg-green-500 rounded-md"
              animate={{ y: -throttle }}
              transition={{ type: "tween", duration: 0 }}
              style={{ top: "50%", translateY: "-50%" }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 bg-gray-800 px-6 py-3 rounded-xl text-center">
        <p>Score: {score}</p>
      </div>
    </div>
  );
}
