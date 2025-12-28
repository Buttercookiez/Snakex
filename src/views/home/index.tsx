// Next, React
import { FC, useState } from 'react';
import pkg from '../../../package.json';

// ❌ DO NOT EDIT ANYTHING ABOVE THIS LINE

export const HomeView: FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white font-sans">
      {/* EXTERNAL HEADER (Standard Scaffold) */}
      <header className="flex items-center justify-center border-b border-white/10 py-3 shrink-0 z-30 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-[11px]">
          <button className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
            Feed
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Casino
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Kids
          </button>
        </div>
      </header>

      {/* MAIN GAME AREA */}
      <main className="flex flex-1 items-center justify-center p-4 w-full">
        {/* PHONE FRAME */}
        <div className="relative aspect-[9/16] w-full max-w-sm h-[80vh] max-h-[850px] flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-[0_0_50px_rgba(56,189,248,0.25)]">
          
          {/* TOP HEADER BAR */}
          <div className="flex w-full items-center justify-between bg-[#111111] px-4 py-3 shrink-0 border-b border-white/5 z-20">
             <span className="rounded-full bg-[#1a1a1a] border border-white/5 px-3 py-1 text-[9px] font-bold text-slate-300 uppercase tracking-wide">
               SCROLLY GAME
             </span>
             <span className="text-[10px] text-slate-500 font-medium">
               #NoCodeJam
             </span>
          </div>

          {/* GAME CONTAINER */}
          <div className="relative flex-1 w-full h-full overflow-hidden">
             <GameSandbox />
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="flex h-6 items-center justify-center border-t border-white/10 bg-black z-30 text-[9px] text-slate-500 shrink-0">
        <span>Scrolly · v{pkg.version}</span>
      </footer>
    </div>
  );
};

// ✅ UPDATED GAME COMPONENT
const GameSandbox: FC = () => {
  const React = require('react');
  const { useState, useEffect, useRef, useCallback } = React;

  // --- CONFIG ---
  const GRID_SIZE = 20;

  // --- AUDIO REF ---
  const audioCtxRef = useRef(null);

  // --- SOUND ENGINE ---
  const playSound = useCallback((type: any) => {
    try {
      if (!audioCtxRef.current) {
        // @ts-ignore
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const createOscillator = (freq: number, dur: number, type: any, vol: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.type = type;
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + dur);
      };

      if (type === 'eat') {
        createOscillator(800, 0.1, 'square', 0.4);
        setTimeout(() => createOscillator(1000, 0.1, 'square', 0.3), 50);
      } else if (type === 'move') {
        createOscillator(200, 0.05, 'square', 0.05);
      } else if (type === 'die') {
        createOscillator(400, 0.2, 'sawtooth', 0.5);
        setTimeout(() => createOscillator(300, 0.2, 'sawtooth', 0.4), 100);
      } else if (type === 'levelup') {
         // Fanfare sound
         for (let i = 0; i < 5; i++) {
            setTimeout(() => createOscillator(500 + i * 150, 0.15, 'square', 0.4), i * 60);
         }
      }
    } catch (e) {}
  }, []);

  // --- STATE ---
  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState('MENU');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speedLevel, setSpeedLevel] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  
  // New Explosion State (Array of explosion events)
  const [explosions, setExplosions] = useState([]); 
  
  const snakeRef = useRef([{x: 10, y: 10}]);
  const foodRef = useRef({x: 15, y: 5});
  const dirRef = useRef({x: 0, y: -1});
  const nextDirRef = useRef({x: 0, y: -1});
  const loopRef = useRef(null);
  const itemsEatenRef = useRef(0); // Track items eaten to calc speed
  const [tick, setTick] = useState(0);

  // --- LOADING TIMER ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // --- EXPLOSION CLEANUP ---
  useEffect(() => {
    if (explosions.length > 0) {
      const timer = setTimeout(() => {
        // Remove old explosions to keep DOM light
        setExplosions(prev => prev.filter((e: any) => Date.now() - e.id < 1000));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [explosions]);

  // --- LOGIC ---
  const startGame = () => {
    snakeRef.current = [{x: 10, y: 10}];
    dirRef.current = {x: 0, y: -1}; 
    nextDirRef.current = {x: 0, y: -1};
    setExplosions([]);
    spawnFood();
    setScore(0);
    setSpeedLevel(1);
    itemsEatenRef.current = 0; // Reset counter
    setIsPaused(false);
    setGameState('PLAYING');
    if(audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
  };

  const spawnFood = () => {
    let valid = false;
    let newFood = {x: 0, y: 0};
    while (!valid) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // eslint-disable-next-line
      valid = !snakeRef.current.some((s: any) => s.x === newFood.x && s.y === newFood.y);
    }
    foodRef.current = newFood;
  };

  const changeDirection = (x: any, y: any) => {
    if (gameState !== 'PLAYING') return;
    if(audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    // Prevent 180 degree turns
    if (dirRef.current.x === -x && dirRef.current.y === -y) return;
    nextDirRef.current = {x, y};
  };

  const togglePause = () => {
    if (gameState === 'PLAYING') setIsPaused(!isPaused);
  };

  // Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING' || isPaused) {
      if (loopRef.current) clearInterval(loopRef.current);
      return;
    }

    // SPEED CALCULATION:
    // Base speed 200ms. Subtracts 12ms per level. Min speed 60ms.
    // The higher the level, the smaller the interval (faster).
    const currentSpeed = Math.max(60, 200 - (speedLevel - 1) * 12);

    loopRef.current = setInterval(() => {
      // 1. UPDATE SNAKE
      dirRef.current = nextDirRef.current;
      const head = snakeRef.current[0];
      const newHead = { x: head.x + dirRef.current.x, y: head.y + dirRef.current.y };

      // Walls
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        gameOver();
        return;
      }
      // Self collision
      if (snakeRef.current.some((s: any) => s.x === newHead.x && s.y === newHead.y)) {
        gameOver();
        return;
      }

      const newSnake = [newHead, ...snakeRef.current];
      
      // Eat
      if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
        
        // ✨ SPAWN EXPLOSION (CSS ANIMATION)
        // @ts-ignore
        setExplosions(prev => [...prev, { id: Date.now(), x: newHead.x, y: newHead.y }]);

        // Update Score
        setScore((s: any) => s + 10);
        itemsEatenRef.current += 1;

        // CHECK LEVEL UP LOGIC
        // Every 5 items (50 points), increase speed level
        if (itemsEatenRef.current % 5 === 0) {
            setSpeedLevel(prev => prev + 1);
            if(soundOn) playSound('levelup');
        } else {
            if(soundOn) playSound('eat');
        }

        spawnFood();
      } else {
        newSnake.pop();
        if(soundOn) playSound('move');
      }

      snakeRef.current = newSnake;
      setTick((t: any) => t + 1);

    }, currentSpeed); // Re-runs effect when currentSpeed changes

    return () => clearInterval(loopRef.current);
  }, [gameState, isPaused, speedLevel, playSound, tick, soundOn]);

  const gameOver = () => {
    setGameState('GAME_OVER');
    if(soundOn) playSound('die');
    setHighScore((h: any) => Math.max(h, score));
  };

  useEffect(() => {
    const handleKey = (e: any) => {
      if (isLoading) return; 
      if (e.code === 'Space') {
        if (gameState === 'MENU' || gameState === 'GAME_OVER') startGame();
        else togglePause();
      }
      if (gameState === 'PLAYING') {
         if (e.key === 'ArrowUp' || e.key === 'w') changeDirection(0, -1);
         if (e.key === 'ArrowDown' || e.key === 's') changeDirection(0, 1);
         if (e.key === 'ArrowLeft' || e.key === 'a') changeDirection(-1, 0);
         if (e.key === 'ArrowRight' || e.key === 'd') changeDirection(1, 0);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, isPaused, isLoading]);

  const isSnake = (x: number, y: number) => snakeRef.current.some((s: any) => s.x === x && s.y === y);
  const isHead = (x: number, y: number) => snakeRef.current[0].x === x && snakeRef.current[0].y === y;
  const isFood = (x: number, y: number) => foodRef.current.x === x && foodRef.current.y === y;

  // --- STYLES FOR BUTTONS ---
  const controlBtnClass = "w-14 h-14 bg-black border border-white/20 rounded-xl flex items-center justify-center text-white text-xl transition-all duration-100 active:scale-90 active:bg-white active:text-black hover:border-white shadow-lg";

  return (
    <div className="w-full h-full flex flex-col items-center justify-between py-4 overflow-hidden relative font-mono select-none"
         style={{ 
           background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
           fontFamily: '"Press Start 2P", monospace',
           color: '#ffffff'
         }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes snakePulse { 
            0% { transform: scale(0.8); } 
            100% { transform: scale(1); } 
        }
        @keyframes foodPulse { 
           0% { transform: scale(0.9); opacity: 0.9; } 
           100% { transform: scale(1.05); opacity: 1; } 
        }
        @keyframes slideInLeft {
           0% { transform: translateX(-100%); opacity: 0; }
           100% { transform: translateX(0); opacity: 0.7; }
        }
        /* ✨ HIGH PERFORMANCE CSS PARTICLE ANIMATION */
        @keyframes particlePhysics {
           0% { transform: translate(0, 0) scale(1); opacity: 1; }
           50% { opacity: 0.8; }
           100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
      `}</style>

      {/* HEADER HUD */}
      <div className="w-full max-w-[320px] shrink-0 mb-2 relative">
        <button 
            onClick={() => setSoundOn(!soundOn)}
            className="absolute -top-1 right-0 text-[10px] bg-[#222] border-2 border-[#444] px-2 py-1 shadow-[inset_1px_1px_0_rgba(255,255,255,0.1)] active:bg-[#333]"
        >
            {soundOn ? '♪ ON' : '♪ OFF'}
        </button>

        <h1 className="text-center text-2xl mb-4 tracking-[0.25rem] font-normal" 
            style={{ textShadow: '2px 2px 0px #000, 4px 4px 0px #333' }}>
          SNAKEX
        </h1>
        
        <div className="flex justify-between gap-2">
           <div className="flex-1 bg-[#111] border-2 border-[#333] p-2 text-center min-w-[3.5rem]">
             <div className="text-white text-[8px] mb-1">SCORE</div>
             <div className="text-xs text-white">{score}</div>
           </div>
           <div className="flex-1 bg-[#111] border-2 border-[#333] p-2 text-center min-w-[3.5rem]">
             <div className="text-white text-[8px] mb-1">BEST</div>
             <div className="text-xs text-white">{highScore}</div>
           </div>
           <div className="flex-1 bg-[#111] border-2 border-[#333] p-2 text-center min-w-[3.5rem]">
             <div className="text-white text-[8px] mb-1">LVL</div>
             <div className="text-xs text-white">{speedLevel}</div>
           </div>
        </div>
      </div>

      {/* GAME BOARD */}
      <div className="w-full px-4 flex items-center justify-center">
        <div className="relative w-full max-w-[340px] aspect-square bg-black border-4 border-[#333] shadow-[0_20px_40px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="w-full h-full grid relative"
                 style={{ 
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, 
                    gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` 
                 }}>
              {[...Array(GRID_SIZE * GRID_SIZE)].map((_, i) => {
                  const x = i % GRID_SIZE;
                  const y = Math.floor(i / GRID_SIZE);
                  const isS = isSnake(x, y);
                  const isH = isHead(x, y);
                  const isF = isFood(x, y);

                  return (
                    <div key={i} className="w-full h-full bg-[#111] border-0 outline outline-1 outline-[#0a0a0a] relative">
                        {isS && (
                            <div className="absolute inset-0 bg-white" 
                                 style={{
                                    boxShadow: isH ? '0 0 12px rgba(255,255,255,0.3)' : 'none',
                                    animation: 'snakePulse 0.2s ease-out'
                                 }}
                            >
                                {isH && <div className="absolute top-[25%] left-[15%] w-[25%] h-[25%] bg-black" />}
                            </div>
                        )}
                        {/* ✅ CIRCLE FOOD WITH SOLANA LOGO INSIDE */}
                        {isF && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center p-[2px]"
                                 style={{ animation: 'foodPulse 0.8s ease-in-out infinite alternate' }}
                            >
                               <div className="w-[85%] h-[85%] bg-white rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                                  <svg viewBox="0 0 24 24" fill="black" className="w-[65%] h-[65%]">
                                     <path d="M2.665 4.607C1.942 4.607 1.258 4.965.86 5.567L.06 6.768c-.296.444-.025 1.05.508 1.05h19.866c.723 0 1.407-.358 1.805-.96l.8-1.2c.296-.445.025-1.052-.508-1.052H2.665zM21.334 19.393c.723 0 1.407-.358 1.805-.96l.8-1.2c.296-.444.025-1.05-.508-1.05H2.765c-.723 0-1.407.358-1.805.96l-.8 1.2c-.296.445-.025 1.052.508 1.052h18.666zM18.17 10.453H1.503c-.723 0-1.407.358-1.805.96l-.8 1.2c-.296.444-.025 1.05.508 1.05h19.866c.723 0 1.407-.358 1.805-.96l.8-1.2c.296-.445.025-1.052-.508-1.052z" />
                                  </svg>
                               </div>
                            </div>
                        )}
                    </div>
                  );
              })}
              
              {/* ✨ SMOOTH CSS PARTICLE OVERLAY */}
              {explosions.map((exp: any) => (
                  <div key={exp.id} 
                       className="absolute pointer-events-none"
                       style={{
                           left: `${(exp.x / GRID_SIZE) * 100}%`,
                           top: `${(exp.y / GRID_SIZE) * 100}%`,
                           width: `${100 / GRID_SIZE}%`,
                           height: `${100 / GRID_SIZE}%`,
                       }}
                  >
                     {/* Spawn 12 particles per explosion */}
                     {[...Array(12)].map((_, i) => {
                         // Pre-calculate random spread in render for simplicity in this env
                         const angle = (i / 12) * 360; // Spread circle
                         const dist = 30 + Math.random() * 50; // Random distance
                         // Convert polar to cartesian
                         const tx = Math.cos(angle * Math.PI / 180) * dist;
                         const ty = Math.sin(angle * Math.PI / 180) * dist + 50; // +50 adds gravity feel
                         
                         return (
                            <div key={i} 
                                 className="absolute left-1/2 top-1/2 w-[3px] h-[3px] bg-white rounded-full"
                                 style={{
                                     // @ts-ignore
                                     '--tx': `${tx}px`,
                                     '--ty': `${ty}px`,
                                     animation: `particlePhysics 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                                     animationDelay: `${Math.random() * 0.1}s`
                                 }} 
                            />
                         );
                     })}
                  </div>
              ))}
            </div>
        </div>
      </div>

      {/* CONTROLS (ICONS SWAPPED FOR OPPOSITE EFFECT) */}
      <div className="shrink-0 mb-4 w-full flex flex-col items-center gap-2 z-10">
         <div className="flex justify-center w-full">
            {/* UP */}
            <button className={controlBtnClass}
              onPointerDown={(e) => { e.preventDefault(); changeDirection(0, -1); }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h6v8h4v-8h6z"/></svg>
            </button>
         </div>
         <div className="flex justify-center gap-2 w-full">
            {/* LEFT BUTTON (Uses Right Arrow Path) */}
            <button className={controlBtnClass}
              onPointerDown={(e) => { e.preventDefault(); changeDirection(-1, 0); }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 12l8-8v6h8v4h-8v6z"/></svg>
            </button>
            {/* DOWN */}
            <button className={controlBtnClass}
              onPointerDown={(e) => { e.preventDefault(); changeDirection(0, 1); }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l-8-8h6v-8h4v8h6z"/></svg>
            </button>
            {/* RIGHT BUTTON (Uses Left Arrow Path) */}
            <button className={controlBtnClass}
              onPointerDown={(e) => { e.preventDefault(); changeDirection(1, 0); }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 12l-8-8v6h-8v4h8v6z"/></svg>
            </button>
         </div>
      </div>

      {/* --- LOADING SCREEN (PURE LOGO) --- */}
      {isLoading && (
         <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black">
             {/* 8-BIT SVG SNAKE LOGO */}
             <div className="w-20 h-20 opacity-90 animate-pulse">
                <svg viewBox="0 0 20 20" fill="white" xmlns="http://www.w3.org/2000/svg">
                   <rect x="5" y="4" width="10" height="2" />
                   <rect x="15" y="4" width="2" height="6" />
                   <rect x="5" y="10" width="12" height="2" />
                   <rect x="3" y="10" width="2" height="6" />
                   <rect x="3" y="16" width="12" height="2" />
                   <rect x="15" y="14" width="2" height="2" /> {/* Head */}
                   <rect x="16" y="14.5" width="0.5" height="0.5" fill="black" /> {/* Eye */}
                </svg>
             </div>
         </div>
      )}

      {/* --- MENU / GAME OVER OVERLAY --- */}
      {!isLoading && (gameState === 'MENU' || gameState === 'GAME_OVER') && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center"
             style={{ background: 'rgba(5, 5, 5, 0.96)' }}>
          
          {/* STATIC TITLE (Smaller) */}
          <h1 className="text-3xl text-white mb-10 font-bold tracking-[0.5rem] relative"
              style={{ 
                  fontFamily: '"Press Start 2P", monospace',
                  textShadow: '3px 3px 0 #333'
              }}>
             SNAKEX
          </h1>
          
          {gameState === 'GAME_OVER' && (
             <div className="mb-8">
               <div className="text-lg text-red-500 mb-2 tracking-widest">GAME OVER</div>
               <div className="text-white text-xs">SCORE: {score}</div>
             </div>
          )}

          {/* SIMPLE HOVER START BUTTON (Fixed) */}
          <button 
             onClick={startGame}
             className="bg-black px-6 py-2 border border-white text-white text-[10px] tracking-[0.2rem] transition-all duration-200 hover:bg-white hover:text-black cursor-pointer uppercase"
             style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
             {gameState === 'MENU' ? 'START' : 'RETRY'}
          </button>
          
          {/* MINIMALIST INSTRUCTIONS (LOWER LEFT - Smaller) */}
          <div className="absolute bottom-6 left-6 text-left"
               style={{ animation: 'slideInLeft 1s ease-out forwards' }}>
             <div className="flex flex-col gap-2 text-[9px] font-mono tracking-widest text-slate-400">
                 <p className="uppercase">Arrows to Move</p>
                 <p className="uppercase">Eat to Grow</p>
                 <p className="uppercase text-red-500">Avoid Walls</p>
             </div>
          </div>

        </div>
      )}
    </div>
  );
};