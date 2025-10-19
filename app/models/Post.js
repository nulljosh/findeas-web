const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 5000
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['tech', 'business', 'social', 'entertainment', 'other'],
        default: 'other'
    },
    upvotes: {
        type: Number,
        default: 0,
        min: 0
    },
    downvotes: {
        type: Number,
        default: 0,
        min: 0
    },
    score: {
        type: Number,
        default: 0
    },
    voters: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        vote: {
            type: String,
            enum: ['up', 'down']
        }
    }],
    milestones: [{
        threshold: {
            type: Number,
            required: true
        },
        reached: {
            type: Boolean,
            default: false
        },
        reachedAt: {
            type: Date
        },
        actionTriggered: {
            type: Boolean,
            default: false
        }
    }],
    status: {
        type: String,
        enum: ['active', 'milestone_10', 'milestone_100', 'milestone_1000', 'incorporated'],
        default: 'active'
    },
    views: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

postSchema.pre('save', function(next) {
    this.score = this.upvotes - this.downvotes;
    next();
});

postSchema.methods.updateMilestones = function() {
    const milestoneThresholds = [10, 100, 1000];
    let updated = false;
    
    milestoneThresholds.forEach(threshold => {
        if (this.upvotes >= threshold) {
            let milestone = this.milestones.find(m => m.threshold === threshold);
            if (!milestone) {
                this.milestones.push({
                    threshold,
                    reached: true,
                    reachedAt: new Date()
                });
                updated = true;
            } else if (!milestone.reached) {
                milestone.reached = true;
                milestone.reachedAt = new Date();
                updated = true;
            }
        }
    });
    
    if (this.upvotes >= 1000) {
        this.status = 'milestone_1000';
    } else if (this.upvotes >= 100) {
        this.status = 'milestone_100';
    } else if (this.upvotes >= 10) {
        this.status = 'milestone_10';
    }
    
    return updated;
};

postSchema.index({ author: 1 });
postSchema.index({ category: 1 });
postSchema.index({ score: -1 });
postSchema.index({ upvotes: -1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);