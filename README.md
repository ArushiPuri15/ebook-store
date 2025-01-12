# Vintage eBook Library

## Overview
The Vintage eBook Library is an e-book buying platform built with the MERN stack. It features both user and admin interfaces, where users can browse, purchase, and read books, and the admin can manage the book collection and track sales.

## Features
- **Admin Features**:
  - Upload books with title, description, genre, tags, price, and other details.
  - View sales and transaction records for each book.
  - Update book information as needed.
- **User Features**:
  - Browse books with filter, sort, and search options.
  - Add books to a cart, checkout, and make payments via Stripe.
  - Access purchased books on the “My Books” page with in-browser reading.
  - Rate purchased books and view purchase history.

## Technologies Used
- **Frontend**: React.js
- **Backend**: Node.js with Express
- **Database**: MySQL with Prisma ORM
- **Payments**: Stripe API for secure payments
- **Authentication**: JWT for secure user authentication and role-based access control (admin/user)
- **File Uploads**: Multer for handling file uploads, including PDFs and images

## Project Structure
- **Frontend** (`ebook-store-frontend`): Contains React components and pages with an aesthetic that complements the vintage e-library theme.
- **Backend** (`server`): Handles API requests, authentication, and payment processing.
- **Prisma**: Models the data structure and manages the database schema.
- **Uploads Directory**: Stores uploaded book PDFs and images.

## Setup and Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ebook-store
2. Install dependencies:

    Copy code
    npm install
    cd ebook-store-frontend
    npm install
    cd ../server
    npm install
3. Configure the .env file with necessary environment variables for the database, Stripe, and JWT. Ensure sensitive information is not   included in the repository.
Usage
Admin Panel: Access to manage the book inventory and sales.
User Interface: Browse, purchase, and read e-books.
References:
https://docs.stripe.com/
https://www.prisma.io/docs
https://expressjs.com/en/resources/middleware/multer.html
Future Enhancements:
Adding email notifications for purchases
Integrating more analytics for admin insights