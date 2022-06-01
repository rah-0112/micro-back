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
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }
}, {
    timestamps: true
});

const Face = mongoose.model("Face", faceSchema);
export default Face;
