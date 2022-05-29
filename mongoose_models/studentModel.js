import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const studentSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    id: {
        type: String
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    face: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Face'
    },
    noOfDays: {
        type: Number,
        default: 0,
    }
}, {
    timestamps: true
});

export default mongoose.model('Student', studentSchema);


