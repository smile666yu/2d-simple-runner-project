import React from 'react';
import { Game } from './components/Game';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">2D Jump Game</h1>
      <Game />
    </div>
  );
}

export default App;