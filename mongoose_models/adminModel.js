import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const adminSchema = new Schema({
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
    noOfClasses: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

export default mongoose.model('Admin', adminSchema);


