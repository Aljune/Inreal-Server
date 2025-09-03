const Mission = require("../mission/mission.model");

class MissionService {
  
  // Create a new mission
  async createMission(missionData) {
    try {
      const mission = new Mission(missionData);
      await mission.save();      
      await mission.populate('user_id', 'name email');
      return mission;
    } catch (error) {
      throw new Error(`Failed to create mission: ${error.message}`);
    }
  }

  // Get all missions (with filters)
  async getAllMissions(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        user_id,
        deleted = false,
        sortBy = 'created',
        sortOrder = 'desc'
      } = filters;

      const query = { deleted };
      
      if (status) {
        if (Array.isArray(status)) {
          query.status = { $in: status };
        } else {
          query.status = status;
        }
      }
      
      if (user_id) {
        query.user_id = user_id;
      }

      const skip = (page - 1) * limit;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const missions = await Mission.find(query)
        .populate('user_id', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Mission.countDocuments(query);

      return {
        missions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalMissions: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch missions: ${error.message}`);
    }
  }

  // Get mission by ID
  async getMissionById(missionId) {
    try {
      const mission = await Mission.findOne({ 
        _id: missionId, 
        deleted: false 
      }).populate('user_id', 'name email');
      
      if (!mission) {
        throw new Error('Mission not found');
      }
      
      return mission;
    } catch (error) {
      throw new Error(`Failed to fetch mission: ${error.message}`);
    }
  }

  // Update mission
  async updateMission(missionId, updateData, userId) {
    try {
      const mission = await Mission.findOne({ 
        _id: missionId, 
        deleted: false 
      });
      
      if (!mission) {
        throw new Error('Mission not found');
      }
      
      // Check if user owns the mission
      if (mission.user_id.toString() !== userId.toString()) {
        throw new Error('Unauthorized: You can only update your own missions');
      }
      
      // Don't allow updating certain fields
      const restrictedFields = ['user_id', 'created'];
      restrictedFields.forEach(field => {
        if (updateData.hasOwnProperty(field)) {
          delete updateData[field];
        }
      });
      
      Object.assign(mission, updateData);
      await mission.save();
      
      await mission.populate('user_id', 'name email');
      
      return mission;
    } catch (error) {
      throw new Error(`Failed to update mission: ${error.message}`);
    }
  }

  // Soft delete mission
  async deleteMission(missionId, userId) {
    try {
      const mission = await Mission.findOne({ 
        _id: missionId, 
        deleted: false 
      });
      
      if (!mission) {
        throw new Error('Mission not found');
      }
      
      // Check if user owns the mission
      if (mission.user_id.toString() !== userId.toString()) {
        throw new Error('Unauthorized: You can only delete your own missions');
      }
      
      await mission.softDelete();
      
      return { message: 'Mission deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete mission: ${error.message}`);
    }
  }

  // Get missions by user
  async getUserMissions(userId, filters = {}) {
    try {
      const combinedFilters = { ...filters, user_id: userId };
      return await this.getAllMissions(combinedFilters);
    } catch (error) {
      throw new Error(`Failed to fetch user missions: ${error.message}`);
    }
  }

  // Find nearby missions
  async findNearbyMissions(longitude, latitude, maxDistance = 10000, filters = {}) {
    try {
      const {
        limit = 10,
        status = ["pending", "active"]
      } = filters;

      const missions = await Mission.find({
        deleted: false,
        status: { $in: status },
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseInt(maxDistance)
          }
        }
      })
      .populate('user_id', 'name email')
      .limit(parseInt(limit));

      return missions;
    } catch (error) {
      throw new Error(`Failed to find nearby missions: ${error.message}`);
    }
  }

  // Update mission status
  async updateMissionStatus(missionId, newStatus, userId) {
    try {
      const mission = await Mission.findOne({ 
        _id: missionId, 
        deleted: false 
      });
      
      if (!mission) {
        throw new Error('Mission not found');
      }
      
      // Check if user owns the mission
      if (mission.user_id.toString() !== userId.toString()) {
        throw new Error('Unauthorized: You can only update your own missions');
      }
      
      const validStatuses = ["pending", "active", "completed", "cancelled", "paused"];
      if (!validStatuses.includes(newStatus)) {
        throw new Error('Invalid status');
      }
      
      mission.status = newStatus;
      await mission.save();
      
      await mission.populate('user_id', 'name email');
      
      return mission;
    } catch (error) {
      throw new Error(`Failed to update mission status: ${error.message}`);
    }
  }

  // Get mission statistics
  async getMissionStats(userId) {
    try {
      const query = userId ? { user_id: userId, deleted: false } : { deleted: false };
      
      const stats = await Mission.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      const total = await Mission.countDocuments(query);
      
      const formattedStats = {
        total,
        byStatus: {}
      };
      
      stats.forEach(stat => {
        formattedStats.byStatus[stat._id] = stat.count;
      });
      
      return formattedStats;
    } catch (error) {
      throw new Error(`Failed to get mission statistics: ${error.message}`);
    }
  }
}

module.exports = new MissionService();