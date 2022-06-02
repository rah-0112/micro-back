import express from "express";
import { postFace, checkFace } from "../controllers/face.js";

const router = express.Router();

router.post('/post-face', postFace);
router.post('/check-face', checkFace);

export default router;