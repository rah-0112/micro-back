import express from "express";
import { signinAd, signupAd, students } from "../controllers/admin.js";

const router = express.Router();

router.post('/signin', signinAd);
router.post('/signup', signupAd);
router.post('/students', students);

export default router;