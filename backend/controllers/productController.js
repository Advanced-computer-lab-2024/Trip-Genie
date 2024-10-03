const Product = require('../models/product');
const Seller = require('../models/seller');


const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

const addProduct = async (req, res) => {
    const { name, picture , price,description, rating , reviews , quantity } = req.body; // Extract the data from request
  
    try {
  
      // Use the sellerType from the Seller document
    //   const sellerType = seller.seller;
  
      // Create the product with the fetched sellerType
      const product = new Product({
        name, picture , price,description, seller:res.locals.user_id, rating , reviews , quantity
      });
  
      // Save the product to the database
      await product.save();
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

const searchProductbyName = async (req, res) => {
  const { name } = req.query;
  try {
    if(name === undefined || name === null || name === "") {
      return this.find().populate('seller').exec();
    }
    const products = await Product.find({ name: { $regex: new RegExp(name, 'i') } });
    if (!products || products.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(products);
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

const editProduct = async (req, res) => {
  const { id } = req.params; // Get product ID from URL parameters
  const { name, picture, price, description, quantity , reviews} = req.body; // Get details from request body
  try {
    // Find the product by ID and update its details
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { name, picture, price, description, quantity, reviews },
      { new: true, runValidators: true } // Options: return the updated document and run validation
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = await Product.findById(id);
    const totalRating = product.reviews.reduce((acc, review) => acc + review.rating, 0);
    const newRating = totalRating / product.reviews.length;
    updatedProduct.rating = await Product.findByIdAndUpdate(productId, {$set: { rating: newRating }});

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const editProductOfSeller = async (req, res) => {
  const { id } = req.params; // Get product ID from URL parameters
  const { name, picture, price, description, quantity , reviews} = req.body; // Get details from request body
  const product = await Product.findById(id);
  if(product.seller != res.locals.user_id){
    return res.status(403).json({ message: "You are not authorized to edit this product" });
  }
  try {
    // Find the product by ID and update its details
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { name, picture, price, description, quantity, reviews },
      { new: true, runValidators: true } // Options: return the updated document and run validation
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = await Product.findById(id);
    const totalRating = product.reviews.reduce((acc, review) => acc + review.rating, 0);
    const newRating = totalRating / product.reviews.length;
    console.log(newRating);
    const newProduct = await Product.findByIdAndUpdate(id, { rating: newRating },{ new: true, runValidators: true });

    res.json(newProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const filterProductsByPrice = async (req, res) => {
  const { minPrice, maxPrice } = req.query;

  try {
    const products = await Product.find({
      price: {
        $gte: minPrice,
        $lte: maxPrice,
      },
    });

    if (!products.length) {
      return res
        .status(404)
        .json({ message: "No products found" });
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProductOfSeller = async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if(product.seller != res.locals.user_id){
    return res.status(403).json({ message: "You are not authorized to delete this product" });
  }
  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getAllProducts,
  addProduct,
  searchProductbyName,
  sortProductsByRating,
  editProduct,
  filterProductsByPrice,
  editProductOfSeller,
  getProductById,
  deleteProduct,
  deleteProductOfSeller
};