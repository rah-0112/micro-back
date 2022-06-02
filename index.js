// require('@tensorflow/tfjs-node');
import express from "express";
import cors from "cors";
import faceapi from "face-api.js";
import mongoose from "mongoose"
import pkg from 'canvas';
const { Canvas, Image } = pkg;
import fileUpload from "express-fileupload";
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';
import faceRoutes from './routes/face.js';

faceapi.env.monkeyPatch({ Canvas, Image });
const __filename = fileURLToPath(import.meta.url);
async function LoadModels() {
    // Load the models
    // __dirname gives the root directory of the server
    const __dirname = path.dirname(__filename);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(__dirname + "/models");
    await faceapi.nets.faceLandmark68Net.loadFromDisk(__dirname + "/models");
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(__dirname + "/models");
}
LoadModels();

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

app.get('/', (req, res) => {
    res.status(200).send("Welcome to Attendance API");
})

app.use('/admin', adminRoutes);
app.use('/student', studentRoutes);
app.use('/face', faceRoutes);

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
