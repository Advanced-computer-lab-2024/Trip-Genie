const Product = require('../models/product');


const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

const addProduct = async (req, res) => {
    const product = new Product(req.body);
    try {
        await product.save();
        res.status(201).json(product);
        res.send('Product added successfully!');
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


const getProductbyName = async (req, res) => {
    try {
      const product = await Product.findOne({ name: req.params.name });
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  
const sortProductsByRating = async (req, res) => {
  try {
    // Fetch products sorted by rating in descending order
    const products = await Product.find().sort({ rating: -1 }); // Use 1 for ascending order

    // Send the sorted products as a response
    res.status(200).json(products);
  } catch (error) {
    // Handle any errors
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};


  

module.exports = {
  getAllProducts, addProduct , getProductbyName,sortProductsByRating
};