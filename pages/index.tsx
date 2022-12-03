import styles from "../styles/index.module.css";
import clsx from "clsx";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { IoPersonCircle, IoPlay, IoPause, IoRefresh } from "react-icons/io5";
import Head from "next/head";

const GAME_SIZE = 1600;
const GAME_ROW_SIZE = 50;
const GAME_COL_SIZE = Math.floor(GAME_SIZE / GAME_ROW_SIZE);
type Game = boolean[];

function generateSeed(): Game {
  const data: Game = new Array(GAME_SIZE);
  for (let i = 0; i < GAME_SIZE; i++) data[i] = Math.random() < 0.5;
  return data;
}

function useClock(time = 1000, runOnStart = true) {

  const clock = useRef<NodeJS.Timer | undefined>(undefined);
  const [tick, setTick] = useState(0);
  const [isOn, setIsOn] = useState(runOnStart);

  const handleTick = useCallback(() => {
    const newValue = tick + 1;
    setTick(newValue);
  }, [tick]);

  const startClock = useCallback(() => {
    if (clock.current) clearInterval(clock.current);
    clock.current = setInterval(handleTick, time);
    setIsOn(true);
  }, [handleTick, time]);

  const stopClock = useCallback(() => {
    if (clock.current) clearInterval(clock.current);
    setIsOn(false);
  }, []);

  useEffect(() => {
    if (runOnStart) startClock();
    return () => stopClock();
  }, [startClock, stopClock, runOnStart]);

  const toggleClock = useCallback(() => {
    if (isOn) stopClock();
    else startClock();
  }, [isOn, startClock, stopClock]);

  return { startClock, stopClock, tick, isTicking: isOn, toggleClock };

}

function handleGameOfLifeFrame(game: Game): Game {

  function getNeighborCount(i: number, x: number, y: number): number {

    const w = Number(x === 0 ? false : game[i - 1]);
    const e = Number(x === GAME_ROW_SIZE - 1 ? false : game[i + 1]);
    const n = Number(y === 0 ? false : game[i - GAME_ROW_SIZE]);
    const s = Number(y === GAME_COL_SIZE - 1 ? false : game[i + GAME_ROW_SIZE]);

    const nw = Number(y === 0 ? false : x === 0 ? false : game[i - GAME_ROW_SIZE - 1]);
    const ne = Number(y === 0 ? false : x === GAME_ROW_SIZE - 1 ? false : game[i - GAME_ROW_SIZE + 1]);
    const sw = Number(y === GAME_COL_SIZE - 1 ? false : x === 0 ? false : game[i + GAME_ROW_SIZE - 1]);
    const se = Number(y === GAME_COL_SIZE - 1 ? false : x === GAME_ROW_SIZE - 1 ? false : game[i + GAME_ROW_SIZE + 1]);

    return w + e + n + s + nw + ne + sw + se;
  }

  const nextFrame: Game = new Array(game.length);

  for (let i = 0; i < GAME_SIZE; i++) {
    const x = i % GAME_ROW_SIZE;
    const y = Math.floor(i / GAME_ROW_SIZE);

    const isAlive = game[i];
    const neighborCount = getNeighborCount(i, x, y);
    let shouldLive = isAlive;

    if (isAlive) {
      if (neighborCount <= 1) { // one or no neighbors
        // death by solitude
        shouldLive = false;
      } else if (neighborCount >= 4) { // four or more
        // death by overpopulation
        shouldLive = false;
      }
    } else {
      if (neighborCount === 3) {
        // birth
        shouldLive = true;
      }
    }

    nextFrame[i] = shouldLive;

  }

  return nextFrame;
}

function Canvas({
  grid,
  speed
}: {
  grid: Game;
  speed: number;
}) {

  return <div style={{ gridTemplateColumns: `repeat(${GAME_ROW_SIZE}, auto)` }} className={styles.grid}>{grid.map((alive, i) => {
    return <div style={{ transition: `${Math.floor(speed * 0.75)}ms ease-in-out` }} className={clsx(styles.item, alive && styles.alive)} key={i} />
  })}</div>
}

const GAME_SPEEDS = [1000, 500, 250];

export default function Page() {

  const [speed, setSpeed] = useState(400);
  const { tick, isTicking, toggleClock } = useClock(speed);
  const [grid, setGrid] = useState<Game>(generateSeed());

  useEffect(() => {
    setGrid(handleGameOfLifeFrame);
  }, [tick]);

  const Icon = useMemo(() => isTicking ? IoPause : IoPlay, [isTicking]);
  const resetGameState = useCallback(() => setGrid(generateSeed()), []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      switch (event.code) {
        case "Space":
          toggleClock();
          return;
        case 'KeyR':
          resetGameState();
          return;
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [resetGameState, toggleClock]);

  return <div>
    <Head>
      <title>Game of Life</title>
    </Head>
    <Canvas speed={speed} grid={grid} />
    <div className={styles.nav}>
      <Link className={styles.link} href='https://elijahcobb.dev' target='_blank'>
        <IoPersonCircle className={styles.avatar} />
      </Link>
      <div className={styles.controls}>
        <button onClick={resetGameState}>
          <IoRefresh size={24} />
        </button>
        <button
          onClick={toggleClock}
        >
          <Icon size={24} />
        </button>
      </div>
    </div>
  </div>
}