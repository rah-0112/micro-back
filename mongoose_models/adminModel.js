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
    courses: [ {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    } ]
}, {
    timestamps: true
});

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;


