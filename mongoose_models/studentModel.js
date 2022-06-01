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
    courses: [ {
        courseName: { type: String },
        attendedDays: { type: Number, default: 0 }
    } ]
}, {
    timestamps: true
});

const Student = mongoose.model('Student', studentSchema);
export default Student;

