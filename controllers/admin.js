import Admin from '../mongoose_models/adminModel';
import Student from '../mongoose_model/studentModel';

export const signin = async (req, res) => {

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

export const signup = async (req, res) => {
    const { firstname, lastname, email, password, confirmPassword, noOfClasses } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) return res.status(404).json({ message: "User already exist." });

        if (password !== confirmPassword) return res.status(400).json({ message: "Password don't match." });

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await User.create({ email, password: hashedPassword, name: `${firstname} ${lastname}`, noOfClasses });

        const token = jwt.sign({ email: result.email, id: result._id }, 'test', { expiresIn: '1h' });
        res.status(200).json({ result, token });

    } catch (error) {
        res.status(500).json({ message: "Something went Wrong." });
    }
}

export const students = async (req, res) => {
    const { admin_id } = req.body;
    await Student.find({ admin: admin_id })
        .populate("admin")
        .then(
            (students) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(students);
            },
            (err) => next(err)
        )
        .catch((err) => next(err));
}
