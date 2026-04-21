const express = require('express');
const router = express.Router();
const {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getTeacherByStudentId,
  getTeacherWithStudents,
  getTeacherWithExams,
} = require('../controllers/teacherController');

/**
 * @swagger
 * tags:
 *   name: Teachers
 *   description: Teacher management and cross-service student lookups
 */

/**
 * @swagger
 * /api/teachers:
 *   post:
 *     summary: Create a new teacher
 *     tags: [Teachers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Teacher'
 *     responses:
 *       201:
 *         description: Teacher created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate teacherId or email
 */
router.post('/', createTeacher);

/**
 * @swagger
 * /api/teachers:
 *   get:
 *     summary: List all teachers
 *     tags: [Teachers]
 *     responses:
 *       200:
 *         description: List of teachers
 */
router.get('/', getAllTeachers);

/**
 * @swagger
 * /api/teachers/by-student/{studentId}:
 *   get:
 *     summary: Get the teacher assigned to a student (by business studentId)
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Teacher found
 *       404:
 *         description: No teacher for this student
 */
router.get('/by-student/:studentId', getTeacherByStudentId);

/**
 * @swagger
 * /api/teachers/{id}/students:
 *   get:
 *     summary: Get a teacher and supervised students from the Student microservice
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB _id or business teacherId
 *     responses:
 *       200:
 *         description: Teacher plus student payloads (or partial if Student service is down)
 *       404:
 *         description: Teacher not found
 */
router.get('/:id/students', getTeacherWithStudents);

/**
 * @swagger
 * /api/teachers/{id}/exams:
 *   get:
 *     summary: Get a teacher and per-student exam lists from the Exam microservice
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB _id or business teacherId
 *     responses:
 *       200:
 *         description: Teacher plus exam payloads grouped by supervised studentId
 *       404:
 *         description: Teacher not found
 */
router.get('/:id/exams', getTeacherWithExams);

/**
 * @swagger
 * /api/teachers/{id}:
 *   get:
 *     summary: Get one teacher by MongoDB _id or teacherId
 *     tags: [Teachers]
 */
router.get('/:id', getTeacherById);

/**
 * @swagger
 * /api/teachers/{id}:
 *   put:
 *     summary: Update a teacher
 *     tags: [Teachers]
 */
router.put('/:id', updateTeacher);

/**
 * @swagger
 * /api/teachers/{id}:
 *   delete:
 *     summary: Delete a teacher
 *     tags: [Teachers]
 */
router.delete('/:id', deleteTeacher);

module.exports = router;
