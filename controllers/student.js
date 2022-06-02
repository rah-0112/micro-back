import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import Student from '../mongoose_models/studentModel.js';
import Admin from '../mongoose_models/adminModel.js';
import Face from '../mongoose_models/faceModel.js';

export const signin = async (req, res) => {

    const { email, password } = req.body;
    try {
        const existingUser = await Student.findOne({ email });

        if (!existingUser) return res.status(404).json({ message: "User doesn't exist." });

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

        if (!isPasswordCorrect) return res.status(400).json({ message: "Wrong Credentials." });

        const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, 'test', { expiresIn: '1h' });

        res.status(200).json({ result: existingUser, token });

    } catch (error) {
        res.status(500).json({ message: "Something went Wrong." });
    }
}

export const signup = async (req, res) => {
    const { firstname, lastname, email, password, confirmPassword, adminEmail } = req.body;

    try {
        const existingUser = await Student.findOne({ email });

        if (existingUser) return res.status(404).json({ message: "User already exist." });

        if (password !== confirmPassword) return res.status(400).json({ message: "Password don't match." });

        const hashedPassword = await bcrypt.hash(password, 12);

        const admin_id = await Admin.findOne({ email: adminEmail });

        const face_id = await Face.findOne({ label: `${firstname} ${lastname}` });

        const result = await Student.create({ email, password: hashedPassword, name: `${firstname} ${lastname}`, admin: admin_id, face: face_id });

        const token = jwt.sign({ email: result.email, id: result._id }, 'test', { expiresIn: '1h' });

        res.status(200).json({ result, token });

    } catch (error) {
        res.status(500).json({ message: "Something went Wrong." });
    }
}