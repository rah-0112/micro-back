import express from "express";

import { signin, signup, students } from "../controllers/admin.js";

const router = express.Router();

router.post('/signin', signin);
router.post('/signup', signup);
router.post('/students', students);

export default router;