import { generateToken } from "../lib/generateToken.js";
import User from "../models/usermodel.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import jwt from "jsonwebtoken";

export const Signup = async (req, res) => {
  try {
    const { email, fullName, password } = req.body;
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }
    if (!email || !password || !fullName) {
      return res.status(400).json({
        message: "You are required to fill all fields"
      });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword
    });

    if (newUser) {
      const token = generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        message: "User created Successfully",
        token, // Include token in response
        user: {
          _id: newUser._id,
          email: newUser.email,
          fullName: newUser.fullName,
          profilePic: newUser.profilePic
        }
      });
    } else {
      res.status(400).json({
        message: "Error occurred in account creation"
      });
    }
  } catch (error) {
    console.error("Error in signup:", error.message);
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

export const Signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id, res);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token, // Include token in response
      user: { ...user._doc, password: undefined }
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const Signout = async (req, res) => {
  try {
    res.clearCookie("token", { 
      maxAge: 0,
      sameSite: "none",
      secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({ success: true, message: "Signed out successfully" });
  } catch (error) {
    console.error("Signout error:", error);
    res.status(500).json({ success: false, message: "Failed to sign out" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile Picture is required" });
    }

    // Upload to Cloudinary if it's a base64 string
    let imageUrl = profilePic;
    if (profilePic.startsWith('data:image')) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic, {
        folder: 'profile-pics',
        quality: 'auto:good'
      });
      imageUrl = uploadResponse.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: imageUrl },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Failed to update profile"
    });
  }
};

export const checkAuth = (req, res) => {
  try {
    // Make sure to include all user data needed on the frontend
    const userData = {
      ...req.user._doc,
      password: undefined
    };
    res.status(200).json(userData);
  } catch (error) {
    console.error("Error in checking authentication:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};