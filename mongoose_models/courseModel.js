import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const courseSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    noOfClasses: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    id: {
        type: String
    },
}, {
    timestamps: true
});

const Course = mongoose.model('Course', courseSchema);
export default Course;


