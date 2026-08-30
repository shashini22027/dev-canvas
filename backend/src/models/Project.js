import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxLength: 2000
  },
  coverImage: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  githubUrl: {
    type: String
  },
  demoUrl: {
    type: String
  },
  tags: [{
    type: String,
    trim: true,
    maxLength: 40
  }],
  category: {
    type: String,
    enum: ['Web Application', 'Mobile Application', 'AI / Machine Learning', 'Data Science', 'IoT', 'Cyber Security', 'Other'],
    required: true
  },
  projectType: {
    type: String,
    enum: ['Individual', 'Team Project'],
    required: true
  },
  teamMemberCount: {
    type: Number,
    min: 1,
    max: 20,
    required: true
  },
  submissionDate: {
    type: Date,
    required: true
  },
  specialComments: {
    type: String,
    trim: true,
    maxLength: 1000
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
