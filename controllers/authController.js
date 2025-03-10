require('dotenv').config();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Configuration constants from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRY_TIME || '1h';
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10');
const COOKIE_MAX_AGE = parseInt(process.env.COOKIE_MAX_AGE || '3600000'); // 1 hour default

const authController = {
    renderLogin: (req, res) => {
        res.render('login', { error: null });
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).render('login', { 
                    error: 'Email and password are required' 
                });
            }
            
            // Find the user by email
            const user = await User.findOne({ email });
            
            // If user doesn't exist
            if (!user) {
                return res.status(400).render('login', { 
                    error: 'Invalid email or password' 
                });
            }
            
            // Compare passwords directly with bcrypt
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (!isMatch) {
                return res.status(400).render('login', { 
                    error: 'Invalid email or password' 
                });
            }
            
            // Generate JWT token with user info and role
            const token = jwt.sign(
                { 
                    userId: user._id, 
                    username: user.username,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );
            
            // Send token in HTTP-only cookie
            res.cookie('token', token, {
                httpOnly: true,
                maxAge: COOKIE_MAX_AGE,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            
            // Redirect to home page
            res.redirect('/');
            
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).render('login', { 
                error: 'An error occurred during login. Please try again.' 
            });
        }
    },

    renderRegister: (req, res) => {
        res.render('register', { error: null });
    },

    register: async (req, res) => {
        try {
            const { username, email, password, RepeatPassword } = req.body;
            
            console.log('Registration attempt:', { username, email });
            
            if (password !== RepeatPassword) {
                return res.status(400).render('register', { 
                    error: 'Passwords do not match' 
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ 
                $or: [
                    { email: email },
                    { username: username }
                ]
            });
            
            if (existingUser) {
                return res.status(400).render('register', { 
                    error: 'User with this email or username already exists' 
                });
            }
            
            // Hash the password - this was missing in your original code
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            
            // Create new user with role field
            const newUser = new User({
                username,
                email,
                password: hashedPassword,
                role: 'user' // Default role
            });
            
            // Save user to database
            await newUser.save();
            console.log('User registered successfully:', username);
            
            // Redirect to login page
            res.redirect('/auth/login');
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).render('register', { 
                error: 'Server error during registration. Please try again.' 
            });
        }
    },

    logout: (req, res) => {
        // Clear the JWT cookie
        res.clearCookie('token');
        
        // Redirect to login page
        res.redirect('/auth/login');
    }
};

module.exports = authController;