const jwt = require('jsonwebtoken');
const express = require('express');
const User = require('../modele/authModel');
const SECRET_KEY = "Mahendar";
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const multer = require('multer');
// const files = require('../../public/images')

// created token


// const token = jwt.sign({User}, SECRET_KEY, { expiresIn: '1h' })

// console.log(token);
// decode
// const decodes = jwt.decode(token);
// console.log(decodes)



// register
const register = async (req, res) => {

    try {

        const getData = new User(req.body);
        await getData.save();
        // generated tokean
        const token = jwt.sign({ id: getData._id, fullName: getData.fullName, email: getData.email, phone: getData.phone }, SECRET_KEY, { expiresIn: '1h' })
        res.status(200).json({
            message: "user Register Successfully",
            status: true,
            data: getData,
            token,
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "internal server Issue",
            status: true,
            error: error.message,
        })
    }
};


// Login

const login = async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);
    try {
        const getData = await User.findOne({ email });
        if (!getData) return res.status(404).json({ message: "data not found please enter the valid Data", status: false });
        //  compate the password and convert the 
        const isValidpassword = await bcrypt.compare(password, getData.password);

        // generated the token 
        const token = jwt.sign({ id: getData._id, fullName: getData.fullName, email: getData.email, phone: getData.phone }, SECRET_KEY, { expiresIn: '1h' });

        if (isValidpassword) {
            res.status(200).json({
                message: " User Login Successfully ",
                status: true,
                data: getData,
                token,
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server Issue",
            status: false,
            error: error.message,
        })
    }
}


// authentiction
// const authentictionToken = async (req,res,next)=>{
//     const token = req.header('aunthorization')?.split('')[1];
//     if(!token){
//         res.status(401).json({
//             message:"invalid Token",
//             status:false,
//             data:null,
//         });
//     }

//     try{

//         const veriryToken =  jwt.verify(token,SECRET_KEY);
//         const getData =await User.findById(veriryToken.id);
//         if(!getData){
//             res.status(400).json({
//                 message:"User not found",
//                 status:false,

//             });
//         }
//         req.getData= getData;
//         next();
//     }
//     catch(error){
//         console.error(error);
//         res.json({
//             message:"Internal Server Issue",
//             error:error.message,
//         })
//     }
// }

    // aunthentictionToken
    const userVerify = async (req, res, next) => {

        const token = req.header('Authorization')?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                status: false,
                message: 'access denied there is no token provided',
                data:null,
            });
        }

        try {
            // Verify the token
            const verified = jwt.verify(token, SECRET_KEY);
            const user = await User.findById(verified.id);
            console.log(user)
            if (!user) {
                return res.status(404).json({ message: 'User not found',data:user, });
            }
            req.user = user;

            // Proceed to the next middleware or route
            next();
        } catch (err) {

            res.status(403).json({
                message: 'Invalid token',
                status:false,
                data:null,
            });
        }
    };


// forgetPasword
const forget = async (req, res) => {
    try {
        const { email } = req.body;
        const getData = await User.findOne({ email });
        if (!getData) return res.json({ message: "please Enter the Valid Email " });

        // token generate Random token generete
        const generateTokenRandome = (length)=>{
            const charcterAll =  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            token = '';
            for(let i=0;i<length;i++){
                const randomIndex = Math.floor(Math.random() * charcterAll.length);
                token += charcterAll[randomIndex];
            }
            return token;
        }
        // const resetToken = jwt.sign({ id: getData._id, fullName: getData.fullName, email: getData.email, phone: getData.phone }, SECRET_KEY, { expiresIn: '1h' })
        const resetToken = generateTokenRandome(12);
        console.log(resetToken);
        // save the token & expair the token 
        getData.resetToken = resetToken;
        getData.resetTokenExpiry = Date.now() + 3600000;
        await getData.save();

        // create the link 
        // const resetLink = `http://localhost:${PORT}/reset-password?token=${resetToken}`;
        // console.log(`Password reset link: ${resetLink}`);

        const transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "1cba1f601987a3", // Replace with your Mailtrap user
                pass: "9e9a61ae08fdf1"  // Replace with your Mailtrap password
            }
        });

        // Email options
        const resetLink = `http://localhost:8080/api/forget/${resetToken}`;
        const mailOptions = {
            from: 'no-reply@gmail.com',
            to: email,
            subject: 'Password Reset',
            html: `<p>You requested a password reset. Click <a href="${resetLink}">here</a> to reset your password. This link is valid for 1 hour.</p>`,
        };
        // sent the email
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "password reset and sent email", data: email });
    } catch (error) {
        console.error('error', error.message);
        res.status(500).json({ error: "error processing request", error: error.message });
    }
};


// deleteAll 
const deleteAll = async (req, res) => {
    try {
        const { filter } = req.body;
        const getData = await User.deleteMany(filter);
        if (!getData) return res.json({ message: "user not deleter", status: false, error: error.message });
        if (getData) {
            res.json({
                data: getData.end,
                message: "All data  deleter successfully deleted",
            })
        } else {
            res.json("message:Data not deleted")
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "internal Server Issue",
            status: false,
            error: error.message,
        })
    }
};


// Reset Password 
const reset = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long',
                status: false,
                data: null,
            });
        }

        // Find user by reset token and check token expiry
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log(hashedPassword);
        const user = await User.findOneAndUpdate({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }, // Ensure token is not expired
        }, {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
        });

        if (!user) return res.status(400).json({
            message: 'Invalid or expired token',
            status: false,
            data: null,
        });

        res.status(200).json({
            message: 'Password reset successfully',
            status: true,
            data: user,
        });
    } catch (error) {
        console.error('Error resetting password:', error.message);
        res.status(500).json({
            message: 'Error resetting password', error: error.message,
            status: false,
            data: null
        });
    }

};



// changePassword
const changePassword = async (req, res) => {
    const {password, newPassword } = req.body;
    if ( !password || !newPassword || newPassword.length < 6) return res.status(400).json({ message: "please enter the valid email password & new Password", status: false, error: error.message });

    try {
        const userData = await User.findOne({_id:req.user.id});
        if (!userData) return res.status(400).json({ message: "Invalid user ", status: false});

        //  isValid  the passwrods 
        // const isValidPassword = await bcrypt.compare(password, userData.password);
        const isValidPassword = await bcrypt.compare(password,userData.password);
        if (!isValidPassword) {
            return res.json({
                message: "Old Password is incorrect",
                status: false,
                data: null,
            })
        }
        // newPassword changed the has formate 
        const hashNewPassword = await bcrypt.hash(newPassword, 10);
        const updateUser = await User.findOneAndUpdate({_id:req.user.id}, { $set: { password: hashNewPassword } }, { new: true });
        console.log(updateUser);
        if (updateUser) {
            return res.status(200).json({
                message: "New Passwrod Update SuccessFully",
                status: true,
                data: updateUser,
            })
        } else {
            res.status(404).json({
                message: "new Passwrod not updated",
                status: false,
                data: null,
            })
        }


    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server  Issue",
            staus: false,
            error: error.message,
        })
    }
}

// multer

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         return cb(null, "../../public/images")
//     },
//     filename: function (req, file, cb) {
//         return cb(null, `${Date.now()}-${file.originalname}`);
//     },
// });

// const upload = multer({ storage: storage });


// Upload Profiles
// const uploadProfile = async (req, res) => {

//     // console.log(req.body);
//     try {
//         const fileData = new User(req.file);
//         await fileData.save();
//         console.log(req.file);
//         return res.status(200).json({
//             message: "file has been successfully uploaded",
//             status: true,
//             data: fileData,
//         });
//     }

//     catch (error) {
//         console.error(error);
//         res.json({
//             message: "Internal Server Issue",
//             status: false,
//             error: error.message,
//         })
//     }
// }

const uploadProfile = async (req, res) => {
    try {
        // Ensure req.file is provided
        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded.",
                status: false,
            });
        }
        const userId = req.user.id; // Assuming user ID is available via middleware

        // Find the user and update the profilePicture field
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                status: false,
            });
        }

        // Update the user's profile picture
        user.profilePicture = req.file.filename;
        await user.save();

        res.status(200).json({
            message: "Profile picture updated successfully.",
            status: true,
            data: { profilePicture: req.file.filename },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error",
            status: false,
            error: error.message,
        });
    }
};



module.exports = {
    register,
    deleteAll,
    login,
    userVerify,
    forget,
    reset,
    changePassword,
    uploadProfile,

}