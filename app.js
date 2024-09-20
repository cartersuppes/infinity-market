const express = require('express')
const session = require('express-session')
const fs= require('fs')
const path = require('path')
const mongoose = require('mongoose')
const Product = require('./models/product.js')
const User = require('./models/user.js')



const userRouter = require('./routers/userRoutes.js')
const productRouter = require('./routers/productRoutes.js')

const app = express()

//express-session middleware
app.use(session({
    secret: 'cjsuppes',
    resave: false,
    saveUninitialized: false
}));

app.listen(3000)

app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs')

app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,'public')))
app.use(express.json())
app.use(userRouter)
app.use(productRouter)




const url = "mongodb+srv://cjsuppes:test1234@cluster0.rwrkoy1.mongodb.net/infinity-market?retryWrites=true&w=majority&appName=Cluster0"

mongoose.connect(url,(err)=>{
    if(err)
        console.log("Error connecting to DB..")
    else
        console.log("Successfully connected to DB..")
})