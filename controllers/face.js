import Face from '../mongoose_models/faceModel.js';
import canvas from "canvas";
import faceapi from "face-api.js";
import redis, { createClient } from "redis";

const DEFAULT_EXPIRATION = 3600;
const client = new createClient({ legacyMode: true });
client.connect();

function getOrSetCache(key, cb) {
    return new Promise((resolve, reject) => {
        client.get(key, async (err, data) => {
            if (err) console.error(err);
            if (data != null) return resolve(JSON.parse(data));
            const freshData = await cb();
            client.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(freshData));
            resolve(freshData);
        })
    })
}

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

    const faces = await getOrSetCache('faces', async () => {
        let allFaces = await Face.find();
        return allFaces;
    })
    //let faces = await Face.find();
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

export const postFace = async (req, res) => {
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
}

export const checkFace = async (req, res) => {
    const File1 = req.files.File1.tempFilePath;
    let result = await getDescriptorsFromDB(File1);
    // let result = "Rahul Gunaseelan";
    res.status(200).json({ result });
    // console.log({ name: result[ 0 ].label });

    // Student.findOne({ name: result[ 0 ].label })
    //     .then((stud) => {
    //         if (stud !== null) {
    //             stud.noOfDays = stud.noOfDays + 1;
    //             const updated = StudentModel.findByIdAndUpdate(stud._id, stud, { new: true });
    //             res.json({ updated });
    //         }
    //     })
};