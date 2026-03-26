import { useState } from "react";

const Login = ({ onJoin }) => {
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");

  const handleGenerateRoom = () => {
    // Generates a native v4 UUID (e.g., "36b8f84d-df4e...")
    const newId = crypto.randomUUID(); 
    setRoomId(newId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userName.trim() && roomId.trim()) {
      onJoin({ userName, roomId });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Join Whiteboard</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Your Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Room ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 p-2 border rounded"
              placeholder="Enter ID or generate one"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={handleGenerateRoom}
              className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
            >
              Generate
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition"
        >
          Join Room
        </button>
      </form>
    </div>
  );
};

export default Login;