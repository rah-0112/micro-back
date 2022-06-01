// require('@tensorflow/tfjs-node');
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import express from "express";
import cors from "cors";
import faceapi from "face-api.js";
import mongoose from "mongoose"
import pkg from 'canvas';
const { Canvas, Image } = pkg;
import canvas from "canvas";
import fileUpload from "express-fileupload";

import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import Face from './mongoose_models/faceModel.js';
import Student from './mongoose_models/studentModel.js';
import Admin from './mongoose_models/adminModel.js';

const router1 = express.Router();
const router2 = express.Router();

faceapi.env.monkeyPatch({ Canvas, Image });
const __filename = fileURLToPath(import.meta.url);

const app = express();
dotenv.config();

app.use(bodyParser.json({ limit: '30mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));
app.use(cors());
app.use(
    fileUpload({
        useTempFiles: true
    })
);

app.use('/ad', router1);
app.use('/st', router2);

async function LoadModels() {
    // Load the models
    // __dirname gives the root directory of the server
    const __dirname = path.dirname(__filename);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(__dirname + "/models");
    await faceapi.nets.faceLandmark68Net.loadFromDisk(__dirname + "/models");
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(__dirname + "/models");
}
LoadModels();


const signinAd = async (req, res) => {

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

const signupAd = async (req, res) => {
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

const students = async (req, res) => {
    const { adminEmail } = req.body;
    const admin = await Admin.findOne({ email: adminEmail });
    await Student.find({ admin })
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

const signin = async (req, res) => {

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

const signup = async (req, res) => {
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

router1.post('/signin', signinAd);
router1.post('/signup', signupAd);
router1.post('/students', students);

router2.post('/signin', signin);
router2.post('/signup', signup);

async function uploadLabeledImages(images, label) {
    try {

        const descriptions = [];
        // Loop through the images
        for (let i = 0; i < images.length; i++) {
            const img = await canvas.loadImage(images[ i ]);
            // Read each face and save the face descriptions in the descriptions array
            const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
            descriptions.push(detections.descriptor);
        }

        // Create a new face document with the given label and save it in DB
        const createFace = new Face({
            label: label,
            descriptions: descriptions,
        });

        await createFace.save();
        return true;
    } catch (error) {
        console.log(error);
        return (error);
    }
}

async function getDescriptorsFromDB(image) {
    // Get all the face data from mongodb and loop through each of them to read the data
    let faces = await Face.find();
    for (let i = 0; i < faces.length; i++) {
        // Change the face data descriptors from Objects to Float32Array type
        for (let j = 0; j < faces[ i ].descriptions.length; j++) {
            faces[ i ].descriptions[ j ] = new Float32Array(Object.values(faces[ i ].descriptions[ j ]));
        }
        // Turn the DB face docs to
        faces[ i ] = new faceapi.LabeledFaceDescriptors(faces[ i ].label, faces[ i ].descriptions);
    }

    // Load face matcher to find the matching face
    const faceMatcher = new faceapi.FaceMatcher(faces, 0.6);

    // Read the image using canvas or other method
    const img = await canvas.loadImage(image);
    let temp = faceapi.createCanvasFromMedia(img);
    // Process the image for the model
    const displaySize = { width: img.width, height: img.height };
    faceapi.matchDimensions(temp, displaySize);

    // Find matching faces
    const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const results = resizedDetections.map((d) => faceMatcher.findBestMatch(d.descriptor));
    return results;
}

app.post("/post-face", async (req, res) => {
    const File1 = req.files.File1.tempFilePath
    const File2 = req.files.File2.tempFilePath
    const File3 = req.files.File3.tempFilePath
    const label = req.body.label
    let result = await uploadLabeledImages([ File1, File2, File3 ], label);
    if (result) {
        res.json({ message: "Face data stored successfully" })
    } else {
        res.json({ message: "Something went wrong, please try again." })
    }
})

app.post("/check-face", async (req, res) => {
    const File1 = req.files.File1.tempFilePath;
    let result = await getDescriptorsFromDB(File1);
    // let result = "Rahul Gunaseelan";
    console.log({ result });
    // console.log({ name: result[ 0 ].label });

    // Student.findOne({ name: result[ 0 ].label })
    //     .then((stud) => {
    //         if (stud !== null) {
    //             stud.noOfDays = stud.noOfDays + 1;
    //             const updated = StudentModel.findByIdAndUpdate(stud._id, stud, { new: true });
    //             res.json({ updated });
    //         }
    //     })
});

app.get('/', (req, res) => {
    res.status(200).send('Hello');
})

const CONNECTION_URL = 'mongodb+srv://rahul:A5U5n3GKyrDomEBZ@cluster0.aerwvyn.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(
    CONNECTION_URL,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
).then(() => {
    app.listen(process.env.PORT || 5000);
    console.log("DB connected and server us running.");
}).catch((err) => {
    console.log(err);
});
