const mongoose = require("mongoose");

const missionSchema = new mongoose.Schema(
  {
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: { type: String }, // ✅ make sure this is String
  mission: { type: String },
  description: { type: String },
  status: { type: String, default: 'pending' },
  deleted: { type: Boolean, default: false },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
  }
);

// Indexes
missionSchema.index({ user_id: 1, status: 1 });
missionSchema.index({ created: -1 });

// Static methods
missionSchema.statics.findActiveByUser = function(userId) {
  return this.find({ 
    user_id: userId, 
    deleted: false, 
    status: { $in: ["pending", "active", "paused"] } 
  });
};

// Instance methods
missionSchema.methods.softDelete = function() {
  this.deleted = true;
  this.status = "cancelled";
  return this.save();
};

missionSchema.methods.activate = function() {
  if (this.status === "pending") {
    this.status = "active";
    return this.save();
  }
  throw new Error("Mission must be in pending status to activate");
};

missionSchema.methods.complete = function() {
  if (["active", "paused"].includes(this.status)) {
    this.status = "completed";
    return this.save();
  }
  throw new Error("Mission must be active or paused to complete");
};

const Mission = mongoose.model("Mission", missionSchema);

module.exports = Mission;