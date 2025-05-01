const Product = require("../models/product");
const Seller = require("../models/seller");
const Tourist = require("../models/tourist");
const Purchase = require("../models/purchase");
const cloudinary = require("../utils/cloudinary");

const getAllProducts = async (req, res) => {
  const { minPrice, maxPrice, searchBy, asc, sort, myproducts, rating } =
    req.query;
  const role = res.locals.user_role;
  console.log(myproducts);

  try {
    // Build the query object dynamically
    const query = {};
    // Apply search filter (by name) if provided
    if (searchBy) {
      query.$or = [
        { name: { $regex: searchBy, $options: "i" } },
        { description: { $regex: searchBy, $options: "i" } },
      ];
    }

    // Apply price range filter if provided
    if (minPrice || maxPrice) {
      query.price = {};
    }
    if (minPrice) query.price.$gte = parseFloat(minPrice); // Apply minPrice if given
    if (maxPrice) query.price.$lte = parseFloat(maxPrice); // Apply maxPrice if given

    // Filter by the user's products (myProducts)
    if (myproducts) {
      if (role == "admin") query.seller = null;
      else query.seller = res.locals.user_id;
    }

    // Apply rating filter if provided
    if (rating) {
      query.rating = { $gte: parseInt(rating, 10) }; // Ensure rating is treated as a number
    }

    // Perform the query
    query.isArchived = false;
    query.isDeleted = false;
    let productsQuery = Product.find(query);

    // Apply sorting if 'asc' is defined (for sorting by rating)
    if (sort) {
      const sortBy = {};
      sortBy[sort] = parseInt(asc);
      productsQuery = productsQuery.sort(sortBy);
    } else {
      productsQuery = productsQuery.sort({ createdAt: -1 });
    }

    // Execute the query and get the products
    const products = await productsQuery;

    // If no products match the filters, return an empty array
    if (!products.length) {
      return res.status(200).json({ products: [], maxPrice: 0 });
    }

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Function to get the maximum price from products
const getMaxPrice = async (req, res) => {
  const maxPriceProduct = await Product.findOne({
    isArchived: false,
    isDeleted: false,
  }).sort({ price: -1 });
  let maxPrice;
  if (maxPriceProduct) {
    maxPrice = await maxPriceProduct.price;
  } else {
    maxPrice = 1;
  }
  res.status(200).json(maxPrice);
};

const getMaxPriceMy = async (req, res) => {
  const role = res.locals.user_role;
  const userId = res.locals.user_id;

  try {
    let maxPriceProduct;

    if (role === "admin") {
      // Admin: Access max price across all non-archived products
      maxPriceProduct = await Product.findOne({
        seller: null,
        isArchived: false,
        isDeleted: false,
      }).sort({ price: -1 });
    } else {
      // Seller: Retrieve max price for non-archived products belonging to this user
      maxPriceProduct = await Product.findOne({
        seller: userId,
        isArchived: false,
        isDeleted: false,
      }).sort({ price: -1 });
    }

    const maxPrice = maxPriceProduct ? maxPriceProduct.price : 0;
    res.status(200).json(maxPrice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMaxPriceArchived = async (req, res) => {
  const role = res.locals.user_role;
  const userId = res.locals.user_id;

  try {
    let maxPriceProduct;

    if (role === "admin") {
      // Admin: Access max price across all non-archived products
      maxPriceProduct = await Product.findOne({
        seller: null,
        isArchived: true,
        isDeleted: false,
      }).sort({ price: -1 });
    } else {
      // Seller: Retrieve max price for non-archived products belonging to this user
      maxPriceProduct = await Product.findOne({
        seller: userId,
        isArchived: true,
        isDeleted: false,
      }).sort({ price: -1 });
    }

    const maxPrice = maxPriceProduct ? maxPriceProduct.price : 0;
    res.status(200).json(maxPrice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllProductsArchive = async (req, res) => {
  const { minPrice, maxPrice, searchBy, asc, myproducts, rating, sort } =
    req.query;
  const role = res.locals.user_role;
  try {
    // Debugging: Log incoming query parameters

    // Build the query object dynamically
    const query = {};

    // Apply search filter (by name) if provided
    if (searchBy) {
      query.$or = [
        { name: { $regex: searchBy, $options: "i" } },
        { description: { $regex: searchBy, $options: "i" } },
      ];
    }

    // Apply price range filter if provided
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice); // Apply minPrice if given
      if (maxPrice) query.price.$lte = parseFloat(maxPrice); // Apply maxPrice if given
    }

    if (rating) {
      query.rating = { $gte: parseInt(rating, 10) }; // Ensure rating is treated as a number
    }

    // Filter by the user's products (myProducts)
    if (myproducts) {
      query.seller = res.locals.user_id;
    }

    // Perform the query
    query.isArchived = true;
    query.isDeleted = false;
    if (role == "admin") {
      query.seller = null;
    } else {
      query.seller = res.locals.user_id;
    }
    let productsQuery = Product.find(query);

    // Apply sorting if 'asc' is defined (for sorting by rating)
    if (sort) {
      const sortBy = {};
      sortBy[sort] = parseInt(asc);
      productsQuery = productsQuery.sort(sortBy);
    } else {
      productsQuery = productsQuery.sort({ createdAt: -1 });
    }

    // Execute the query and get the products
    const products = await productsQuery;

    // Check if no products match the filters
    if (!products.length) {
      return res.status(200).json([]);
    }

    // Return filtered products
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addProduct = async (req, res) => {
  const { name, price, description, quantity } = req.body; // Extract the data from request

  try {
    let imagesBuffer = [];
    const pictures = req.files.map(
      (file) => `data:image/jpeg;base64,${file.buffer.toString("base64")}`
    );
    //upload multiple images using cloudinary
    for (let i = 0; i < pictures.length; i++) {
      const result = await cloudinary.uploader.upload(pictures[i], {
        folder: "products",
      });

      imagesBuffer.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    const product = new Product({
      name,
      pictures: imagesBuffer,
      price,
      description,
      seller: res.locals.user_id,
      quantity,
      currency: "67140446ee157ee4f239d523",
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const addProductByAdmin = async (req, res) => {
  const { name, price, description, quantity } = req.body; // Extract the data from request

  try {
    let imagesBuffer = [];

    const pictures = req.files.map(
      (file) => `data:image/jpeg;base64,${file.buffer.toString("base64")}`
    );

    //upload multiple images using cloudinary
    for (let i = 0; i < pictures.length; i++) {
      const result = await cloudinary.uploader.upload(pictures[i], {
        folder: "products",
      });

      imagesBuffer.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    const product = new Product({
      name,
      pictures: imagesBuffer,
      price,
      description,
      quantity,
      currency: "67140446ee157ee4f239d523",
    });

    // Save the product to the database
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const editProduct = async (req, res) => {
  const { id } = req.params; // Get product ID from URL parameters
  const { name, price, description, quantity } = req.body; // Get details from request body
  try {
    const checkProduct = await Product.find({ _id: id, isDeleted: false });
    if (!checkProduct) {
      return res.status(400).json({ message: "Product not found" });
    }
    let { oldPictures } = req.body; // Get details from request body
    oldPictures = JSON.parse(oldPictures);

    let newPictures = req.files.map(
      (file) => `data:image/jpeg;base64,${file.buffer.toString("base64")}`
    );
    let imagesBuffer = [];

    for (let i = 0; i < newPictures.length; i++) {
      const result = await cloudinary.uploader.upload(newPictures[i], {
        folder: "products",
      });

      imagesBuffer.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    const pictures = [...oldPictures, ...imagesBuffer];
    // Find the product by ID and update its details
    const oldPicturesIDs = oldPictures.map((pic) => pic.public_id);
    checkProduct?.pictures?.forEach((pic) => {
      if (!oldPicturesIDs.includes(pic.public_id)) {
        cloudinary.uploader.destroy(pic.public_id);
      }
    });

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { name, pictures, price, description, quantity },
      { new: true, runValidators: true } // Options: return the updated document and run validation
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = await Product.findById(id);
    // const totalRating = product.reviews.reduce(
    //   (acc, review) => acc + review.rating,
    //   0
    // );

    // if (product.reviews.length > 0) {
    //   const newRating = totalRating / product.reviews.length;
    //   updatedProduct.rating = await Product.findByIdAndUpdate(id, {
    //     $set: { rating: newRating },
    //   });
    // }

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const editProductOfSeller = async (req, res) => {
  const { id } = req.params; // Get product ID from URL parameters
  const { name, price, description, quantity } = req.body;

  try {
    const product1 = await Product.findById({ _id: id, isDeleted: false });
    if (!product1) {
      return res.status(400).json({ message: "Product not found" });
    }
    if (product1.seller.toString() != res.locals.user_id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to edit this product" });
    }
    let { oldPictures } = req.body; // Get details from request body

    oldPictures = JSON.parse(oldPictures);
    const oldPicturesIDs = oldPictures.map((pic) => pic.public_id);
    product1.pictures.forEach((pic) => {
      if (!oldPicturesIDs.includes(pic.public_id)) {
        cloudinary.uploader.destroy(pic.public_id);
      }
    });

    let newPictures = req.files.map(
      (file) => `data:image/jpeg;base64,${file.buffer.toString("base64")}`
    );
    let imagesBuffer = [];

    for (let i = 0; i < newPictures.length; i++) {
      const result = await cloudinary.uploader.upload(newPictures[i], {
        folder: "products",
      });

      imagesBuffer.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    const pictures = [...oldPictures, ...imagesBuffer];

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { name, pictures, price, description, quantity },
      { new: true, runValidators: true } // Options: return the updated document and run validation
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    let product = await Product.findById(id);
    // const totalRating = product.reviews.reduce(
    //   (acc, review) => acc + review.rating,
    //   0
    // );

    // if (product.reviews.length > 0) {
    //   const newRating = totalRating / product.reviews.length;
    //   product = await Product.findByIdAndUpdate(
    //     id,
    //     { rating: newRating },
    //     { new: true, runValidators: true }
    //   );
    // }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id)
      .populate("seller")
      .populate("reviews.tourist")
      .exec();
    if (!product) {
      return res.status(400).json({ message: "Product not found" });
    }
    if (product.isDeleted) {
      return res.status(400).json({ message: "Product no longer exists" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const purchases = await Purchase.find({ status: "pending" });
    for (const purchase of purchases) {
      if (purchase.products.some((prod) => prod.product.toString() === id)) {
        return res.status(400).json({
          message: "Cannot delete product, there are pending purchases",
        });
      }
    }
    const product = await Product.findByIdAndUpdate(id, { isDeleted: true });
    for (let i = 0; i < product.pictures.length; i++) {
      await cloudinary.uploader.destroy(product.pictures[i].public_id);
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const archiveProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(400).json({ message: "Product not found" });
    }
    if (product.isDeleted) {
      return res.status(400).json({ message: "Product no longer exists" });
    }

    const pendingPurchase = await Purchase.findOne({
      status: "pending",
      "products.product": id,
    });
    // console.log(pendingPurchase);
    if (pendingPurchase) {
      return res
        .status(400)
        .json({ message: "This product is still on pending delivery" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { isArchived: !product.isArchived },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      product: updatedProduct,
      message: "Product archived status toggled successfully",
    });
  } catch (error) {
    console.error("Error in archiveProduct:", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing your request" });
  }
};

const deleteProductOfSeller = async (req, res) => {
  const { id } = req.params;
  const sellerId = res.locals.user_id;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.seller.toString() !== sellerId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this product" });
    }

    if (product.isDeleted) {
      return res.status(400).json({ message: "Product is already deleted" });
    }

    const pendingPurchase = await Purchase.findOne({
      status: "pending",
      "products.product": id,
    });

    if (pendingPurchase) {
      return res
        .status(400)
        .json({ message: "This product is still on pending delivery" });
    }

    // Delete images from Cloudinary
    for (const picture of product.pictures) {
      await cloudinary.uploader.destroy(picture.public_id);
    }

    // Mark product as deleted
    await Product.findByIdAndUpdate(id, { isDeleted: true });

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error in deleteProductOfSeller:", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing your request" });
  }
};
const addProductToCart = async (req, res) => {
  const { productId, quantity } = req.body; // Extract productId and quantity from request body
  const userId = res.locals.user_id; // Assuming the logged-in user ID is stored in res.locals

  try {
    // Find the user (tourist)
    const user = await Tourist.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(400).json({ message: "Product not found" });
    }

    if (product.isDeleted) {
      return res.status(400).json({ message: "Product no longer exists" });
    }

    // Check if the product already exists in the cart
    const existingCartItem = user.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingCartItem) {
      // If product is already in the cart, update the quantity and totalPrice
      await Tourist.findByIdAndUpdate(
        userId,
        {
          $inc: {
            "cart.$[elem].quantity": quantity, // Increment the quantity of the existing product
            "cart.$[elem].totalPrice": quantity * product.price, // Update the totalPrice for the product
          },
        },
        {
          arrayFilters: [{ "elem.product": productId }], // Find the product in the cart using arrayFilters
          new: true, // Return the updated document
        }
      );
    } else {
      // If product is not in the cart, add it to the cart array
      await Tourist.findByIdAndUpdate(
        userId,
        {
          $push: {
            cart: {
              product: productId,
              quantity,
              totalPrice: quantity * product.price,
            },
          },
        },
        { new: true } // Return the updated document
      );
    }

    // Find the updated user data with the cart to return the updated cart
    const updatedUser = await Tourist.findById(userId);
    res
      .status(200)
      .json({ message: "Product added to cart", cart: updatedUser.cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add product to the wishlist
const addProductToWishlist = async (req, res) => {
  const productId = req.params.id; // Extract productId from the request params
  const userId = res.locals.user_id; // Assuming the logged-in user ID is stored in res.locals

  try {
    // Find the user (tourist)
    const user = await Tourist.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(400).json({ message: "Product not found" });
    }

    if (product.isDeleted) {
      return res.status(400).json({ message: "Product no longer exists" });
    }

    // Check if the product already exists in the wishlist
    const existingWishlistItem = user.wishlist.find((item) => {
      console.log(
        "Checking product:",
        item.product._id.toString(),
        "against",
        productId
      ); // Log each iteration
      return item.product._id.toString() === productId;
    });

    if (existingWishlistItem) {
    } else {
      // If the product is not already in the wishlist, add it to the wishlist
      await Tourist.findByIdAndUpdate(
        userId,
        {
          $push: {
            wishlist: { product: productId },
          },
        },
        { new: true } // Return the updated document
      );

      // Fetch the updated user data with the wishlist
      const updatedUser = await Tourist.findById(userId);
    }
    res.status(200).json({
      message: "Product added to wishlist",
    });
  } catch (error) {
    console.error("Error: ", error); // Log the full error to the console
    res.status(500).json({ message: error.message });
  }
};

const removeProductFromWishlist = async (req, res) => {
  const productId = req.params.id; // Extract productId from the request params
  const userId = res.locals.user_id; // Assuming the logged-in user ID is stored in res.locals

  try {
    // Find the user (tourist)
    const user = await Tourist.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(400).json({ message: "Product not found" });
    }

    if (product.isDeleted) {
      return res.status(400).json({ message: "Product no longer exists" });
    }

    // Check if the product exists in the wishlist
    const existingWishlistItem = user.wishlist.find((item) => {
      return item.product._id.toString() === productId;
    });

    if (!existingWishlistItem) {
      return res
        .status(400)
        .json({ message: "Product is not in the wishlist" });
    }

    // If the product exists, remove it from the wishlist
    await Tourist.findByIdAndUpdate(
      userId,
      {
        $pull: {
          wishlist: { product: productId }, // Removes the product from the wishlist array
        },
      },
      { new: true } // Return the updated document
    );

    // Fetch the updated user data with the wishlist
    const updatedUser = await Tourist.findById(userId);

    res.status(200).json({
      message: "Product removed from wishlist",
      updatedWishlist: updatedUser.wishlist, // Optional: you can send back the updated wishlist
    });
  } catch (error) {
    console.error("Error: ", error); // Log the full error to the console
    res.status(500).json({ message: error.message });
  }
};

const rateProduct = async (req, res) => {
  try {
    const { rating } = req.body; // Get rating from the request body
    const product = await Product.findById(req.params.id); // Find the product by ID

    if (!product) {
      return res.status(400).json({ message: "Product not found" });
    }

    if (product.isDeleted) {
      return res.status(400).json({ message: "Product no longer exists" });
    }

    if (rating < 0 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be a number between 0 and 5" });
    }

    // Add the new rating to the allRatings array
    product.allRatings.push(rating);

    // Calculate the new average rating
    const totalRatings = product.allRatings.reduce(
      (sum, rating) => sum + rating,
      0
    );
    const newAverageRating = totalRatings / product.allRatings.length;

    // Update the product's overall rating
    product.rating = newAverageRating;

    // Save the updated product
    await product.save();

    res.status(200).json({ message: "Rating added", newAverageRating });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a comment (and optional rating) to a product
const addCommentToProduct = async (req, res) => {
  try {
    const { rating, comment, username } = req.body; // Get comment details from the request body

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res
        .status(400)
        .json({ message: "Rating must be a number between 1 and 5" });
    }

    const userId = res.locals.user_id; // Get user ID from locals (assuming user is authenticated)

    const tourist = await Tourist.findById(userId);
    if (!tourist) {
      return res.status(404).json({ message: "User not found" });
    }

    const product = await Product.findById(req.params.id); // Find the product by ID
    if (!product) {
      return res.status(400).json({ message: "Product not found" });
    }
    if (product.isDeleted) {
      return res.status(400).json({ message: "Product no longer exists" });
    }

    // Determine the username to use
    let finalUsername;
    if (username && username === "true") {
      finalUsername = "Anonymous"; // Use 'Anonymous' as the username
    } else {
      finalUsername = tourist.username || "Anonymous"; // Use tourist's username or default to 'Anonymous'
    }

    // Create the new review object
    const newReview = {
      user: finalUsername, // Use the determined username
      rating: rating || 0,
      comment,
      date: new Date(),
      tourist: tourist._id,
    };

    // Add the review to the product's reviews array
    product.reviews.push(newReview);

    // If the comment includes a rating, recalculate the average rating
    let newAverageRating;
    if (rating !== undefined) {
      product.allRatings.push(rating);
      const totalRatings = product.allRatings.reduce(
        (sum, rating) => sum + rating,
        0
      );
      newAverageRating = totalRatings / product.allRatings.length;
      product.rating = newAverageRating;
    }

    // Save the updated product
    await product.save();

    // Return the updated reviews and new average rating (if applicable)
    res.status(200).json({
      message: "Comment added successfully",
      reviews: product.reviews,
      ...(newAverageRating && { newAverageRating }), // Only include the new rating if it was updated
    });
  } catch (error) {
    console.error("Error: ", error.message); // Print the error message to the console
    return res.status(500).json({ error: error.message }); // Return the error message in the response
  }
};

const updateCommentOnProduct = async (req, res) => {
  try {
    const { rating, comment, username } = req.body; // Get the new details from the request body
    const userId = res.locals.user_id; // Get user ID from locals (assuming user is authenticated)

    // Validate the rating value if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        message: "Rating must be a number between 1 and 5",
      });
    }

    const tourist = await Tourist.findById(userId); // Find the user
    if (!tourist) {
      return res.status(404).json({ message: "User not found" });
    }

    const product = await Product.findById(req.params.id); // Find the product by ID
    if (!product) {
      return res.status(400).json({ message: "Product not found" });
    }
    if (product.isDeleted) {
      return res.status(400).json({ message: "Product no longer exists" });
    }

    // Find the review by the tourist's ID
    const reviewIndex = product.reviews.findIndex(
      (review) => review.tourist.toString() === tourist._id.toString()
    );

    if (reviewIndex === -1) {
      return res
        .status(404)
        .json({ message: "Review not found for this user" });
    }

    // Determine the username to use
    let finalUsername;
    if (username) {
      finalUsername = "Anonymous"; // Use 'Anonymous' as the username
    } else {
      finalUsername = tourist.username || "Anonymous"; // Use tourist's username or default to 'Anonymous'
    }

    // Update fields if provided
    if (rating !== undefined) product.reviews[reviewIndex].rating = rating; // Update rating
    if (comment) product.reviews[reviewIndex].comment = comment; // Update comment
    product.reviews[reviewIndex].user = finalUsername; // Update the username

    // Recalculate the average rating based on updated reviews
    const totalRatings = product.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    ); // Calculate total ratings
    const newAverageRating = totalRatings / product.reviews.length; // Calculate new average rating
    product.rating = newAverageRating; // Update the product's average rating

    // Save the updated product
    await product.save();

    // Return the updated reviews and new average rating
    res.status(200).json({
      message: "Comment updated successfully",
      reviews: product.reviews,
      newAverageRating, // Include new average if it was updated
    });
  } catch (error) {
    console.error("Error: ", error.message); // Print the error message to the console
    return res.status(500).json({ error: error.message }); // Return the error message in the response
  }
};

const getStockReport = async (req, res) => {
  try {
    let { productIds } = req.query;
    const query = { isDeleted: false, seller: res.locals.user_id };
    if (productIds) {
      productIds = productIds.split(",");
      query._id = { $in: productIds };
    }

    const products = await Product.find(query);
    let stockReport = products.map((product) => {
      return {
        id: product._id,
        name: product.name,
        quantity: product.quantity,
        sales: product.sales,
      };
    });

    const totalStock = stockReport.reduce(
      (acc, product) => acc + product.quantity,
      0
    );

    const totalSales = stockReport.reduce(
      (acc, product) => acc + product.sales,
      0
    );

    stockReport = stockReport.sort((a, b) => b.quantity - a.quantity);
    res.status(200).json({ stockReport, totalStock, totalSales });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAdminStockReport = async (req, res) => {
  try {
    let { productIds } = req.query;
    const query = { isDeleted: false, seller: null };
    if (productIds) {
      productIds = productIds.split(",");
      query._id = { $in: productIds };
    }
    const products = await Product.find(query);
    let stockReport = products.map((product) => {
      return {
        id: product._id,
        name: product.name,
        quantity: product.quantity,
        sales: product.sales,
      };
    });

    const totalStock = stockReport.reduce(
      (acc, product) => acc + product.quantity,
      0
    );

    const totalSales = stockReport.reduce(
      (acc, product) => acc + product.sales,
      0
    );

    stockReport = stockReport.sort((a, b) => b.quantity - a.quantity);
    res.status(200).json({ stockReport, totalStock, totalSales });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  rateProduct,
  addCommentToProduct,
  addProductToCart,
  addProductToWishlist,
  getAllProducts,
  addProduct,
  editProduct,
  editProductOfSeller,
  getProductById,
  deleteProduct,
  deleteProductOfSeller,
  addProductByAdmin,
  archiveProduct,
  getAllProductsArchive,
  updateCommentOnProduct,
  getMaxPrice,
  getMaxPriceMy,
  getMaxPriceArchived,
  getStockReport,
  getAdminStockReport,
};
