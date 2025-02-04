import React, { useEffect, useRef, useState } from 'react';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
}

interface Obstacle {
  x: number;
  width: number;
  height: number;
}

const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const GROUND_HEIGHT = 400;
const OBSTACLE_SPEED = 5;
const MIN_OBSTACLE_SPACING = 500; // Increased from 300
const MAX_OBSTACLE_SPACING = 800; // Increased from 500
const MIN_DISTANCE_BETWEEN_OBSTACLES = 400; // New constant

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [player, setPlayer] = useState<GameObject>({
    x: 50,
    y: GROUND_HEIGHT - 40,
    width: 40,
    height: 40,
    velocityY: 0,
  });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [isJumping, setIsJumping] = useState(false);
  const [score, setScore] = useState(0);

  const resetGame = () => {
    setGameOver(false);
    setPlayer({
      x: 50,
      y: GROUND_HEIGHT - 40,
      width: 40,
      height: 40,
      velocityY: 0,
    });
    setObstacles([]);
    setScore(0);
    setIsJumping(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver && e.code === 'Space') {
        resetGame();
        return;
      }

      if ((e.code === 'Space' || e.code === 'ArrowUp') && !isJumping && !gameOver) {
        setPlayer(prev => ({ ...prev, velocityY: JUMP_FORCE }));
        setIsJumping(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isJumping, gameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || gameOver) return;

    let animationFrameId: number;
    let lastTimestamp = 0;
    let obstacleSpawnTimer = 0;

    const createObstacle = () => {
      const width = 30 + Math.random() * 20;
      const height = 50 + Math.random() * 50;
      return {
        x: canvas.width,
        width,
        height,
      };
    };

    const canSpawnObstacle = () => {
      if (obstacles.length === 0) return true;
      const lastObstacle = obstacles[obstacles.length - 1];
      return lastObstacle.x < canvas.width - MIN_DISTANCE_BETWEEN_OBSTACLES;
    };

    const checkCollision = (player: GameObject, obstacle: Obstacle) => {
      return (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y + player.height > GROUND_HEIGHT - obstacle.height
      );
    };

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      obstacleSpawnTimer += deltaTime;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new obstacles
      if (obstacleSpawnTimer > MIN_OBSTACLE_SPACING + Math.random() * (MAX_OBSTACLE_SPACING - MIN_OBSTACLE_SPACING)) {
        if (canSpawnObstacle()) {
          setObstacles(prev => [...prev, createObstacle()]);
          obstacleSpawnTimer = 0;
        }
      }

      // Update obstacles
      setObstacles(prev => 
        prev
          .map(obstacle => ({ ...obstacle, x: obstacle.x - OBSTACLE_SPEED }))
          .filter(obstacle => obstacle.x + obstacle.width > 0)
      );

      // Update player position
      setPlayer(prev => {
        const newY = prev.y + prev.velocityY;
        const newVelocityY = prev.velocityY + GRAVITY;

        // Ground collision
        if (newY >= GROUND_HEIGHT - prev.height) {
          setIsJumping(false);
          return {
            ...prev,
            y: GROUND_HEIGHT - prev.height,
            velocityY: 0,
          };
        }

        return {
          ...prev,
          y: newY,
          velocityY: newVelocityY,
        };
      });

      // Check collisions
      obstacles.forEach(obstacle => {
        if (checkCollision(player, obstacle)) {
          setGameOver(true);
        }
      });

      // Draw ground
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(0, GROUND_HEIGHT, canvas.width, 2);

      // Draw obstacles
      ctx.fillStyle = '#e53e3e';
      obstacles.forEach(obstacle => {
        ctx.fillRect(
          obstacle.x,
          GROUND_HEIGHT - obstacle.height,
          obstacle.width,
          obstacle.height
        );
      });

      // Draw player
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(player.x, player.y, player.width, player.height);

      // Draw score
      ctx.fillStyle = '#1a202c';
      ctx.font = '24px Arial';
      ctx.fillText(`Score: ${score}`, 20, 40);

      // Increment score
      if (deltaTime) {
        setScore(prev => prev + Math.floor(deltaTime / 100));
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [player, obstacles, score, gameOver]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="bg-gray-100 rounded-lg shadow-lg"
      />
      <div className="text-gray-600 text-center">
        {gameOver ? (
          <p className="text-red-600 font-bold">
            Game Over! Score: {score}. Press Space to play again.
          </p>
        ) : (
          <p>Press <span className="font-bold">Space</span> or <span className="font-bold">↑</span> to jump</p>
        )}
      </div>
    </div>
  );
}