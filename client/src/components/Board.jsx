import { useState, useEffect, useRef } from "react";

const Board = ({
  canvasRef,
  tool,
  color,
  lineWidth,
  socket,
  roomId,
  userName,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState(null);
  const [textState, setTextState] = useState({
    isTyping: false,
    x: 0,
    y: 0,
    text: "",
  });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [usersInRoom, setUsersInRoom] = useState([]);

  const textAreaRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Set size once without using State
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Do NOT add 'tool' or 'lineWidth' to this dependency array
  }, [canvasRef]);

  const drawActualShape = (ctx, tool, start, end) => {
    if (tool === "rect") {
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (tool === "ellipse") {
      const rx = Math.abs(end.x - start.x);
      const ry = Math.abs(end.y - start.y);
      ctx.beginPath();
      ctx.ellipse(start.x, start.y, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    socket.on("user_list", (list) => setUsersInRoom(list));

    socket.on("draw", (data) => {
      const { x, y, prevX, prevY, tool, color, lineWidth } = data;
      ctx.beginPath();
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.strokeStyle = tool === "eraser" ? "white" : color;
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    socket.on("draw_shape", (data) => {
      const { startPos, endPos, tool, color, lineWidth } = data;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      drawActualShape(ctx, tool, startPos, endPos);
    });

    socket.on("draw_text", (data) => {
      const { text, x, y, color, lineWidth } = data;
      ctx.font = `${lineWidth * 2}px Arial`;
      ctx.fillStyle = color;
      ctx.textBaseline = "top";
      ctx.fillText(text, x, y);
    });

    socket.on("clear_canvas", () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off("user_list");
      socket.off("draw");
      socket.off("draw_shape");
      socket.off("draw_text");
      socket.off("clear_canvas");
    };
  }, [socket, canvasRef]);

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

    const newPos = { x, y };
    setCurrentPos(newPos);

    if (tool === "rect" || tool === "ellipse") {
      ctx.putImageData(snapshot, 0, 0); // Restore canvas to show preview
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      drawActualShape(ctx, tool, startPos, newPos);
    } else if (tool === "pencil" || tool === "eraser") {
      ctx.lineTo(x, y);
      ctx.stroke();
      socket.emit("draw", {
        x,
        y,
        prevX: startPos.x,
        prevY: startPos.y,
        tool,
        color,
        lineWidth,
        roomId,
      });
      setStartPos(newPos);
    }
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "text") {
      // If we are already typing, bake the old text first
      if (textState.isTyping && textState.text.length > 0) {
        handleTextBake();
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
    const ctx = canvasRef.current.getContext("2d", {
      willReadFrequently: true,
    });
    setSnapshot(
      ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
    );
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = tool === "eraser" ? "white" : color;
    ctx.lineWidth = lineWidth;
  };

  const handleMouseUp = () => {
    if (isDrawing && (tool === "rect" || tool === "ellipse")) {
      // This emits to OTHERS
      socket.emit("draw_shape", {
        startPos,
        endPos: currentPos,
        tool,
        color,
        lineWidth,
        roomId,
      });
    }
    setIsDrawing(false);
  };

  const handleTextBake = () => {
    if (textState.text.trim() === "") return;

    const ctx = canvasRef.current.getContext("2d");
    ctx.font = `${lineWidth * 2}px Arial`;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    ctx.fillText(textState.text, textState.x, textState.y);

    // EMIT TEXT TO OTHERS
    socket.emit("draw_text", {
      text: textState.text,
      x: textState.x,
      y: textState.y,
      color,
      lineWidth,
      roomId,
    });

    setTextState({ isTyping: false, x: 0, y: 0, text: "" });
  };

  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      <div className="w-64 bg-gray-900 text-white p-6 shadow-2xl z-50 flex flex-col">
        <h3 className="text-xl font-bold mb-6 border-b border-gray-700 pb-2">
          Active Users
        </h3>
        <ul className="space-y-3 flex-1 overflow-y-auto">
          {usersInRoom.map((user, index) => (
            <li
              key={index}
              className="flex items-center gap-2 bg-gray-800 p-2 rounded"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="truncate">
                {user} {user === userName ? "(You)" : ""}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-4 text-xs text-gray-500">
          Room ID: <span className="text-blue-400 font-mono">{roomId}</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp} // Changed from () => setIsDrawing(false)
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
              handleTextBake();
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
