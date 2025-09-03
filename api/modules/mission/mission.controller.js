const missionService = require("./mission.service");
const { connectDB, isConnectionReady } = require("../../db/connect");
const mongoose = require('mongoose');

class MissionController {
  
  // Create a new mission
  async createMission(req, res) {
    try {

    if (!isConnectionReady()) {
        console.log("🔄 Database not ready, connecting...");
        await connectDB();
    }

    const { user_id, location, mission, description, status } = req.body;
    const userObjectId = new mongoose.Types.ObjectId(user_id);

    const missionData = {
        user_id: userObjectId,
        location,
        mission,
        description,
        status
    };

        const createMission = await missionService.createMission(missionData);

        res.status(201).json({
        success: true,
        message: "Mission created successfully",
        data: createMission
    });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all missions
  async getAllMissions(req, res) {
    try {
        if (!isConnectionReady()) {
            console.log("🔄 Database not ready, connecting...");
            await connectDB();
        }
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        user_id: req.query.user_id,
        deleted: req.query.deleted === 'true',
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await missionService.getAllMissions(filters);

      res.status(200).json({
        success: true,
        message: "Missions fetched successfully",
        data: result.missions,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get mission by ID
  async getMissionById(req, res) {
    try {
    if (!isConnectionReady()) {
        console.log("🔄 Database not ready, connecting...");
        await connectDB();
    }
      const { id } = req.params;
      const mission = await missionService.getMissionById(id);

      res.status(200).json({
        success: true,
        message: "Mission fetched successfully",
        data: mission
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update mission
  async updateMission(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user?.id || "000000000000000000000000";

      const mission = await missionService.updateMission(id, updateData, userId);

      res.status(200).json({
        success: true,
        message: "Mission updated successfully",
        data: mission
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('Unauthorized') ? 403 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete mission (soft delete)
  async deleteMission(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || "000000000000000000000000";

      const result = await missionService.deleteMission(id, userId);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('Unauthorized') ? 403 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get current user's missions
  async getUserMissions(req, res) {
    try {
      const userId = req.user?.id || "000000000000000000000000";
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await missionService.getUserMissions(userId, filters);

      res.status(200).json({
        success: true,
        message: "User missions fetched successfully",
        data: result.missions,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Find nearby missions
  async findNearbyMissions(req, res) {
    try {
      const { longitude, latitude } = req.query;
      
      const maxDistance = req.query.maxDistance || 10000;
      const filters = {
        limit: req.query.limit,
        status: req.query.status
      };

      const missions = await missionService.findNearbyMissions(
        parseFloat(longitude), 
        parseFloat(latitude), 
        parseInt(maxDistance),
        filters
      );

      res.status(200).json({
        success: true,
        message: "Nearby missions fetched successfully",
        data: missions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update mission status
  async updateMissionStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user?.id || "000000000000000000000000";

      const mission = await missionService.updateMissionStatus(id, status, userId);

      res.status(200).json({
        success: true,
        message: "Mission status updated successfully",
        data: mission
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('Unauthorized') ? 403 :
                        error.message.includes('Invalid') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get mission stats
  async getMissionStats(req, res) {
    try {
      const userId = req.query.user_id || req.user?.userId;
      const stats = await missionService.getMissionStats(userId);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

// Create an instance of the controller
const missionController = new MissionController();

// Export the instance methods
module.exports = {
  createMission: missionController.createMission.bind(missionController),
  getAllMissions: missionController.getAllMissions.bind(missionController),
  getMissionById: missionController.getMissionById.bind(missionController),
  updateMission: missionController.updateMission.bind(missionController),
  deleteMission: missionController.deleteMission.bind(missionController),
  getUserMissions: missionController.getUserMissions.bind(missionController),
  findNearbyMissions: missionController.findNearbyMissions.bind(missionController),
  updateMissionStatus: missionController.updateMissionStatus.bind(missionController),
  getMissionStats: missionController.getMissionStats.bind(missionController)
};