import axios from "axios";

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Create axios instance
const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Add token to requests if available
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("auth_token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Handle auth errors
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401 || error.response?.status === 403) {
			console.error("Authentication error:", error.response?.data);

			// Token invalid or expired - clear storage
			localStorage.removeItem("auth_token");
			localStorage.removeItem("user_data");

			// Reload page to trigger login screen
			window.location.reload();
		}
		return Promise.reject(error);
	},
);

// Auth API
export const authAPI = {
	register: async (email: string, password: string, name: string) => {
		const response = await api.post("/auth/register", {
			email,
			password,
			name,
		});
		return response.data;
	},

	login: async (email: string, password: string) => {
		const response = await api.post("/auth/login", { email, password });
		return response.data;
	},

	validate: async () => {
		const response = await api.get("/auth/validate");
		return response.data;
	},
};

// Folders API
export const foldersAPI = {
	getAll: async () => {
		const response = await api.get("/folders");
		return response.data;
	},

	getById: async (id: string) => {
		const response = await api.get(`/folders/${id}`);
		return response.data;
	},

	create: async (folder: { id: string; name: string }) => {
		const response = await api.post("/folders", folder);
		return response.data;
	},

	update: async (id: string, name: string) => {
		const response = await api.put(`/folders/${id}`, { name });
		return response.data;
	},

	delete: async (id: string) => {
		await api.delete(`/folders/${id}`);
	},
};

// Notes API
export const notesAPI = {
	getAll: async () => {
		const response = await api.get("/notes");
		return response.data;
	},

	getByFolder: async (folderId: string) => {
		const response = await api.get("/notes", { params: { folderId } });
		return response.data;
	},

	getPending: async () => {
		const response = await api.get("/notes/pending");
		return response.data;
	},

	getById: async (id: string) => {
		const response = await api.get(`/notes/${id}`);
		return response.data;
	},

	create: async (note: {
		id: string;
		folderId: string;
		title: string;
		type: "text" | "drawing";
		content?: string;
		thumbnail?: string;
		canvasBackground?: string;
		path?: string;
		githubSha?: string;
		syncStatus?: string;
	}) => {
		const response = await api.post("/notes", note);
		return response.data;
	},

	update: async (id: string, updates: any) => {
		const response = await api.put(`/notes/${id}`, updates);
		return response.data;
	},

	delete: async (id: string) => {
		await api.delete(`/notes/${id}`);
	},
};

export default api;
