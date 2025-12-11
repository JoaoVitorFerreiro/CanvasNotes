import { Folder, Note } from "./notes";

// Tipos estendidos para sistema local-first
export interface LocalNote extends Note {
	path: string; // Caminho no GitHub, ex: "notes/title.md"
	githubSha?: string; // SHA do arquivo no GitHub
	syncStatus: "synced" | "pending" | "conflict" | "error";
	lastSyncedAt?: number; // Timestamp da última sincronização
}

export interface LocalFolder extends Folder {
	githubPath?: string; // Caminho da pasta no GitHub
}

// Configuração do repositório GitHub
export interface GitHubConfig {
	owner: string; // Usuário ou organização do GitHub
	repo: string; // Nome do repositório
	branch: string; // Branch (padrão: main)
	token: string; // Access token do GitHub
	basePath: string; // Caminho base no repo, ex: "notes"
}

// Resultado de sincronização
export interface SyncResult {
	success: boolean;
	noteId: string;
	action: "pushed" | "pulled" | "conflict" | "error";
	message: string;
	conflictData?: ConflictData;
}

// Dados de conflito
export interface ConflictData {
	localNote: LocalNote;
	remoteContent: string;
	remoteUpdatedAt: number;
	remoteSha: string;
}

// Resultado de detecção de conflito
export interface ConflictResult {
	hasConflict: boolean;
	local: LocalNote;
	remote?: {
		content: string;
		updatedAt: number;
		sha: string;
	};
	reason?: string;
}

// Opções de resolução de conflito
export type ConflictResolution = "keep-local" | "keep-remote" | "manual";

// Dados do usuário GitHub
export interface GitHubUser {
	id: number;
	login: string;
	name: string;
	email: string;
	avatar_url: string;
}

// Estado de autenticação
export interface AuthState {
	user: GitHubUser | null;
	token: string | null;
	isAuthenticated: boolean;
}
