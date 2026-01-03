import { useState, useEffect, useRef } from "react";


const Board = ({ canvasRef, tool, color, lineWidth, socket }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState(null);
  const [textState, setTextState] = useState({
    isTyping: false,
    x: 0,
    y: 0,
    text: "",
  });

  const textAreaRef = useRef(null);

//   useEffect(() => {
//   const canvas = canvasRef.current;
//   const ctx = canvas.getContext('2d');

//   const setCanvasSize = () => {
//     // 1. Get exact window dimensions
//     const width = window.innerWidth;
//     const height = window.innerHeight;

//     // 2. Save current content to avoid losing it on resize
//     const tempImage = canvas.toDataURL();

//     // 3. Set internal canvas resolution
//     canvas.width = width;
//     canvas.height = height;

//     // 4. Reset context properties (they get lost on resize)
//     ctx.fillStyle = "white";
//     ctx.fillRect(0, 0, canvas.width, canvas.height);
//     ctx.lineCap = 'round';
//     ctx.lineJoin = 'round';

//     // 5. Restore content
//     const img = new Image();
//     img.src = tempImage;
//     img.onload = () => ctx.drawImage(img, 0, 0);
//   };

//   setCanvasSize();
//   window.addEventListener('resize', setCanvasSize);
  
//   return () => window.removeEventListener('resize', setCanvasSize);
// }, [canvasRef]);

  useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');

  socket.on('draw', (data) => {
    // We must deconstruct every property to mirror the sender's brush
    const { x, y, prevX, prevY, tool, color, lineWidth } = data;
    
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'; // True erasing
      // If using the white-background hack: ctx.strokeStyle = 'white';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();
    
    // Reset to default for the local user
    ctx.globalCompositeOperation = 'source-over';
  });

  return () => socket.off('draw');
}, [canvasRef, socket]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [canvasRef]);

  useEffect(() => {
    if (textState.isTyping && textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [textState.isTyping]);

  const handleMouseMove = (e) => {
    if (!isDrawing || tool === "text") return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvasRef.current.getContext("2d");

    if (tool === "rect" || tool === "ellipse") {
      ctx.putImageData(snapshot, 0, 0);
      ctx.strokeStyle = color;
      if (tool === "rect") {
        ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
      } else {
        const rx = Math.abs(x - startPos.x);
        const ry = Math.abs(y - startPos.y);
        ctx.beginPath();
        ctx.ellipse(startPos.x, startPos.y, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      }
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    if (tool === "pencil" || tool === "eraser") {
      ctx.lineTo(x, y);
      ctx.stroke();

      // EMIT TO SERVER
      socket.emit("draw", {
        x,
        y,
        prevX: startPos.x, // We need to track the last point
        prevY: startPos.y,
        tool,
        color,
        lineWidth,
      });
      setStartPos({ x, y });
    }
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "text") {
      // If we are already typing, we "bake" the old text first
      if (textState.isTyping && textState.text.length > 0) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.font = `${lineWidth * 5}px Arial`;
        ctx.fillStyle = color;
        ctx.fillText(textState.text, textState.x, textState.y);
      }

      // Set typing to true and DON'T bake on blur for now
      setTextState({
        isTyping: true,
        x: x,
        y: y,
        text: "",
      });
      return; // Stop here so drawing logic doesn't run
    }

    // DRAWING LOGIC FOR OTHER TOOLS
    setIsDrawing(true);
    setStartPos({ x, y });
    const ctx = canvasRef.current.getContext("2d");
    setSnapshot(
      ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
    );
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = tool === "eraser" ? "white" : color;
    ctx.lineWidth = lineWidth;
  };

  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDrawing(false)}
        className="block w-full h-full touch-none"
        style={{ cursor: tool === "text" ? "text" : "crosshair" }}
      />

      {textState.isTyping && (
        <textarea
          autoFocus
          placeholder="Type..."
          value={textState.text}
          onChange={(e) => setTextState({ ...textState, text: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              // Manually trigger the bake
              const ctx = canvasRef.current.getContext("2d");
              ctx.font = `${lineWidth * 2}px Arial`;
              ctx.fillStyle = color;
              ctx.textBaseline = "top";
              ctx.fillText(textState.text, textState.x, textState.y);
              setTextState({ isTyping: false, x: 0, y: 0, text: "" });
            }
          }}
          style={{
            position: "absolute",
            left: `${textState.x}px`,
            top: `${textState.y}px`,
            fontSize: `${lineWidth * 2}px`,
            color: color,
            background: "transparent",
            border: "1px dashed #3b82f6",
            zIndex: 1000,
            minWidth: "100px",
            outline: "none",
            resize: "none",
            padding: "0",
          }}
        />
      )}
    </div>
  );
};
export default Board;
