import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const demoData = {
  students: [
    { id: '1', name: 'Aarav Patel', class: '10A', attendance: 92, marks: 88 },
    { id: '2', name: 'Mira Shah', class: '10A', attendance: 95, marks: 91 },
  ],
  teachers: [
    { id: '1', name: 'Ms. Riya Kumar', subject: 'Mathematics' },
  ],
  subjects: [{ id: '1', name: 'Mathematics' }],
  attendance: [{ id: '1', studentId: '1', date: '2026-07-13', status: 'Present' }],
  marks: [{ id: '1', studentId: '1', subject: 'Math', score: 88 }],
  assignments: [{ id: '1', title: 'Algebra worksheet', deadline: '2026-07-15' }],
  fees: [{ id: '1', studentId: '1', amount: 5000, status: 'Pending' }],
  events: [{ id: '1', title: 'Parent Meeting', date: '2026-07-14' }],
  notifications: [{ id: '1', message: 'Attendance updated', created_at: '2026-07-13' }],
  timetable: [{ id: '1', day: 'Monday', period: 1, subject: 'Math' }],
  books: [{ id: '1', title: 'Math Workbook', author: 'R. Sharma' }],
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Backend is running' });
});

app.get('/api/data', (_req, res) => {
  res.json(demoData);
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
