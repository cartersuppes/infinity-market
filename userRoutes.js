//basic imports
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Product = require('../models/product');
const bcrypt = require('bcrypt');
//middleware import, used 
const authenticateUser = require('../middleware/authenticateUser');

// //POST /users
// //this router gets a new User object from the req.body, and that info will then be used to create a new User object in the infinity-market
// //the new User is then saved and his/her's info is then printed to show a successful save to the database
// router.post('/users', (req, res) => {
//     //extract data from request body
//     const { name, user_name, balance } = req.body;
    
//     //create a new user instance with provided data
//     const newUser = new User({
//         name,
//         user_name,
//         balance: balance || 100 //set default balance if not provided
//     });
//     //save the new user to the database
//     newUser.save((error, user) => {
//         if (error) {
//             //print error if there is one
//             console.error(error);
//             res.send(error)
//         } 
//         else {
//         //respond with the created user
//         res.send(user)
//         }
//     });
// });


// POST /users/register
// This route creates a new user in the User collection.
// The route expects the following JSON structure in the request body:
// {
//    "name": "Steve Rogers",
//    "user_name": "steve123",
//    "password": "test"
// }
// The password provided in the request body is hashed using bcrypt before being saved to the database.
// If the balance is not provided, a default value of 100 is used.
// The route responds with the result returned from inserting the record into the User collection, excluding the password.
router.post('/users/register', async (req, res) => {
    try {
        //extract data from request body
        const { name, user_name, password, balance } = req.body

        //hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        //create a new user instance with provided data
        const newUser = new User({
            name,
            user_name,
            password: hashedPassword, //store the hashed password in the database
            balance: balance || 100 //set default balance if not provided
        });

        //save the new user to the database
        const savedUser = await newUser.save()

        //respond with the created user (without sending the password back)
        res.send({
            _id: savedUser._id,
            name: savedUser.name,
            user_name: savedUser.user_name,
            balance: savedUser.balance
        });
    } catch (error) {
        //handle any errors
        console.error(error)
        res.send(error)
    }
});





// POST /users/login
// This route authenticates a user with a valid username and password.
// The route expects the following JSON structure in the request body:
// {
//    "user_name": "steve123",
//    "password": "test"
// }
// If the credentials are invalid, it returns a JSON object with an error message.
// If the credentials are valid, it sets the user_id as a session variable and returns a JSON object with a success message.
router.post('/users/login', async (req, res) => {
    try {
        //extract user_name and password from request body
        const { user_name, password } = req.body

        //find the user with the provided user_name
        const user = await User.findOne({ user_name })

        //if user not found or password does not match, return error message
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.send("Error loggin in. Incorrect username/password.")
        }

        //set user_id as a session variable
        req.session.user_id = user._id;

        //return success message
        res.json({ message: `Successfully logged in. Welcome ${user.name}`});
    } catch (error) {
        //handle any errors
        console.error(error)
        res.send(error)
    }
});






//route to fetch user profile, protected by authenticateUser middleware
router.get('/profile', authenticateUser, async (req, res) => {
    try {
        //access the user object attached to the request by authenticateUser middleware
        const user = req.user
        res.send(`Welcome ${user.name} to your profile page`)
    } catch (error) {
        console.error(error)
        res.send(error)
    }
});






// GET /users/me
// This route should only be accessed by logged-in users. It retrieves the details for the logged-in user,
// along with a list of items they own.
router.get('/users/me', authenticateUser, async (req, res) => {
    try {
        //retrieve details of the logged-in user
        const user = req.user

        //retrieve the list of items owned by the user
        const items = await Product.find({owner: user._id })

        //prepare response object (excluding the password)
        const userDetails = {
            _id: user._id,
            name: user.name,
            user_name: user.user_name,
            balance: user.balance,
            items: items
        };

        //send back the details of the logged-in user in json format
        res.json(userDetails)
    } catch (error) {
        console.error(error)
        res.send('Internal Server Error')
    }
});








//POST /users/logout
//This route allows logged-in users to log out.
//When a logged-in user accesses this route, their session variables associated with the app are delted, logging them out.
//After successful logout, a message is sent back indicating successful logout.
router.post('/users/logout', authenticateUser, (req, res) => {
    try {
        //clear session variables associated with the app to log the user out
        req.session.destroy((err) => {
            if (err) {
                console.error(err);
                return res.send('Error logging out');
            }
            //respond with a message indicating successful logout
            res.json({ message: `Successfully logged out ${req.user.name}` });
        });
    } catch (error) {
        console.error(error);
        res.send('Internal Server Error');
    }
});






// //GET /users
// //this router will simply find all Users and print them out, ignoring their items (not printing them)
// router.get('/users', (req, res) => {
//     //find all users in the database, excluding the items field
//     User.find({}, '-items', (error, users) => {
//         if (error) {
//             //print error message if there is an error
//             console.error(error);
//             res.send(error)
//         } 
//         else {
//             //respond with the list of users
//             res.send(users);
//         }
//     });
// });


//GET /users/:user_name
//this router will find the matching user_name, populate its item fields and execute the query, error messages will be sent if there are issues 
//at any one of these steps. The final print will be the entire User object that was being searched for
router.get('/users/:user_name', (req, res) => {
    //find a user by user_name, populate its items field, and execute the query
    User.findOne({ user_name: req.params.user_name }).populate('items', 'name price').exec((error, user) => {
        if (error) {
            console.error(error);
            res.send(error)
        } 
        else if (!user) {
            //print no user found if there wasn't one found matching the user_name
            res.send("User not found")
        } 
        else {
            //respond with the found user
            res.send(user);
        }
    });
});


// DELETE /users/me
// This route responds to a delete request by deleting the logged-in user. Everything else pretty much works the same was as original route,
// by deleting items also owned by user being deleted
router.delete('/users/me', authenticateUser, (req, res) => {
    try {
        //delete the user from the database
        req.user.remove((error) => {
            if (error) {
                console.error(error);
                return res.send('Error deleting user');
            }

            //delete any items owned by the user from the database
            Product.deleteMany({ owner: req.user._id }, (error) => {
                if (error) {
                    console.error(error);
                    return res.send('Error deleting user items');
                }

                //destroy the session associated with the user
                req.session.destroy((err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Error logging out');
                    }

                    //respond with a success message after user deletion
                    res.send(`User ${req.user.name} and their items successfully deleted`);
                });
            });
        });
    //catch error and send/log error message
    } catch (error) {
        console.error(error);
        res.send(error);
    }
});



//this route returns a list of ALL users along with the items they own, since changed to async await 
router.get('/summary', async (req, res) => {
    try {
        //query all users and populate their items
        const users = await User.find({}).populate('items').exec();
        res.send(users);
    } catch (error) {
        console.error(error);
        res.send(error);
    }
});

//export routes, this will be imported to app.js
module.exports = router;