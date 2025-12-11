import { GitHubConfig, LocalFolder, LocalNote } from "@/types/local-first";
import Dexie, { Table } from "dexie";

// Definição do banco de dados IndexedDB
class NotesDatabase extends Dexie {
	notes!: Table<LocalNote, string>;
	folders!: Table<LocalFolder, string>;
	config!: Table<{ key: string; value: any }, string>;

	constructor() {
		super("NotesDB");

		// Define o schema do banco
		this.version(1).stores({
			notes: "id, folderId, path, syncStatus, updatedAt, lastSyncedAt",
			folders: "id, name, createdAt",
			config: "key",
		});
	}
}

// Instância única do banco de dados
export const db = new NotesDatabase();

// Funções auxiliares para configuração
export const saveGitHubConfig = async (config: GitHubConfig) => {
	await db.config.put({ key: "github", value: config });
};

export const getGitHubConfig = async (): Promise<GitHubConfig | null> => {
	const result = await db.config.get("github");
	return result?.value || null;
};

export const clearGitHubConfig = async () => {
	await db.config.delete("github");
};

// Funções auxiliares para auth token
export const saveAuthToken = async (token: string) => {
	await db.config.put({ key: "auth_token", value: token });
};

export const getAuthToken = async (): Promise<string | null> => {
	const result = await db.config.get("auth_token");
	return result?.value || null;
};

export const clearAuthToken = async () => {
	await db.config.delete("auth_token");
};

// Funções auxiliares para dados do usuário
export const saveUserData = async (user: any) => {
	await db.config.put({ key: "user", value: user });
};

export const getUserData = async (): Promise<any | null> => {
	const result = await db.config.get("user");
	return result?.value || null;
};

export const clearUserData = async () => {
	await db.config.delete("user");
};

// Limpar todos os dados
export const clearAllData = async () => {
	await db.notes.clear();
	await db.folders.clear();
	await db.config.clear();
};

export default db;
