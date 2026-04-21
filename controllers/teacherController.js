const mongoose = require('mongoose');
const axios = require('axios');
const Teacher = require('../models/teacherModel');

function buildIdFilter(param) {
  if (mongoose.Types.ObjectId.isValid(param)) {
    return { $or: [{ _id: param }, { teacherId: param }] };
  }
  return { teacherId: param };
}

exports.createTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.create(req.body);
    res.status(201).json(teacher);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ message: `Duplicate value for ${field}` });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ createdAt: -1 });
    res.status(200).json(teachers);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getTeacherById = async (req, res) => {
  try {
    const filter = buildIdFilter(req.params.id);
    const teacher = await Teacher.findOne(filter);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.status(200).json(teacher);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const filter = buildIdFilter(req.params.id);
    const teacher = await Teacher.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.status(200).json(teacher);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ message: `Duplicate value for ${field}` });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const filter = buildIdFilter(req.params.id);
    const teacher = await Teacher.findOneAndDelete(filter);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.status(200).json({ message: 'Teacher deleted', teacher });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/** Find a teacher who lists this studentId in studentIds (exposed for Student service). */
exports.getTeacherByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacher = await Teacher.findOne({ studentIds: studentId });
    if (!teacher) {
      return res.status(404).json({ message: 'No teacher assigned for this student' });
    }
    res.status(200).json(teacher);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Returns the teacher plus full student records from the Student microservice
 * for each business id in teacher.studentIds.
 */
exports.getTeacherWithStudents = async (req, res) => {
  try {
    const filter = buildIdFilter(req.params.id);
    const teacher = await Teacher.findOne(filter);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const baseUrl = process.env.STUDENT_SERVICE_URL;
    if (!baseUrl) {
      return res.status(200).json({
        teacher,
        students: null,
        message: 'Student service is currently unavailable',
      });
    }

    const root = baseUrl.replace(/\/$/, '');
    const ids = teacher.studentIds || [];

    if (ids.length === 0) {
      return res.status(200).json({ teacher, students: [] });
    }

    const results = await Promise.all(
      ids.map(async (studentId) => {
        const url = `${root}/${encodeURIComponent(studentId)}`;
        try {
          const response = await axios.get(url, {
            timeout: 5000,
            validateStatus: () => true,
          });
          if (response.status >= 200 && response.status < 300) {
            return { studentId, data: response.data };
          }
          return { studentId, data: null, message: `Student ${studentId} not found in Student service` };
        } catch {
          return { studentId, data: null, message: 'Student service request failed' };
        }
      })
    );

    res.status(200).json({ teacher, students: results });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * For each supervised studentId, fetch exam list from the Exam microservice.
 */
exports.getTeacherWithExams = async (req, res) => {
  try {
    const filter = buildIdFilter(req.params.id);
    const teacher = await Teacher.findOne(filter);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const baseUrl = process.env.EXAM_SERVICE_URL;
    if (!baseUrl) {
      return res.status(200).json({
        teacher,
        examsByStudent: null,
        message: 'Exam service is currently unavailable',
      });
    }

    const root = baseUrl.replace(/\/$/, '');
    const ids = teacher.studentIds || [];

    if (ids.length === 0) {
      return res.status(200).json({ teacher, examsByStudent: [] });
    }

    const results = await Promise.all(
      ids.map(async (studentId) => {
        const url = `${root}/student/${encodeURIComponent(studentId)}`;
        try {
          const response = await axios.get(url, {
            timeout: 5000,
            validateStatus: () => true,
          });
          if (response.status >= 200 && response.status < 300) {
            return { studentId, exams: response.data };
          }
          return { studentId, exams: null, message: 'Exam service did not return data for this student' };
        } catch {
          return { studentId, exams: null, message: 'Exam service request failed' };
        }
      })
    );

    res.status(200).json({ teacher, examsByStudent: results });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
