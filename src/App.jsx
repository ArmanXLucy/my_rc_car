import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function RCTrainer() {
  const [throttle, setThrottle] = useState(0);
  const [steering, setSteering] = useState(0);

  const [car, setCar] = useState({ x: 0, y: 0, angle: 0, speed: 0, angVel: 0 });
  const [ball, setBall] = useState({ x: 0, y: -40, vx: 0, vy: 0 });
  const [score, setScore] = useState(0);

  const FIELD_X = 90;
  const FIELD_Y = 160;
  const GOAL_WIDTH = 50;

  const handleThrottle = (e) => {
    const rect = e.target.getBoundingClientRect();
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const center = rect.height / 2;
    const offset = center - (y - rect.top);
    const value = Math.max(-100, Math.min(100, (offset / center) * 100));
    setThrottle(Math.round(value));
  };

  const handleSteering = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const value = Math.max(-50, Math.min(50, ((x - rect.left) / rect.width) * 100 - 50));
    setSteering(Math.round(value));
  };

  const resetControls = () => {
    setThrottle(0);
    setSteering(0);
  };

  const resetGame = () => {
    setCar({ x: 0, y: 0, angle: 0, speed: 0, angVel: 0 });
    setBall({ x: 0, y: -40, vx: 0, vy: 0 });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCar(prev => {
        const accel = throttle / 3000;
        const turnAccel = steering / 5000;

        let speed = prev.speed + accel;
        let angVel = prev.angVel + turnAccel;

        speed *= 0.985;
        angVel *= 0.9;

        const angle = prev.angle + angVel * 10;

        let x = prev.x + Math.sin((angle * Math.PI) / 180) * speed * 120;
        let y = prev.y - Math.cos((angle * Math.PI) / 180) * speed * 120;

        if (x > FIELD_X) { x = FIELD_X; speed *= -0.2; }
        if (x < -FIELD_X) { x = -FIELD_X; speed *= -0.2; }
        if (y > FIELD_Y) { y = FIELD_Y; speed *= -0.2; }
        if (y < -FIELD_Y) { y = -FIELD_Y; speed *= -0.2; }

        setBall(ballPrev => {
          let { x: bx, y: by, vx, vy } = ballPrev;

          bx += vx;
          by += vy;

          vx *= 0.992;
          vy *= 0.992;

          const dx = bx - x;
          const dy = by - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 20) {
            const impactAngle = Math.atan2(dy, dx);
            const force = Math.max(0.6, Math.abs(speed) * 2.5);

            // Push ball outward to prevent graphic overlap
            const overlap = 20 - dist;
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
    }, 16);

    return () => clearInterval(interval);
  }, [throttle, steering]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Robot Soccer Trainer ⚽</h1>

      <div className="relative w-64 max-w-md h-96 bg-green-800 rounded-2xl mb-6 overflow-hidden border-2 border-green-600">
        <div className="absolute inset-0 border border-green-400" />
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-green-400" />
        <div className="absolute left-1/2 top-1/2 w-16 h-16 border border-green-400 rounded-full -translate-x-1/2 -translate-y-1/2" />

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-8 border-2 border-white rounded-sm" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-8 border-2 border-white rounded-sm" />

        {/* Robot */}
        <motion.div
          className="absolute z-20"
          animate={{ x: car.x, y: car.y, rotate: car.angle }}
          transition={{ type: "tween", ease: "linear", duration: 0.05 }}
          style={{ left: "50%", top: "50%" }}
        >
          {/* Shadow */}
          <div className="absolute w-10 h-14 bg-black/40 blur-md rounded-full translate-x-[-2px] translate-y-[6px]" />

          {/* Body */}
          <div className="relative w-8 h-14 bg-gradient-to-b from-red-400 to-red-600 rounded-md border border-red-300">

            {/* Front Marker */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-white rounded-sm" />

            {/* Wheels */}
            <div className="absolute -left-2 top-2 w-2 h-4 bg-gray-200 rounded-sm" />
            <div className="absolute -right-2 top-2 w-2 h-4 bg-gray-200 rounded-sm" />
            <div className="absolute -left-2 bottom-2 w-2 h-4 bg-gray-200 rounded-sm" />
            <div className="absolute -right-2 bottom-2 w-2 h-4 bg-gray-200 rounded-sm" />

            {/* Bumper */}
            <div className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-6 h-1 bg-gray-300 rounded-full" />
          </div>
        </motion.div>

        {/* Ball */}
        <motion.div
          className="absolute w-5 h-5 bg-white rounded-full shadow-lg z-10"
          animate={{ x: ball.x, y: ball.y }}
          transition={{ type: "tween", ease: "linear", duration: 0.05 }}
          style={{ left: "50%", top: "50%" }}
        />
      </div>

      <div className="grid grid-cols-2 gap-8 w-full max-w-md">
        <div className="flex flex-col items-center">
          <p className="mb-2">Steering</p>
          <div
            className="w-36 h-36 bg-gray-800 rounded-2xl flex items-center justify-center touch-none"
            onMouseMove={(e) => e.buttons === 1 && handleSteering(e)}
            onMouseUp={resetControls}
            onTouchMove={handleSteering}
            onTouchEnd={resetControls}
          >
            <motion.div
              className="w-14 h-14 bg-blue-500 rounded-full"
              animate={{ x: steering }}
              transition={{ type: "spring", stiffness: 200 }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <p className="mb-2">Throttle</p>
          <div
            className="w-20 h-36 bg-gray-800 rounded-2xl flex items-center justify-center touch-none relative"
            onMouseMove={(e) => e.buttons === 1 && handleThrottle(e)}
            onMouseUp={resetControls}
            onTouchMove={handleThrottle}
            onTouchEnd={resetControls}
          >
            <div className="absolute w-full h-0.5 bg-gray-600" />

            <motion.div
              className="absolute w-full bg-green-500 rounded-2xl"
              animate={{ height: `${Math.abs(throttle)}%`, y: throttle < 0 ? `${Math.abs(throttle)}%` : 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              style={{ bottom: throttle >= 0 ? "50%" : "auto", top: throttle < 0 ? "50%" : "auto" }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 bg-gray-800 px-6 py-3 rounded-xl text-center">
        <p>Score: {score}</p>
        <button onClick={resetGame} className="mt-2 px-4 py-1 bg-red-500 rounded-lg">Reset</button>
      </div>
    </div>
  );
}
