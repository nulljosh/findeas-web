const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const User = require('./app/models/User');
const Post = require('./app/models/Post');
const { generateToken, verifyToken, optionalAuth } = require('./middleware/auth');
const { validateUser, validatePost, validateLogin, validateObjectId, validateUsername } = require('./middleware/validation');

const app = express();

// Constants
const PORT = process.env.PORT || 3030;
const DATABASE = process.env.DATABASE || 'mongodb://127.0.0.1:27017/findeas';

// Database Connection
mongoose.connect(DATABASE)
    .then(() => console.log(`Connected to database: ${DATABASE}`))
    .catch((err) => console.error('Error connecting to database:', err));

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again later.'
});

// Middleware
app.use(express.static(`${__dirname}/public`));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));

// Routes
// Health check
app.get('/', (req, res) => res.sendStatus(200));

// Authentication routes
app.post('/auth/register', authLimiter, validateUser, async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email: email || null }] 
        });
        
        if (existingUser) {
            return res.status(409).json({ 
                error: existingUser.username === username ? 
                    'Username already exists' : 'Email already exists' 
            });
        }
        
        const user = await User.create({ username, password, email });
        const token = generateToken(user._id);
        
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: user.toSafeObject()
        });
    } catch (err) {
        console.error('Error creating user:', err);
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(409).json({ error: `${field} already exists` });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.post('/auth/login', authLimiter, validateLogin, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        user.lastLogin = new Date();
        await user.save();
        
        const token = generateToken(user._id);
        
        res.json({
            message: 'Login successful',
            token,
            user: user.toSafeObject()
        });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Create a new post
app.post('/posts', verifyToken, validatePost, async (req, res) => {
    try {
        const { title, content, category } = req.body;
        
        const post = await Post.create({
            title,
            content,
            category,
            author: req.user._id
        });
        
        // Add post to user's posts array
        await User.findByIdAndUpdate(req.user._id, {
            $push: { posts: post._id }
        });
        
        const populatedPost = await Post.findById(post._id)
            .populate('author', 'username createdAt')
            .lean();
            
        res.status(201).json({
            message: 'Post created successfully',
            post: populatedPost
        });
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Get all posts with pagination and sorting
app.get('/posts', optionalAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const sort = req.query.sort || 'score'; // score, newest, oldest
        const category = req.query.category;
        
        const skip = (page - 1) * limit;
        
        let sortOption = {};
        switch (sort) {
            case 'newest':
                sortOption = { createdAt: -1 };
                break;
            case 'oldest':
                sortOption = { createdAt: 1 };
                break;
            case 'score':
            default:
                sortOption = { score: -1, createdAt: -1 };
                break;
        }
        
        const filter = category ? { category } : {};
        
        const posts = await Post.find(filter)
            .populate('author', 'username createdAt')
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .lean();
            
        const total = await Post.countDocuments(filter);
        
        res.json({
            posts,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Get user profile (protected endpoint)
app.get('/users/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('posts', 'title score upvotes createdAt')
            .lean();
            
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        delete user.password;
        delete user.votedPosts;
        
        res.json({ user });
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

// Admin endpoint - Delete all users (DANGEROUS - should be protected)
app.delete('/admin/users', verifyToken, async (req, res) => {
    try {
        // This should have additional admin role checking in production
        if (req.user.username !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const response = await User.deleteMany({});
        res.json({ 
            message: `Deleted ${response.deletedCount} users`,
            deletedCount: response.deletedCount 
        });
    } catch (err) {
        console.error('Error deleting users:', err);
        res.status(500).json({ error: 'Failed to delete users' });
    }
});

// Delete own account
app.delete('/users/me', verifyToken, async (req, res) => {
    try {
        // Delete user's posts first
        await Post.deleteMany({ author: req.user._id });
        
        // Delete the user
        await User.findByIdAndDelete(req.user._id);
        
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});


// Voting endpoints
app.post('/posts/:id/vote', verifyToken, validateObjectId, async (req, res) => {
    try {
        const { id } = req.params;
        const { vote } = req.body; // 'up' or 'down'
        
        if (!['up', 'down'].includes(vote)) {
            return res.status(400).json({ error: 'Vote must be "up" or "down"' });
        }
        
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Check if user already voted
        const existingVoteIndex = post.voters.findIndex(
            v => v.user.toString() === req.user._id.toString()
        );
        
        let previousVote = null;
        if (existingVoteIndex !== -1) {
            previousVote = post.voters[existingVoteIndex].vote;
            
            // If same vote, remove it (toggle off)
            if (previousVote === vote) {
                post.voters.splice(existingVoteIndex, 1);
                if (vote === 'up') post.upvotes--;
                else post.downvotes--;
            } else {
                // Change vote
                post.voters[existingVoteIndex].vote = vote;
                if (previousVote === 'up') {
                    post.upvotes--;
                    post.downvotes++;
                } else {
                    post.downvotes--;
                    post.upvotes++;
                }
            }
        } else {
            // New vote
            post.voters.push({ user: req.user._id, vote });
            if (vote === 'up') post.upvotes++;
            else post.downvotes++;
        }
        
        // Update milestones
        const milestonesUpdated = post.updateMilestones();
        
        await post.save();
        
        // Update user's voted posts
        const userVoteIndex = req.user.votedPosts.findIndex(
            vp => vp.post.toString() === id
        );
        
        if (existingVoteIndex === -1 || previousVote !== vote) {
            if (userVoteIndex !== -1) {
                if (existingVoteIndex === -1) {
                    // Remove from user's voted posts if vote was removed
                    req.user.votedPosts.splice(userVoteIndex, 1);
                } else {
                    // Update user's vote record
                    req.user.votedPosts[userVoteIndex].vote = vote;
                }
            } else if (existingVoteIndex !== -1) {
                // Add new vote record
                req.user.votedPosts.push({ post: id, vote });
            }
            await req.user.save();
        }
        
        res.json({
            message: 'Vote recorded',
            post: {
                _id: post._id,
                upvotes: post.upvotes,
                downvotes: post.downvotes,
                score: post.score,
                status: post.status
            },
            milestonesUpdated
        });
    } catch (err) {
        console.error('Error voting on post:', err);
        res.status(500).json({ error: 'Failed to vote on post' });
    }
});

// Get single post with details
app.get('/posts/:id', optionalAuth, validateObjectId, async (req, res) => {
    try {
        const { id } = req.params;
        
        const post = await Post.findByIdAndUpdate(
            id,
            { $inc: { views: 1 } },
            { new: true }
        ).populate('author', 'username createdAt').lean();
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // If user is authenticated, include their vote
        let userVote = null;
        if (req.user) {
            const vote = post.voters.find(
                v => v.user.toString() === req.user._id.toString()
            );
            userVote = vote ? vote.vote : null;
        }
        
        res.json({
            post: {
                ...post,
                userVote
            }
        });
    } catch (err) {
        console.error('Error fetching post:', err);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// Milestone tracking endpoints
app.get('/milestones', async (req, res) => {
    try {
        const milestones = await Post.aggregate([
            {
                $match: {
                    'milestones.reached': true
                }
            },
            {
                $unwind: '$milestones'
            },
            {
                $match: {
                    'milestones.reached': true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            {
                $unwind: '$author'
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    upvotes: 1,
                    score: 1,
                    status: 1,
                    'author.username': 1,
                    'milestones.threshold': 1,
                    'milestones.reachedAt': 1,
                    'milestones.actionTriggered': 1,
                    createdAt: 1
                }
            },
            {
                $sort: { 'milestones.reachedAt': -1 }
            }
        ]);
        
        res.json({ milestones });
    } catch (err) {
        console.error('Error fetching milestones:', err);
        res.status(500).json({ error: 'Failed to fetch milestones' });
    }
});

app.post('/milestones/:id/trigger', verifyToken, validateObjectId, async (req, res) => {
    try {
        const { id } = req.params;
        const { threshold } = req.body;
        
        // This would typically require admin privileges
        if (req.user.username !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        const milestone = post.milestones.find(m => m.threshold === threshold && m.reached);
        if (!milestone) {
            return res.status(404).json({ error: 'Milestone not found or not reached' });
        }
        
        if (milestone.actionTriggered) {
            return res.status(400).json({ error: 'Action already triggered for this milestone' });
        }
        
        milestone.actionTriggered = true;
        await post.save();
        
        // Here you would typically integrate with external services
        // For now, just log the action
        console.log(`Triggered ${threshold} upvote milestone for post: ${post.title}`);
        console.log(`Action: ${getActionForThreshold(threshold)}`);
        
        res.json({
            message: `Milestone action triggered for ${threshold} upvotes`,
            action: getActionForThreshold(threshold),
            post: {
                _id: post._id,
                title: post.title,
                status: post.status
            }
        });
    } catch (err) {
        console.error('Error triggering milestone action:', err);
        res.status(500).json({ error: 'Failed to trigger milestone action' });
    }
});

function getActionForThreshold(threshold) {
    switch (threshold) {
        case 10:
            return 'Business consultation scheduled';
        case 100:
            return 'Legal incorporation paperwork initiated';
        case 1000:
            return 'Trademark registration and full business setup begun';
        default:
            return 'Custom milestone action';
    }
}

// Get public user profile
app.get('/users/:username', validateUsername, async (req, res) => {
    try {
        const { username } = req.params;
        
        const user = await User.findOne({ username })
            .populate('posts', 'title score upvotes createdAt category')
            .lean();
            
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Return only public information
        const publicUser = {
            _id: user._id,
            username: user.username,
            createdAt: user.createdAt,
            posts: user.posts
        };
        
        res.json({ user: publicUser });
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});