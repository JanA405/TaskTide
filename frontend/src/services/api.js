import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

// Auth
export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);

// Projects
export const getProjects = () => API.get('/projects');
export const createProject = (data) => API.post('/projects', data);
export const updateProject = (id, data) => API.put(`/projects/${id}`, data);
export const deleteProject = (id) => API.delete(`/projects/${id}`);

// Tasks
export const getTasks = () => API.get('/tasks');
export const getTaskById = (id) => API.get(`/tasks/${id}`);
export const getTasksBySprint = (sprintId) => API.get(`/tasks/sprint/${sprintId}`);
export const getTasksByUser = (userId) => API.get(`/tasks/user/${userId}`);
export const createTask = (data) => API.post('/tasks', data);
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);

// Sprints
export const getSprints = () => API.get('/sprints');
export const getSprintsByProject = (projectId) => API.get(`/sprints/project/${projectId}`);
export const createSprint = (data) => API.post('/sprints', data);
export const updateSprint = (id, data) => API.put(`/sprints/${id}`, data);
export const deleteSprint = (id) => API.delete(`/sprints/${id}`);

// Teams
export const getTeams = () => API.get('/teams');
export const createTeam = (data) => API.post('/teams', data);
export const updateTeam = (id, data) => API.put(`/teams/${id}`, data);
export const deleteTeam = (id) => API.delete(`/teams/${id}`);

// Users
export const getUsers = () => API.get('/users');
export const updateUserRole = (id, role) => API.put(`/users/${id}/role?role=${role}`);
export const deleteUser = (id) => API.delete(`/users/${id}`);

// Comments
export const getCommentsByTask = (taskId) => API.get(`/comments/task/${taskId}`);
export const createComment = (data) => API.post('/comments', data);

// Attachments
export const getAttachmentsByTask = (taskId) => API.get(`/attachments/${taskId}`);
export const createAttachment = (data) => API.post('/attachments', data);

// Reports
export const getTeamReport = () => API.get('/reports/team');
export const getProjectReport = () => API.get('/reports/project');
export const getPerformanceReport = () => API.get('/reports/performance');

export default API;
