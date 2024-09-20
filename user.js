const mongoose = require('mongoose')

//userSchema for infinity market users, users will require both name (String) and user_name (String), then also 
//a balance (Number) with a default of 100
const UserSchema  = mongoose.Schema({
    name:{type:String, required:true},
    user_name:{type:String, required:true, unique:true},
    password: { type: String, required: true }, // Added password field
    balance:{type:Number, default:100}
})

//define virtual field "items" to hold the products the user owns
UserSchema.virtual('items', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'owner',
});

UserSchema.set('toJSON',{virtuals:true})
UserSchema.set('toObject', { virtuals: true });

//User is the name of each object using the UserSchema, and these objects will be saved and added into users
const User = mongoose.model('User',UserSchema,'users')

//exports this class
module.exports = User