import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('task_manager_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (data) => api.post('/auth/login', data);
export const signup = (data) => api.post('/auth/signup', data);
export const getProfile = () => api.get('/auth/profile');
export const getDashboard = () => api.get('/dashboard');
export const getProjects = () => api.get('/projects');
export const createProject = (data) => api.post('/projects', data);
export const getTasks = () => api.get('/tasks');
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.patch(`/tasks/${id}`, data);
export const getTeam = () => api.get('/team');
export const getProjectTasks = (projectId) => api.get(`/projects/${projectId}/tasks`);
export default api;
