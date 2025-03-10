require('dotenv').config();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRY_TIME;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS);
const COOKIE_MAX_AGE = parseInt(process.env.COOKIE_MAX_AGE); 

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
            
            const user = await User.findOne({ email });
            
            if (!user) {
                return res.status(400).render('login', { 
                    error: 'Invalid email or password' 
                });
            }
            
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (!isMatch) {
                return res.status(400).render('login', { 
                    error: 'Invalid email or password' 
                });
            }
            
            const token = jwt.sign(
                { 
                    userId: user._id, 
                    username: user.username,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );
            
            res.cookie('token', token, {
                httpOnly: true,
                maxAge: COOKIE_MAX_AGE,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            
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
            
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            
            const newUser = new User({
                username,
                email,
                password: hashedPassword,
                role: 'user' 
            });
            
            await newUser.save();
            console.log('User registered successfully:', username);
            
            res.redirect('/auth/login');
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).render('register', { 
                error: 'Server error during registration. Please try again.' 
            });
        }
    },

    renderProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.userId);
            
            if (!user) {
                return res.status(404).render('error', { message: 'User not found' });
            }
            
            res.render('auth/profile', { 
                user,
                success: req.query.success, 
                error: req.query.error 
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            res.status(500).render('error', { message: 'Failed to load profile' });
        }
    },
    
    updateProfile: async (req, res) => {
        try {
            const { username, email } = req.body;
            
            const existingUser = await User.findOne({
                $or: [
                    { email, _id: { $ne: req.user.userId } },
                    { username, _id: { $ne: req.user.userId } }
                ]
            });
            
            if (existingUser) {
                return res.redirect('/auth/profile?error=Username or email already in use');
            }
            
            // Update user information
            const updatedUser = await User.findByIdAndUpdate(
                req.user.userId,
                { username, email },
                { new: true }
            );
            
            // Update JWT token with new information
            const token = jwt.sign(
                { 
                    userId: updatedUser._id, 
                    username: updatedUser.username,
                    role: updatedUser.role
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );
            
            res.cookie('token', token, {
                httpOnly: true,
                maxAge: COOKIE_MAX_AGE,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            
            res.redirect('/auth/profile?success=Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            res.redirect('/auth/profile?error=Failed to update profile');
        }
    },
    
    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword, confirmNewPassword } = req.body;
            
            if (newPassword !== confirmNewPassword) {
                return res.redirect('/auth/profile?error=New passwords do not match');
            }
            
            const user = await User.findById(req.user.userId);
            
            // Check if current password is correct
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.redirect('/auth/profile?error=Current password is incorrect');
            }
            
            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
            
            // Update password
            await User.findByIdAndUpdate(req.user.userId, { password: hashedPassword });
            
            res.redirect('/auth/profile?success=Password updated successfully');
        } catch (error) {
            console.error('Error changing password:', error);
            res.redirect('/auth/profile?error=Failed to change password');
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