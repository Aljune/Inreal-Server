const express = require("express");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = express.Router();

// GET /users - List all users
router.get("/", async (req, res) => {
    const users = await prisma.users.findMany({
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            place: true,
            user_type: true,
            preferences: true,
            verify: true,
            verification_token: true,
            verified_at: true,
            image: true,
            qr_code: true,
            created_at: true,
            updated_at: true,
            deleted_at: true,
        },
    });
    res.json(users);
});



module.exports = router;
