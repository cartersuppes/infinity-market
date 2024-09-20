//basic imports
const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const User = require('../models/user');
const authenticateUser = require('../middleware/authenticateUser');


/*
 POST /products
 This route allows logged-in users to post products for sale.
 Only logged-in users can access this route, ensuring that products can only be posted by authenticated users.
 The route expects the request body to contain the name and price of the product.
 The logged-in user's information is obtained from the session cookie.
 The route creates a new product instance with the logged-in user's ID as the owner.
 The new product is then saved to the database.
 The response sent back by Mongoose after creating the record is returned to the client.
 */
 router.post('/products', authenticateUser, async (req, res) => {
    try {
        //extract data from request body
        const { name, price } = req.body
  
        //get the logged-in user's ID from the session
        const ownerId = req.user._id;

        //create a new product instance with the logged-in user's ID as the owner
        const newProduct = new Product({
            name,
            price,
            owner: ownerId
        });

        //save the new product to the database
        const product = await newProduct.save();

        //respond with the response sent back by Mongoose after creating the record
        res.send(product)
    } catch (error) {
        //catch and log/send errors
        console.error(error);
        res.send('Server Error')
    }
});



// This route queries all products from the Product collection and returns them as an array. Anyone can have access to this route,
// no login is required 
router.get('/products', async (req, res) => {
    try {
        //query all products from the Product collection in mongo db
        const products = await Product.find({});

        //respond with the array of products
        res.send(products)
    } catch (error) {
        console.error(error)
        res.send('Server Error');
    }
});
  

/*
 POST /products/buy
 The logic for the buy method is to find the Product from the ProductID, the Buyer document from the user_name,
 and the Seller document from the Product document’s owner field. Once it is verified that the buyer and seller are different
 AND that the buyer has sufficient funds to cover the transaction, the product’s owner should be changed to the buyer’s _id,
 and the buyer and seller balances should be updated based on the product's price. This route will return a success message
 based on this buyItem attempt.
  
 Modifications:
 - Only logged-in users can make buy requests.
 - Removed the need for buyer's username from the request body.
 - Return appropriate messages based on the transaction result.
 */
router.post('/products/buy', authenticateUser, async (req, res) => {
    try {
        const { productID } = req.body;
        const buyerId = req.user._id;

        //find the buyer
        const buyer = await User.findById(buyerId);

        //check if the buyer exists
        if (!buyer) {
            return res.json({ msg: 'Buyer not found' });
        }

        //find the product
        const product = await Product.findById(productID);

        //check if the product exists
        if (!product) {
            return res.json({ msg: 'Product not found' });
        }

        //find the seller
        const seller = await User.findById(product.owner);

        //check if the seller exists
        if (!seller) {
            return res.json({ msg: 'Seller not found' });
        }

        //check if the buyer is different from the seller
        if (buyer._id.equals(seller._id)) {
            return res.json({ msg: `Oops, ${buyer.user_name} already owns this item` });
        }

        //check if the buyer has sufficient funds
        if (buyer.balance < product.price) {
            return res.json({ msg: `Oops, ${buyer.user_name} has insufficient funds` });
        }

        //update product's owner
        product.owner = buyer._id;

        //update buyer and seller balances
        buyer.balance -= product.price;
        seller.balance += product.price;

        //save changes to product, buyer, and seller
        await Promise.all([product.save(), buyer.save(), seller.save()]);

        //respond with success message
        res.json({ msg: 'Transaction successful!' });
    } catch (error) {
        console.error(error);
        res.send('Server Error');
    }
});



/*
 DELETE /products/:id
 This route responds to a delete product request. The product ID is passed in the URL as a dynamic parameter. 
 Modifications from original route:
 - The route is now hidden behind authentication. Only logged-in users can access it.
 - An item can only be deleted by its owner.
 - If the deletion is successful, a simple message is returned.
 - If the deletion fails because of unauthorized access, a different message is returned.
 */
router.delete('/products/:id', authenticateUser, async (req, res) => {
    try {
        const productId = req.params.id;
        const ownerId = req.user._id

        //find the product by ID
        const product = await Product.findById(productId)

        //check if the product exists
        if (!product) {
            return res.json({ message: 'Product not found' })
        }

        //check if the logged-in user is the owner of the product
        if (product.owner.toString() !== ownerId.toString()) {
            return res.json({ message: 'You are not authorized to perform this operation' })
        }

        //delete the product
        await Product.findByIdAndDelete(productId)

        //respond with a success message
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.send(' Server Error')
    }
});

//export routes, this will be imported to app.js
module.exports = router;