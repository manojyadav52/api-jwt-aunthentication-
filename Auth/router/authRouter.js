const express = require('express');
const router = express.Router();
const {register,deleteAll, login,userVerify, forget, reset, changePassword, uploadProfile}= require('./../controller/authController');
const multer = require('multer');
const fs = require("fs");
const path = require("path");


const dir = path.join(__dirname, "../../public/images");

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// defined Multer 

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, dir)
    },
    filename: function (req, file, cb) {
        return cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage: storage });






// here is router defined

router.post('/register',register);
router.put('/alldelete',deleteAll);
router.post('/login',login);
router.get('/userVeryfy',userVerify,(req,res)=>{
    res.json({
        message:"Access",
        user:req.user,
    })
});
router.post('/forget',forget);
router.post('/reset/:token',reset);
router.patch('/changePassword',userVerify,changePassword);
router.post('/uploadProfile',userVerify,upload.single('file'),uploadProfile);




module.exports = router;