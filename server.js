// import cors from 'cors';

import express from 'express';
const app = express();
import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();

//database connection
import connectDB from './database/dbConnection.js';
//routes
import authRoutes from './routes/authRoutes.js';

import notfoundMiddleware from './middleware/not-found.js';
import errorHandlerMiddleware from './middleware/error-handler.js';

// app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);

app.use(notfoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    app.listen(port, () => {
      console.log(`Server started on port: ${port}....!`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
//ua-parser-js
//
