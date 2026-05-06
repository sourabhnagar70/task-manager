require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, init } = require('./db');
const { z } = require('zod');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use(cors());
app.use(express.json());
init();

const clientDist = path.join(__dirname, '../client/dist');
if (process.env.NODE_ENV !== 'test') {
  app.use(express.static(clientDist));
}


const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(3).optional(),
  role: z.enum(['admin', 'member']).optional()
});

const createToken = (user) => jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '12h' });

const authenticate = (req, res, next) => {
  const auth = req.headers.authorization?.split(' ');
  if (!auth || auth[0] !== 'Bearer' || !auth[1]) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(auth[1], JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin role required' });
  next();
};

const getUserByEmail = (email) => new Promise((resolve, reject) => {
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return reject(err);
    resolve(row);
  });
});

const getUserById = (id) => new Promise((resolve, reject) => {
  db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id], (err, row) => {
    if (err) return reject(err);
    resolve(row);
  });
});

const runSql = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) return reject(err);
    resolve({ lastID: this.lastID, changes: this.changes });
  });
});

const allSql = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) return reject(err);
    resolve(rows);
  });
});

const getSql = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) return reject(err);
    resolve(row);
  });
});

const ensureAdminUser = async () => {
  const admin = await getUserByEmail('admin@taskmanager.local');
  if (!admin) {
    const password = await bcrypt.hash('Admin123', 10);
    await runSql(
      'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)',
      ['Administrator', 'admin@taskmanager.local', password, 'admin', new Date().toISOString()]
    );
    console.log('Default admin user created: admin@taskmanager.local / Admin123');
  }
};

ensureAdminUser();

app.post('/api/auth/signup', async (req, res) => {
  try {
    const data = authSchema.parse(req.body);
    if (!data.name) return res.status(400).json({ error: 'Name is required' });
    const exists = await getUserByEmail(data.email);
    if (exists) return res.status(400).json({ error: 'Email already exists' });
    const hashed = await bcrypt.hash(data.password, 10);
    const role = data.role === 'admin' ? 'admin' : 'member';
    await runSql(
      'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)',
      [data.name, data.email, hashed, role, new Date().toISOString()]
    );
    const user = await getUserByEmail(data.email);
    const token = createToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const data = authSchema.pick({ email: true, password: true }).parse(req.body);
    const user = await getUserByEmail(data.email);
    if (!user) return res.status(400).json({ error: 'Invalid login' });
    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid login' });
    const token = createToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Login failed' });
  }
});

app.get('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Unable to load profile' });
  }
});

app.get('/api/users', authenticate, requireAdmin, async (req, res) => {
  const users = await allSql('SELECT id, name, email, role FROM users ORDER BY created_at DESC');
  res.json({ users });
});

app.get('/api/projects', authenticate, async (req, res) => {
  const projects = await allSql(
    `SELECT p.id, p.name, p.description, p.owner_id, u.name AS owner_name, p.created_at
     FROM projects p
     JOIN users u ON u.id = p.owner_id
     ORDER BY p.created_at DESC`
  );
  res.json({ projects });
});

app.post('/api/projects', authenticate, requireAdmin, async (req, res) => {
  const projectSchema = z.object({ name: z.string().min(3), description: z.string().optional() });
  try {
    const data = projectSchema.parse(req.body);
    const result = await runSql(
      'INSERT INTO projects (name, description, owner_id, created_at) VALUES (?, ?, ?, ?)',
      [data.name, data.description || '', req.user.id, new Date().toISOString()]
    );
    const project = await getSql('SELECT * FROM projects WHERE id = ?', [result.lastID]);
    res.json({ project });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Unable to create project' });
  }
});

app.get('/api/projects/:id/tasks', authenticate, async (req, res) => {
  const projectId = Number(req.params.id);
  const tasks = await allSql(
    `SELECT t.*, u.name AS assignee_name
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assignee_id
     WHERE t.project_id = ?
     ORDER BY t.created_at DESC`,
    [projectId]
  );
  res.json({ tasks });
});

app.post('/api/tasks', authenticate, requireAdmin, async (req, res) => {
  const taskSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    project_id: z.number().int(),
    assignee_id: z.number().int().optional(),
    due_date: z.string().optional()
  });
  try {
    const data = taskSchema.parse(req.body);
    const result = await runSql(
      'INSERT INTO tasks (title, description, project_id, assignee_id, due_date, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [data.title, data.description || '', data.project_id, data.assignee_id || null, data.due_date || null, new Date().toISOString()]
    );
    const task = await getSql('SELECT * FROM tasks WHERE id = ?', [result.lastID]);
    res.json({ task });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Unable to create task' });
  }
});

app.get('/api/tasks', authenticate, async (req, res) => {
  const query = req.user.role === 'admin'
    ? `SELECT t.*, p.name AS project_name, u.name AS assignee_name FROM tasks t LEFT JOIN projects p ON p.id = t.project_id LEFT JOIN users u ON u.id = t.assignee_id ORDER BY t.created_at DESC`
    : `SELECT t.*, p.name AS project_name, u.name AS assignee_name FROM tasks t LEFT JOIN projects p ON p.id = t.project_id LEFT JOIN users u ON u.id = t.assignee_id WHERE t.assignee_id = ? ORDER BY t.created_at DESC`;
  const params = req.user.role === 'admin' ? [] : [req.user.id];
  const tasks = await allSql(query, params);
  res.json({ tasks });
});

app.patch('/api/tasks/:id', authenticate, async (req, res) => {
  const taskId = Number(req.params.id);
  const updateSchema = z.object({ status: z.enum(['todo', 'in-progress', 'done']), title: z.string().min(3).optional(), description: z.string().optional(), assignee_id: z.number().int().optional(), due_date: z.string().optional() });
  try {
    const data = updateSchema.parse(req.body);
    const existing = await getSql('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    if (req.user.role !== 'admin' && existing.assignee_id !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed' });
    }
    const updates = {
      title: data.title ?? existing.title,
      description: data.description ?? existing.description,
      status: data.status ?? existing.status,
      assignee_id: data.assignee_id ?? existing.assignee_id,
      due_date: data.due_date ?? existing.due_date
    };
    await runSql(
      `UPDATE tasks SET title = ?, description = ?, status = ?, assignee_id = ?, due_date = ? WHERE id = ?`,
      [updates.title, updates.description, updates.status, updates.assignee_id || null, updates.due_date || null, taskId]
    );
    const task = await getSql('SELECT * FROM tasks WHERE id = ?', [taskId]);
    res.json({ task });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Unable to update task' });
  }
});

app.get('/api/dashboard', authenticate, async (req, res) => {
  const totalTasks = await getSql('SELECT COUNT(*) AS count FROM tasks');
  const pending = await getSql(`SELECT COUNT(*) AS count FROM tasks WHERE status != 'done'`);
  const overdue = await getSql(`SELECT COUNT(*) AS count FROM tasks WHERE due_date IS NOT NULL AND due_date < ? AND status != 'done'`, [new Date().toISOString()]);
  const projects = await getSql('SELECT COUNT(*) AS count FROM projects');
  const tasksByStatus = await allSql(`SELECT status, COUNT(*) AS count FROM tasks GROUP BY status`);
  res.json({ summary: { totalTasks: totalTasks.count, pending: pending.count, overdue: overdue.count, projects: projects.count, tasksByStatus } });
});

app.get('/api/team', authenticate, async (req, res) => {
  const members = await allSql('SELECT id, name, email, role FROM users ORDER BY name');
  res.json({ members });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
