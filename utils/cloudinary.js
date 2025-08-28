const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "dctls9z2s",
  api_key: process.env.CLOUDINARY_API_KEY ?? "782836679272578",
  api_secret:
    process.env.CLOUDINARY_API_SECRET ?? "DR7u3ouIyqV65MGDiYjfaHq2HAc",
});

module.exports = cloudinary;
