const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./app/models/User');
const Post = require('./app/models/Post');

const app = express();

// Constants
const PORT = process.env.PORT || 3030;
const DATABASE = process.env.DATABASE || 'mongodb://127.0.0.1:27017/findeas';

// Database Connection
mongoose.connect(DATABASE)
    .then(() => console.log(`Connected to database: ${DATABASE}`))
    .catch((err) => console.error('Error connecting to database:', err));

// Middleware
app.use(express.static(`${__dirname}/public`));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
// Health check
app.get('/', (req, res) => res.sendStatus(200));

// Create a new post
app.post('/post', async (req, res) => {
    const { content, author } = req.body;

    if (!content) return res.status(400).send({ error: 'No content provided' });
    if (!author) return res.status(400).send({ error: 'No author provided' });

    try {
        const createdPost = await Post.create({ content, author });
        res.status(201).send(createdPost);
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).send({ error: 'Failed to create post' });
    }
});

// Get all posts
app.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find();
        res.status(200).send(posts);
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).send({ error: 'Failed to fetch posts' });
    }
});

// Get all users
app.get('/users.json', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send({ error: 'Failed to fetch users' });
    }
});

// Delete all users
app.delete('/delete/users.json', async (req, res) => {
    try {
        const response = await User.deleteMany();
        res.status(200).send(response);
    } catch (err) {
        console.error('Error deleting users:', err);
        res.status(500).send({ error: 'Failed to delete users' });
    }
});

// Delete user by username
app.delete('/delete/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const result = await User.deleteOne({ username });
        if (result.deletedCount > 0) {
            res.status(200).send({ message: `User ${username} deleted successfully` });
        } else {
            res.status(404).send({ error: `User ${username} not found` });
        }
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send({ error: 'Failed to delete user' });
    }
});

// Create a new user
app.post('/user', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ error: 'No credentials supplied' });
    }

    try {
        const newUser = await User.create({ username, password });
        console.log(`New user created: ${username}`);
        res.status(201).send(newUser);
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).send({ error: 'Failed to create user' });
    }
});

// Get user by username
app.get('/:username', async (req, res) => {
    const { username } = req.params;

    if (!username) return res.status(400).send({ error: 'No username provided' });

    try {
        const user = await User.findOne({ username });
        if (user) {
            res.status(200).send({ username: user.username, _id: user._id });
        } else {
            res.status(404).send({ error: 'User not found' });
        }
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).send({ error: 'Failed to fetch user' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});