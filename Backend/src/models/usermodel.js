import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email:{
        type : String,
        required : true,
        unique: true
    },
    fullName:{
        type : String,
        required: true,
    },
    password:{
        required: true,
        type : String,
        minlength : 6
    },
    profilePic:{
        type: String,
        required: false
    },
}, {timestamps:true})

const User  = mongoose.model("User", userSchema)

export default User