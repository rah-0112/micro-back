// require('@tensorflow/tfjs-node');

// import adminRoutes from './routes/admin';
// import studentRoutes from './routes/student';
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

import FaceModel from './mongoose_models/faceModel.js';
import StudentModel from './mongoose_models/studentModel.js';


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

async function LoadModels() {
    // Load the models
    // __dirname gives the root directory of the server
    const __dirname = path.dirname(__filename);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(__dirname + "/models");
    await faceapi.nets.faceLandmark68Net.loadFromDisk(__dirname + "/models");
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(__dirname + "/models");
}
LoadModels();

// app.use('/ad', adminRoutes);
// app.use('/st', studentRoutes);


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
        const createFace = new FaceModel({
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
    let faces = await FaceModel.find();
    for (i = 0; i < faces.length; i++) {
        // Change the face data descriptors from Objects to Float32Array type
        for (j = 0; j < faces[ i ].descriptions.length; j++) {
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

    StudentModel.findOne({ name: result[ 0 ].label })
        .then((stud) => {
            if (stud !== null) {
                stud.noOfDays = stud.noOfDays + 1;
                const updated = StudentModel.findByIdAndUpdate(stud._id, stud, { new: true });
                res.json({ updated });
            }
        })
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
