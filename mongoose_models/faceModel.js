import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const faceSchema = new Schema({
    label: {
        type: String,
        required: true,
        unique: true
    },
    descriptions: {
        type: Array,
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model("Face", faceSchema);
