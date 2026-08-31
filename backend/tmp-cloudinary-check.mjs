import 'dotenv/config';
import { createProject } from './src/services/project.service.js';
import connectDB from './src/lib/db.js';

const validPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB4LqVAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJ0UkGAAAAAABQ4y9nAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjYAAAAAIAAeIhvAAAAABJRU5ErkJggg==', 'base64');

try {
  await connectDB();
  const files = {
    coverImage: [{ buffer: validPng, originalname: 'a.png', mimetype: 'image/png', size: validPng.length }],
    extraImages: [{ buffer: validPng, originalname: 'b.png', mimetype: 'image/png', size: validPng.length }],
  };
  const payload = {
    title: 't',
    description: 'd',
    category: 'Web Application',
    projectType: 'Individual',
    teamMemberCount: '1',
    submissionDate: new Date().toISOString().slice(0, 10),
    tags: 'tag1,tag2',
    githubUrl: 'https://example.com',
    demoUrl: 'https://example.com',
  };

  const project = await createProject(payload, files, { id: '67d30d8b4a23d5d96c2df98a' });
  console.log('OK');
  console.log(project.title);
  console.log(project.coverImage ? 'hasCover' : 'noCover');
  console.log(Array.isArray(project.images) ? project.images.length : 'noExtra');
} catch (err) {
  console.error('ERR');
  console.error(err.message);
  console.error(err.stack);
  process.exit(1);
}
