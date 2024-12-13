const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    fullName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    phone:{
        type:Number,
        required:true,
        unique:true,
    },
    gender:{
        type:String,
        enum:["male","female"],
    },
    profilePicture: { 
        type: String,
     },
    resetToken: { 
        type: String, 
        default: null,
    }, 
    resetTokenExpiry: { 
        type: Date, 
        default: null,
     },

});


// convert the password in hashformate 
userSchema.pre('save',async function (next) {
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password,10);
    }
    next();
});



const User = mongoose.model('user',userSchema);

module.exports = User;