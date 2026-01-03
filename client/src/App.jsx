import React, { useState, useRef } from 'react';
import Toolbar from './components/Toolbar';
import Board from './components/Board';
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(4);
  
  // Reference to the canvas to call clear methods
  const canvasRef = useRef(null);

  const handleToolChange = (newTool) => {
    setTool(newTool);
    if (newTool === 'text') {
      setLineWidth(15);
    } else if(newTool === 'eraser'){
      setLineWidth(40);
    } else if( newTool === 'pencil'){
      setLineWidth(4);
    } else {
      setLineWidth(3);
    }
  };

  const clearCanvas = () => {
  const canvas = canvasRef.current;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Tell the server to clear everyone else's screen
    socket.emit('clear');
  }
};

  return (
    <div className="relative w-screen h-screen bg-white overflow-hidden">
      <Toolbar 
        activeTool={tool} 
        setTool={handleToolChange}
        color={color} 
        setColor={setColor}
        lineWidth={lineWidth}
        setLineWidth={setLineWidth}
        onClear={clearCanvas} 
      />
      
      {/* We pass the ref to Board so App.js can "talk" to the canvas */}
      <Board 
        canvasRef={canvasRef} 
        tool={tool} 
        color={color} 
        lineWidth={lineWidth} 
        socket={socket}
      />
    </div>
  );
}

export default App;