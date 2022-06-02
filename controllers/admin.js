import Admin from '../mongoose_models/adminModel.js';
import Student from '../mongoose_models/studentModel.js';

export const signinAd = async (req, res) => {

    const { email, password } = req.body;
    try {
        const existingUser = await Admin.findOne({ email });

        if (!existingUser) return res.status(404).json({ message: "User doesn't exist." });

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

        if (!isPasswordCorrect) return res.status(400).json({ message: "Wrong Credentials." });

        const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, 'test', { expiresIn: '1h' });

        res.status(200).json({ result: existingUser, token });

    } catch (error) {
        res.status(500).json({ message: "Something went Wrong." });
    }
}

export const signupAd = async (req, res) => {
    const { firstname, lastname, email, password, confirmPassword, noOfClasses } = req.body;

    try {
        const existingUser = await Admin.findOne({ email });

        if (existingUser) return res.status(404).json({ message: "User already exist." });

        if (password !== confirmPassword) return res.status(400).json({ message: "Password don't match." });

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await Admin.create({ email, password: hashedPassword, name: `${firstname} ${lastname}`, noOfClasses });

        const token = jwt.sign({ email: result.email, id: result._id }, 'test', { expiresIn: '1h' });
        res.status(200).json({ result, token });

    } catch (error) {
        res.status(500).json({ message: "Something went Wrong." });
    }
}

export const students = async (req, res) => {
    const { adminEmail } = req.body;
    const admin = await Admin.findOne({ email: adminEmail });
    await Student.find({ admin })
        .then(
            (students) => {
                if (students === null) {
                    res.status(404).json({ message: 'No students available for the admin' });
                } else {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(students);
                }
            },
            (err) => next(err)
        )
        .catch((err) => next(err));
}