import { useEffect, useMemo, useState } from 'react';
import { login, signup, getProfile, getDashboard, getProjects, createProject, getTasks, createTask, updateTask, getTeam } from './api';

const defaultForm = { email: '', password: '', name: '', role: 'member' };

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [form, setForm] = useState(defaultForm);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [team, setTeam] = useState([]);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', project_id: '', assignee_id: '', due_date: '' });
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';
  const projectOptions = useMemo(() => projects.map((project) => ({ label: project.name, value: project.id })), [projects]);
  const teamOptions = useMemo(() => team.filter((member) => member.role === 'member').map((member) => ({ label: member.name, value: member.id })), [team]);

  const fixedError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 3500);
  };

  const loadData = async () => {
    try {
      const [profileRes, dashboardRes, projectRes, taskRes, teamRes] = await Promise.all([
        getProfile(),
        getDashboard(),
        getProjects(),
        getTasks(),
        getTeam()
      ]);
      setUser(profileRes.data.user);
      setDashboard(dashboardRes.data.summary);
      setProjects(projectRes.data.projects);
      setTasks(taskRes.data.tasks);
      setTeam(teamRes.data.members);
      setView('dashboard');
    } catch (err) {
      console.error(err);
      localStorage.removeItem('task_manager_token');
      setUser(null);
      setView('login');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('task_manager_token');
    if (token) {
      loadData();
    }
  }, []);

  const handleLogin = async () => {
    try {
      const res = await login({ email: form.email, password: form.password });
      localStorage.setItem('task_manager_token', res.data.token);
      setUser(res.data.user);
      setForm(defaultForm);
      await loadData();
    } catch (err) {
      fixedError(err.response?.data?.error || 'Unable to login');
    }
  };

  const handleSignup = async () => {
    try {
      const res = await signup(form);
      localStorage.setItem('task_manager_token', res.data.token);
      setUser(res.data.user);
      setForm(defaultForm);
      await loadData();
    } catch (err) {
      fixedError(err.response?.data?.error || 'Unable to sign up');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('task_manager_token');
    setUser(null);
    setView('login');
    setProjects([]);
    setTasks([]);
    setDashboard(null);
    setTeam([]);
  };

  const handleCreateProject = async () => {
    if (!newProject.name) return fixedError('Project name is required');
    try {
      await createProject(newProject);
      setNewProject({ name: '', description: '' });
      const projectRes = await getProjects();
      setProjects(projectRes.data.projects);
    } catch (err) {
      fixedError(err.response?.data?.error || 'Unable to create project');
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.project_id) return fixedError('Task title and project are required');
    try {
      await createTask({
        title: newTask.title,
        description: newTask.description,
        project_id: Number(newTask.project_id),
        assignee_id: newTask.assignee_id ? Number(newTask.assignee_id) : null,
        due_date: newTask.due_date || null
      });
      setNewTask({ title: '', description: '', project_id: '', assignee_id: '', due_date: '' });
      const taskRes = await getTasks();
      setTasks(taskRes.data.tasks);
    } catch (err) {
      fixedError(err.response?.data?.error || 'Unable to create task');
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      await updateTask(taskId, { status });
      const taskRes = await getTasks();
      setTasks(taskRes.data.tasks);
    } catch (err) {
      fixedError(err.response?.data?.error || 'Unable to update task');
    }
  };

  if (!user) {
    return (
      <div className="page-container">
        <div className="auth-card">
          <h1>{view === 'login' ? 'Login' : 'Sign Up'}</h1>
          {error && <div className="alert">{error}</div>}
          {view === 'signup' && (
            <label>
              Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
            </label>
          )}
          <label>
            Email
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" />
          </label>
          {view === 'signup' && (
            <label>
              Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          )}
          <button onClick={view === 'login' ? handleLogin : handleSignup}>
            {view === 'login' ? 'Login' : 'Create account'}
          </button>
          <div className="switch-mode">
            {view === 'login' ? (
              <span>
                Need an account? <button onClick={() => setView('signup')}>Sign up</button>
              </span>
            ) : (
              <span>
                Already have an account? <button onClick={() => setView('login')}>Login</button>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="topbar">
        <div>
          <h1>Team Task Manager</h1>
          <p>Welcome, {user.name} ({user.role})</p>
        </div>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </header>
      <main>
        <section className="dashboard-grid">
          <div className="summary-card">
            <h2>Dashboard</h2>
            {dashboard ? (
              <div className="summary-list">
                <div>Total tasks: {dashboard.totalTasks}</div>
                <div>Pending: {dashboard.pending}</div>
                <div>Overdue: {dashboard.overdue}</div>
                <div>Projects: {dashboard.projects}</div>
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </div>
          <div className="summary-card">
            <h2>Quick Actions</h2>
            {isAdmin ? (
              <div>
                <div className="action-block">
                  <h3>Create project</h3>
                  <input placeholder="Project name" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} />
                  <input placeholder="Description" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
                  <button onClick={handleCreateProject}>Create project</button>
                </div>
                <div className="action-block">
                  <h3>Create task</h3>
                  <input placeholder="Task title" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
                  <textarea placeholder="Description" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
                  <select value={newTask.project_id} onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}>
                    <option value="">Select project</option>
                    {projectOptions.map((project) => (
                      <option key={project.value} value={project.value}>{project.label}</option>
                    ))}
                  </select>
                  <select value={newTask.assignee_id} onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value })}>
                    <option value="">Select assignee</option>
                    {teamOptions.map((member) => (
                      <option key={member.value} value={member.value}>{member.label}</option>
                    ))}
                  </select>
                  <input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} />
                  <button onClick={handleCreateTask}>Create task</button>
                </div>
              </div>
            ) : (
              <div>Members can work on tasks assigned to them from the admin dashboard.</div>
            )}
          </div>
        </section>
        <section className="content-section">
          <div className="cards-row">
            <div className="card">
              <h2>Projects</h2>
              {projects.length ? (
                <ul>
                  {projects.map((project) => (
                    <li key={project.id}>
                      <strong>{project.name}</strong>
                      <p>{project.description}</p>
                      <small>Owner: {project.owner_name}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No projects yet.</p>
              )}
            </div>
            <div className="card">
              <h2>Team</h2>
              {team.length ? (
                <ul>
                  {team.map((member) => (
                    <li key={member.id}>{member.name} ({member.role})</li>
                  ))}
                </ul>
              ) : (
                <p>No team members available.</p>
              )}
            </div>
          </div>
          <div className="card">
            <h2>Tasks</h2>
            {tasks.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Project</th>
                    <th>Assignee</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className={task.status === 'done' ? 'done-row' : task.due_date && new Date(task.due_date) < new Date() ? 'overdue-row' : ''}>
                      <td>{task.title}</td>
                      <td>{task.project_name}</td>
                      <td>{task.assignee_name || 'Unassigned'}</td>
                      <td>{task.status}</td>
                      <td>{task.due_date || '-'}</td>
                      <td>
                        <select value={task.status} onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}>
                          <option value="todo">Todo</option>
                          <option value="in-progress">In progress</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No tasks found.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
