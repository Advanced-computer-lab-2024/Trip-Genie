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
    // Use Mongoose's aggregation pipeline to calculate the average rating and sort products by it
    const products = await Product.aggregate([
      // Add a field for the average rating based on the reviews array
      {
        $addFields: {
          averageRating: { $avg: "$reviews.rating" }
        }
      },
      // Sort the products by the averageRating field in descending order (highest rating first)
      {
        $sort: { averageRating: -1 }
      }
    ]);

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


  

module.exports = {
  getAllProducts, addProduct , getProductbyName,sortProductsByRating
};
