const express = require("express");
const missionController = require("./mission.controller");
const { verifyToken } = require("../auth/auth.controller");

const router = express.Router();

// Validation middlewares
// Minimal validation - only checks if fields exist
// Updated validation for string location
const validateCreateMission = (req, res, next) => {
  const errors = [];
  const { mission, description, location } = req.body;

  // Check if mission is not empty
  if (!mission || mission.trim() === '') {
    errors.push({ field: 'mission', message: 'Mission title is required' });
  }

  // Check if description is not empty
  if (!description || description.trim() === '') {
    errors.push({ field: 'description', message: 'Description is required' });
  }

  // Check if location is not empty (now a string)
  if (!location || location.trim() === '') {
    errors.push({ field: 'location', message: 'Location is required' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation errors",
      errors: errors
    });
  }

  next();
};

const validateUpdateMission = (req, res, next) => {
    const errors = [];
  const { mission, description, location } = req.body;

  // Check if mission is not empty
  if (!mission || mission.trim() === '') {
    errors.push({ field: 'mission', message: 'Mission title is required' });
  }

  // Check if description is not empty
  if (!description || description.trim() === '') {
    errors.push({ field: 'description', message: 'Description is required' });
  }

  // Check if location is not empty (now a string)
  if (!location || location.trim() === '') {
    errors.push({ field: 'location', message: 'Location is required' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation errors",
      errors: errors
    });
  }

  next();
};

const validateMongoId = (req, res, next) => {
  if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Invalid mission ID"
    });
  }
  next();
};

const validateNearbyQuery = (req, res, next) => {
  const { longitude, latitude, maxDistance } = req.query;
  const errors = [];

  if (!longitude || isNaN(parseFloat(longitude))) {
    errors.push({ field: 'longitude', message: 'Valid longitude is required' });
  }

  if (!latitude || isNaN(parseFloat(latitude))) {
    errors.push({ field: 'latitude', message: 'Valid latitude is required' });
  }

  if (maxDistance && isNaN(parseInt(maxDistance))) {
    errors.push({ field: 'maxDistance', message: 'Max distance must be a number' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation errors",
      errors: errors
    });
  }

  next();
};

const validateStatusUpdate = (req, res, next) => {
  const errors = [];
  
  if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    errors.push({ field: 'id', message: 'Invalid mission ID' });
  }

  if (!req.body.status) {
    errors.push({ field: 'status', message: 'Status is required' });
  } else {
    const validStatuses = ["pending", "active", "completed", "cancelled", "paused"];
    if (!validStatuses.includes(req.body.status)) {
      errors.push({ field: 'status', message: 'Valid status is required' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation errors",
      errors: errors
    });
  }

  next();
};

// Routes
router.post("/create", verifyToken, validateCreateMission, missionController.createMission);
router.get("/", missionController.getAllMissions);
router.get("/my", verifyToken, missionController.getUserMissions);
router.get("/nearby", validateNearbyQuery, missionController.findNearbyMissions);
router.get("/stats", missionController.getMissionStats);
router.get("/:id", validateMongoId, missionController.getMissionById);
router.put("/:id", verifyToken, validateUpdateMission, missionController.updateMission);
router.patch("/:id/status", verifyToken, validateStatusUpdate, missionController.updateMissionStatus);
router.delete("/:id", verifyToken, validateMongoId, missionController.deleteMission);

module.exports = router;