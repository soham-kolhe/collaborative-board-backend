import mongoose from 'mongoose'; // Use import instead of require

const DrawingSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  data: { type: String, required: true }, 
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Drawing', DrawingSchema); // Use export default