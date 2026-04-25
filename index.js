require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const teacherRoutes = require('./routes/teacherRoutes');

const app = express();
const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Teacher Microservice API',
      version: '1.0.0',
      description: 'RESTful API for managing teachers.',
    },
    servers: [
      {
        // FIX 1: Hardcoded localhost-a remove pannitu, dynamic-ah mathi iruken
        url: '/', 
        description: 'Current server',
      },
    ],
    components: {
      schemas: {
        Teacher: {
          type: 'object',
          required: ['teacherId', 'name', 'email'],
          properties: {
            teacherId: { type: 'string', example: 'T001' },
            name: { type: 'string', example: 'Grace Hopper' },
            email: { type: 'string', format: 'email', example: 'grace@example.com' },
            department: { type: 'string', example: 'Computer Science' },
            studentIds: {
              type: 'array',
              items: { type: 'string' },
              example: ['S001', 'S002'],
            },
          },
        },
      },
    },
  },
  apis: ['./routes/teacherRoutes.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(cors()); // Ithu correct-ah iruku
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Teacher Service is running' });
});

app.use('/api/teachers', teacherRoutes);

if (!MONGO_URI) {
  console.error('Missing MONGO_URI in environment');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    // FIX 2: AWS-la '0.0.0.0' kudutha thaan container veliya access panna mudiyum
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
