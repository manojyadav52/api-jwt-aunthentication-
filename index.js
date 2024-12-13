const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT =8080;
const userRouter = require('./Auth/router/authRouter');


app.use(express.json());
app.use(express.urlencoded({extended:true}));

// connect the database
mongoose.connect('mongodb://localhost:27017/pro1-jwt',
{useNewUrlParser: true, useUnifiedTopology:true});



app.use('/api',userRouter);

app.listen(PORT,(req,res)=>console.log(`Server will be listening the ${PORT}`));
