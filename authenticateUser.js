const User = require('../models/user');

async function authenticateUser(req, res, next) {
    try {
        //check if user_id is present in the session cookie
        if (!req.session.user_id) {
            res.send('This page requires you to be logged in')
        }

        //query the database to find the user document associated with user_id
        const user = await User.findById(req.session.user_id)

        //attach the user document to the request object
        req.user = user

        //continue to the next middleware or route handler
        next();
    } catch (error) {
        console.error(error)
        res.send(error)
    }
}

module.exports = authenticateUser;
