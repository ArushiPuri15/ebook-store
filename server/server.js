require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword, generateToken } = require('./utils/auth');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
let prisma;

try {
    prisma = new PrismaClient();
    console.log("Prisma client initialized successfully");
} catch (error) {
    console.error("Prisma initialization error:", error);
}

const app = express();

// Enable CORS for all routes, allowing requests from the frontend
app.use(cors({
    origin: 'http://localhost:3000',
}));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname));
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type'));
        }
    }
});

// JWT verification middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        console.warn("Authorization header missing");
        return res.status(403).send("Access Denied");
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        console.warn("Token missing from authorization header");
        return res.status(403).send("Token missing");
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        console.error("Token verification failed:", err);
        return res.status(403).send("Invalid Token");
    }
};
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

// Define generation configuration
const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

// Webhook endpoint for Stripe
app.post('/api/webhook/stripe', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    console.log('Received raw body (Buffer):', req.body); 

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        try {
            await handleCompletedSession(session);
            res.json({ received: true });
        } catch (err) {
            console.error('Failed to process session:', err);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.json({ received: true });
    }
});

// Middleware to parse JSON (apply after Stripe webhook route)
app.use(express.json());

// Sample Protected Route
app.get('/protected', verifyToken, (req, res) => {
    res.send(`Hello, ${req.user.role}! You have access to this route.`);
});

async function handleCompletedSession(session) {
    try {
        console.log("Processing session metadata:", session.metadata); // Log metadata

        // Check metadata presence
        const userId = session.metadata?.userId;
        const items = session.metadata?.items ? JSON.parse(session.metadata.items) : null;

        if (!userId) {
            throw new Error("User ID missing in session metadata");
        }

        // Process items if available
        if (items) {
            const amount = session.amount_total / 100; // Total amount from the session
            for (const item of items) {
                const bookId = item.bookId;
                const quantity = item.quantity; // Ensure to get the quantity here
                await savePurchaseToDatabase(userId, bookId, amount, session.id, quantity);
                console.log(`Purchase completed for user ${userId} on book ${bookId}.`);
            }
            await clearUserCart(userId);
        } else {
            console.log("No items found in session metadata.");
        }
    } catch (error) {
        console.error("Error processing session:", error.message);
    }
}

// Save Purchase Record in Database
async function savePurchaseToDatabase(userId, bookId, amount, sessionId, quantity) {
    try {
        // Convert userId to an integer
        const userIdInt = parseInt(userId, 10);
        await prisma.purchase.create({
            data: {
                userId: userIdInt, // Use the integer userId here
                bookId: bookId, // Keep bookId as it is, assuming it's already an integer
                date: new Date(),
                status: "completed",
                sessionId: sessionId, // Pass the sessionId here
                quantity: quantity, // Now you can use the quantity variable
            },
        });
        console.log("Purchase record saved successfully.");
    } catch (error) {
        console.error("Error saving purchase to database:", error);
        throw error; // Propagate error for further handling
    }
}




// Clear User Cart After Purchase
async function clearUserCart(userId) {
    try {
        // Convert userId to an integer
        const userIdInt = parseInt(userId, 10);
        const deletedItems = await prisma.cartItem.deleteMany({
            where: {
                cart: {
                    userId: userIdInt, // Use the integer userId here
                }
            }
        });
        console.log(`Deleted ${deletedItems.count} cart items successfully.`);
    } catch (error) {
        console.error("Error clearing cart items:", error);
        throw error; // Propagate error for further handling
    }
}

app.get('/', (req, res) => {
    res.send('Welcome to the E-book Store API');
});



// Authentication Routes
app.post(
    '/signup',
    [
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, role } = req.body;

        // Add debug logging here
        console.log("Requested email:", email);
        console.log("Requested role:", role);
        
        // Define the allowed domain for admin role
        const ALLOWED_ADMIN_DOMAIN = '@vitbhopal.ac.in'; // Replace with your criteria
        
        // Log the domain check
        console.log("Email domain:", email.split('@')[1]); 
        console.log("Expected domain:", ALLOWED_ADMIN_DOMAIN);
        
        // Check if the user qualifies for the admin role
        const isAdminRoleAllowed = role === 'admin' && email.toLowerCase().endsWith(ALLOWED_ADMIN_DOMAIN.toLowerCase());
        
        // Log whether the admin role is allowed
        console.log("Is admin role allowed:", isAdminRoleAllowed);
        
        // Set role to 'user' if they do not meet the criteria for admin
        const finalRole = isAdminRoleAllowed ? role : 'user';

        try {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) return res.status(400).send("User already exists");

            const hashedPassword = await hashPassword(password);
            await prisma.user.create({
                data: { email, password: hashedPassword, role: finalRole },
            });

            res.json({ message: "User registered successfully", role: finalRole });
        } catch (error) {
            console.error("Error signing up user:", error);
            res.status(500).send("Error signing up user");
        }
    }
);


app.post(
    '/login',
    [
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        console.log("Login attempt for email:", email);

        try {
            const user = await prisma.user.findUnique({ where: { email } });

            // Check if user exists
            if (!user) {
                return res.status(400).send("Invalid email or password");
            }

            // Check password
            const isPasswordValid = await comparePassword(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).send("Invalid email or password");
            }

            // Generate token
            const token = generateToken(user);
            console.log("Generated Token:", token); // Log the generated token

            // Send response including user role and other information
            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (error) {
            console.error("Error logging in:", error);
            res.status(500).send("Error logging in");
        }
    }
);

// Route to get all books
// Route to fetch all books
app.get('/books', async (req, res) => {
    const { page = 1, limit = 10, sortBy = 'title', order = 'asc' } = req.query;

    try {
        const books = await prisma.book.findMany({
            skip: (page - 1) * limit,
            take: parseInt(limit),
            orderBy: {
                [sortBy]: order === 'asc' ? 'asc' : 'desc',
            },
            include: {
                authors: true,
                ratings: true,
                tags: true,
            },
        });

        const totalBooks = await prisma.book.count();

        res.json({
            totalBooks,
            totalPages: Math.ceil(totalBooks / limit),
            currentPage: page,
            books,
        });
    } catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).send("Error fetching books");
    }
});


// Route to fetch a book by ID
app.get('/books/:id', async (req, res) => {
    const { id } = req.params;

    if (isNaN(id)) {
        return res.status(400).send("Invalid ID format");
    }

    try {
        const book = await prisma.book.findUniqueOrThrow({
            where: { id: Number(id) },
            include: { authors: true, ratings: true, tags: true },
        });

        // Calculate average rating
        const averageRating = book.ratings.length
            ? book.ratings.reduce((acc, r) => acc + r.value, 0) / book.ratings.length
            : 0;

        // Respond with book details and average rating
        res.json({ ...book, averageRating });
    } catch (error) {
        if (error instanceof prisma.Prisma.NotFoundError) {
            return res.status(404).send("Book not found");
        }
        console.error("Error fetching book:", error);
        res.status(500).send("Error fetching book");
    }
});



// Route to create a new book
app.post('/books', upload.fields([{ name: 'pdf' }, { name: 'thumbnail' }]), verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).send("Access Denied: Only admin can create books");

    const { title, description, price, genre, publisher, authors, tags } = req.body;

    let authorNames = [];
    let tagNames = [];
    try {
        authorNames = typeof authors === 'string' ? JSON.parse(authors) : authors;
        tagNames = typeof tags === 'string' ? JSON.parse(tags) : tags;
    } catch (parseError) {
        console.error("Error parsing authors or tags:", parseError);
        return res.status(400).send("Invalid format for authors or tags");
    }

    if (!title || !description || !price || !genre || !publisher) {
        return res.status(400).send("All fields are required");
    }

    try {
        // Get or create authors and tags
        const authorRecords = await Promise.all(
            authorNames.map(name => prisma.author.upsert({ where: { name }, update: {}, create: { name } }))
        );
        const tagRecords = await Promise.all(
            tagNames.map(name => prisma.tag.upsert({ where: { name }, update: {}, create: { name } }))
        );

        const newBook = await prisma.book.create({
            data: {
                title,
                description,
                price: parseFloat(price),
                genre,
                publisher,
                averageRating: 0,
                authors: { connect: authorRecords.map(author => ({ id: author.id })) },
                tags: { connect: tagRecords.map(tag => ({ id: tag.id })) },
                pdf: req.files['pdf'] ? `uploads/${req.files['pdf'][0].filename}` : null,
                thumbnail: req.files['thumbnail'] ? `uploads/${req.files['thumbnail'][0].filename}` : null,
            },
        });
        res.status(201).json(newBook);
    } catch (error) {
        console.error("Error creating book:", error);
        res.status(500).send("Error creating book");
    }
});

// Route to update a book
app.put('/books/:id', upload.fields([{ name: 'pdf' }, { name: 'thumbnail' }]), verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).send("Access Denied: Only admin can update books");

    const { id } = req.params;
    const { title, description, price, genre, publisher, authors, tags } = req.body;

    let authorNames = [];
    let tagNames = [];
    try {
        authorNames = typeof authors === 'string' ? JSON.parse(authors) : authors;
        tagNames = typeof tags === 'string' ? JSON.parse(tags) : tags;
    } catch (parseError) {
        console.error("Error parsing authors or tags:", parseError);
        return res.status(400).send("Invalid format for authors or tags");
    }

    try {
        const authorRecords = await Promise.all(
            authorNames.map(name => prisma.author.upsert({ where: { name }, update: {}, create: { name } }))
        );
        const tagRecords = await Promise.all(
            tagNames.map(name => prisma.tag.upsert({ where: { name }, update: {}, create: { name } }))
        );

        const updatedBook = await prisma.book.update({
            where: { id: parseInt(id) },
            data: {
                title,
                description,
                price: price ? parseFloat(price) : undefined,
                genre,
                publisher,
                authors: { connect: authorRecords.map(author => ({ id: author.id })) },
                tags: { connect: tagRecords.map(tag => ({ id: tag.id })) },
                pdf: req.files['pdf'] ? `uploads/${req.files['pdf'][0].filename}` : undefined,
                thumbnail: req.files['thumbnail'] ? `uploads/${req.files['thumbnail'][0].filename}` : undefined,
            },
            include: { authors: true, tags: true }
        });
        res.json(updatedBook);
    } catch (error) {
        console.error("Error updating book:", error);
        res.status(500).send("Error updating book");
    }
});

// Route to delete a book
app.delete('/books/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).send("Access Denied: Only admin can delete a book");

    const { id } = req.params;
    try {
        await prisma.book.delete({ where: { id: Number(id) } });
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).send("Error deleting book");
    }
});

// Endpoint to get the user's purchased books
// Endpoint to get the user's purchased books
app.get('/users/mybooks', verifyToken, async (req, res) => {
    try {
        // Find all purchases made by the user
        const purchases = await prisma.purchase.findMany({
            where: { userId: req.user.id, status: 'completed' }, // Ensure only completed purchases are retrieved
            include: {
                book: {
                    include: {
                        ratings: true, // Include ratings for the book
                    },
                },
            },
        });

        // If no purchases found, respond accordingly
        if (!purchases.length) {
            return res.status(404).json({ message: 'No purchased books found.' });
        }

        // Map the results to include relevant book information
        const books = purchases.map(purchase => {
            const book = purchase.book;

            // Check if book exists and safely access its properties
            if (!book) {
                return null; // Handle case if book does not exist
            }

            // Find the user's rating for this book, if it exists
            const userRating = book.ratings.find(rating => rating.userId === req.user.id)?.rating || null;

            return {
                id: book.id,
                title: book.title,
                description: book.description,
                userRating, // User's rating for this book
                averageRating: book.averageRating || 0, // Provide a default value for average rating if undefined
                purchaseDate: purchase.createdAt, // Include the date of purchase if needed
                pdf: book.pdf, // Include the PDF path
                // Add any other book fields you want to expose
            };
        }).filter(Boolean); // Remove any null entries if a book was not found

        return res.json({ books });
    } catch (error) {
        console.error("Error fetching user's books:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


// Add a rating or update an existing one
app.post(
    '/ratings',
    [
        body('bookId').isInt().withMessage('Book ID must be an integer'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
    ],
    verifyToken,
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { bookId, rating } = req.body;

        try {
            // Check if the user has purchased the book
            const purchase = await prisma.purchase.findFirst({
                where: {
                    bookId: bookId,
                    userId: req.user.id,
                    status: 'completed', // Ensure only completed purchases are considered
                },
            });

            if (!purchase) {
                return res.status(403).json({ error: "You can only rate books that you've purchased." });
            }

            // Check if a rating already exists for this user and book
            const existingRating = await prisma.rating.findFirst({
                where: {
                    bookId,
                    userId: req.user.id,
                },
            });

            if (existingRating) {
                // Update the existing rating
                const updatedRating = await prisma.rating.update({
                    where: { id: existingRating.id },
                    data: { rating },
                });
                return res.status(200).json(updatedRating);
            } else {
                // Create a new rating
                const newRating = await prisma.rating.create({
                    data: {
                        userId: req.user.id,
                        bookId,
                        rating,
                    },
                });
                return res.status(201).json(newRating);
            }
        } catch (error) {
            console.error("Error adding/updating rating:", error);
            res.status(500).send("Error adding/updating rating");
        }
    }
);

// Optional: Add a route to fetch ratings for a specific book
app.get('/ratings/:bookId', async (req, res) => {
    const { bookId } = req.params;
    try {
        const ratings = await prismaClient.rating.findMany({
            where: { bookId: parseInt(bookId) },
            select: { rating: true, userId: true },
        });
        res.status(200).json(ratings);
    } catch (error) {
        console.error("Error fetching ratings:", error);
        res.status(500).send("Error fetching ratings");
    }
});



// Route to fetch all sales for a specific book
app.get('/books/:id/sales', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send("Access Denied: Only admin can view sales");
    }
    const { id } = req.params;
    try {
        const sales = await prisma.sale.findMany({
            where: { bookId: parseInt(id) },
            include: { user: true } // Include user details related to the sale
        });
        res.json(sales);
    } catch (error) {
        console.error("Error fetching sales:", error);
        res.status(500).send("Error fetching sales data");
    }
});

// Route to fetch all purchase transactions for a specific book
app.get('/books/:id/purchases', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send("Access Denied: Only admin can view purchase transactions");
    }
    const { id } = req.params;
    try {
        const purchases = await prisma.purchase.findMany({
            where: { bookId: parseInt(id) },
            include: { user: true } // Include user details related to the purchase
        });
        res.json(purchases);
    } catch (error) {
        console.error("Error fetching purchases:", error);
        res.status(500).send("Error fetching purchase data");
    }
});

// Route to fetch all sales transactions
app.get('/sales', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send("Access Denied: Only admin can view sales data");
    }
    try {
        const allSales = await prisma.sale.findMany({
            include: { book: true, user: true }
        });
        res.json(allSales);
    } catch (error) {
        console.error("Error fetching all sales:", error);
        res.status(500).send("Error fetching sales data");
    }
});

// Route to fetch all purchase transactions
app.get('/purchases', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send("Access Denied: Only admin can view purchases");
    }
    try {
        const allPurchases = await prisma.purchase.findMany({
            include: { book: true, user: true }
        });
        res.json(allPurchases);
    } catch (error) {
        console.error("Error fetching all purchases:", error);
        res.status(500).send("Error fetching purchase data");
    }
});

// Example purchase route
app.post('/purchase', async (req, res) => {
    const { bookId, userId, sessionId, quantity } = req.body; // Assume these are part of the request body
    try {
        // Create a new purchase record
        const purchase = await prisma.purchase.create({
            data: {
                bookId: parseInt(bookId),
                userId: parseInt(userId),
                sessionId: sessionId, // Session ID from Stripe
                quantity: parseInt(quantity), // Quantity of the book purchased
                status: "completed", // You might want to set this based on the payment status
                date: new Date(),// Include any other relevant purchase data if needed
            }
        });

        // Increment the purchases count for the book
        await prisma.book.update({
            where: { id: parseInt(bookId) },
            data: { purchasesCount: { increment: 1 } }
        });

        res.status(201).json({ message: "Purchase successful", purchase });
    } catch (error) {
        console.error("Error processing purchase:", error);
        res.status(500).json({ message: "Error processing purchase", error });
    }
});



// Fetch all authors
app.get('/authors', async (req, res) => {
    try {
        const authors = await prisma.author.findMany(); // Adjust model name if different
        res.json(authors);
    } catch (error) {
        console.error("Error retrieving authors:", error);
        res.status(500).send("Error retrieving authors");
    }
});
// Fetch all tags
app.get('/tags', async (req, res) => {
    try {
        const tags = await prisma.tag.findMany(); // Adjust model name if different
        res.json(tags);
    } catch (error) {
        console.error("Error retrieving tags:", error);
        res.status(500).send("Error retrieving tags");
    }
});
app.post('/checkout', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`Processing checkout for user ID: ${userId}`);

        // Retrieve the user's cart items
        const userCart = await prisma.cart.findUnique({
            where: { userId },
            include: { items: true },
        });

        if (!userCart || !userCart.items || userCart.items.length === 0) {
            return res.status(400).send("Your cart is empty.");
        }

        console.log("Fetched Cart Items:", userCart.items);

        // Prepare line items for Stripe session
        const lineItems = await Promise.all(userCart.items.map(async (item) => {
            const book = await prisma.book.findUnique({ where: { id: item.bookId } });
            if (!book) throw new Error(`Book not found for ID: ${item.bookId}`);

            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: book.title,
                        description: book.description,
                    },
                    unit_amount: Math.round(book.price * 100), // Convert price to cents
                },
                quantity: item.quantity,
            };
        }));

        const successURL = 'http://localhost:3000/checkout-success';
        const cancelURL = 'http://localhost:3000/checkout-cancel';

        console.log("Creating Stripe session with line items:", lineItems);

        // Convert cart items into metadata format for record-keeping in the Stripe session
        const metadata = {
            userId,
            items: JSON.stringify(userCart.items.map(item => ({
                bookId: item.bookId,
                quantity: item.quantity,
            }))),
        };

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: successURL,
            cancel_url: cancelURL,
            metadata: metadata, // Use the metadata object defined above
        });

        console.log(`Checkout session created with ID: ${session.id}`);

        // Send response with session ID
        return res.status(200).json({ sessionId: session.id });

    } catch (error) {
        console.error("Checkout error:", error);
        return res.status(500).send("An unexpected error occurred.");
    }
});



// Sample in-memory cart data (replace with your actual data source)
// GET endpoint to retrieve cart items
app.get('/cart', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: { items: { include: { book: true } } }
        });

        if (!cart || cart.items.length === 0) {
            return res.status(200).json([]); // Ensure empty array if no items
        }

        const items = cart.items.map(item => ({
            id: item.id,
            book: {
                title: item.book.title,
                price: item.book.price,
                id: item.book.id
            },
            quantity: item.quantity
        }));

        res.status(200).json(items);
    } catch (error) {
        console.error("Error retrieving cart items:", error);
        res.status(500).json({ error: "An error occurred while retrieving the cart." });
    }
});


// POST endpoint to add items to the cart
app.post('/cart', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { bookId, quantity = 1 } = req.body;

    try {
        // Find or create the user's cart
        let cart = await prisma.cart.findUnique({
            where: { userId: userId },
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: {
                    userId: userId,
                },
            });
        }

        // Check if the item already exists in the cart
        const existingItem = await prisma.cartItem.findFirst({
            where: { cartId: cart.id, bookId: bookId },
        });

        if (existingItem) {
            // Update the quantity if the item already exists
            const updatedItem = await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity },
            });
            res.status(200).json(updatedItem);
        } else {
            // Create a new cart item
            const newItem = await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    bookId: bookId,
                    quantity: quantity,
                },
            });
            res.status(201).json(newItem);
        }
    } catch (error) {
        console.error("Error adding item to cart:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Route to fetch user's purchase history
app.get('/users/me/purchases', verifyToken, async (req, res) => {
    const userId = req.user.id; // Assuming req.user.id is set by the verifyToken middleware

    try {
        const purchases = await prisma.purchase.findMany({
            where: { userId: userId, status: 'completed' }, // Ensure we only get completed purchases
            include: {
                book: true, // Include book details in the response
            },
            orderBy: {
                createdAt: 'desc', // Order by purchase date (assuming createdAt is a timestamp field)
            },
        });

        res.json(purchases); // Send the purchases back to the client
    } catch (error) {
        console.error("Error fetching user's purchase history:", error);
        res.status(500).send("Error fetching purchase history");
    }
});


// Route to fetch a book's content if the user has purchased it
app.get('/books/:bookId/read', verifyToken, async (req, res) => {
    const { bookId } = req.params;

    try {
        // Check if the user has purchased the book
        const purchase = await prisma.purchase.findFirst({
            where: {
                bookId: parseInt(bookId),
                userId: req.user.id,
                status: 'completed'
            }
        });

        if (!purchase) {
            return res.status(403).json({ message: 'Access Denied: You have not purchased this book.' });
        }

        // If the user has purchased the book, send the book's PDF URL or content
        const book = await prisma.book.findUnique({
            where: { id: parseInt(bookId) },
            select: { pdf: true, title: true } // Only select the pdf field and title
        });

        if (!book || !book.pdf) {
            return res.status(404).json({ message: 'Book not found or does not have a PDF.' });
        }

        // Return the PDF URL or content (depending on your requirements)
        res.json({ title: book.title, pdfUrl: book.pdf });
    } catch (error) {
        console.error("Error fetching book content:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/chatbot', async (req, res) => {
    const { message } = req.body;
    try {
        const chatSession = model.startChat({
            generationConfig: {
                temperature: 1,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
                responseMimeType: "text/plain",
            },
            history: [],
        });

        const result = await chatSession.sendMessage(message);

        // Make sure to check the response structure and send back the appropriate text
        res.json({ response: result.response.text() }); // Use text() if response is a function
    } catch (error) {
        console.error("Error communicating with Gemini API:", error.message);
        console.error(error.stack);
        res.status(500).send("Error communicating with chatbot");
    }
});




// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
