const mongoose = require('mongoose')

//ProductSchema for infinity market products, products will require both name (String) and price (String), then also 
//an owner of type User
const ProductSchema  = mongoose.Schema({
    name:{type:String, required:true},
    price:{type:Number, required:true},
    owner: {type:mongoose.Schema.Types.ObjectId, ref: 'User'}
})

ProductSchema.set('toJSON',{virtuals:true})
ProductSchema.set('toObject',{virtuals:true})

//Product is the name of each object using the ProductSchema, and these objects will be saved and added into users
const Product = mongoose.model('Product',ProductSchema,'items')

//exports this class
module.exports = Product