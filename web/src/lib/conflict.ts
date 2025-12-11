import { ConflictResult, LocalNote } from "@/types/local-first";
import { db } from "./db";

// Detecta se há conflito entre versão local e remota
export const detectConflict = (
	local: LocalNote,
	remote: {
		content: string;
		updatedAt: number;
		sha: string;
	},
): ConflictResult => {
	// Sem conflito se SHAs são iguais
	if (local.githubSha === remote.sha) {
		return {
			hasConflict: false,
			local,
		};
	}

	// Sem conflito se conteúdo é idêntico
	if (local.content === remote.content) {
		return {
			hasConflict: false,
			local,
		};
	}

	// Conflito se versão remota é mais recente E conteúdo diferente
	const localTime = local.updatedAt.getTime();
	if (remote.updatedAt > localTime) {
		return {
			hasConflict: true,
			local,
			remote,
			reason: "Remote version is newer and content differs",
		};
	}

	// Sem conflito - local é mais recente
	return {
		hasConflict: false,
		local,
	};
};

// Resolve conflito mantendo versão local
export const resolveKeepLocal = async (
	local: LocalNote,
): Promise<LocalNote> => {
	// Marca nota como pendente para forçar push
	await db.notes.update(local.id, {
		syncStatus: "pending",
	});

	return {
		...local,
		syncStatus: "pending",
	};
};

// Resolve conflito mantendo versão remota
export const resolveKeepRemote = async (
	local: LocalNote,
	remote: {
		content: string;
		updatedAt: number;
		sha: string;
	},
): Promise<LocalNote> => {
	// Atualiza nota local com dados remotos
	const updated: Partial<LocalNote> = {
		content: remote.content,
		updatedAt: new Date(remote.updatedAt),
		githubSha: remote.sha,
		syncStatus: "synced",
		lastSyncedAt: Date.now(),
	};

	await db.notes.update(local.id, updated);

	return {
		...local,
		...updated,
	} as LocalNote;
};

// Gera diff básico entre duas versões
export const generateDiff = (
	local: string,
	remote: string,
): Array<{ type: "added" | "removed" | "unchanged"; line: string }> => {
	const localLines = local.split("\n");
	const remoteLines = remote.split("\n");

	const diff: Array<{ type: "added" | "removed" | "unchanged"; line: string }> =
		[];

	// Algoritmo simples de diff linha por linha
	let i = 0;
	let j = 0;

	while (i < localLines.length || j < remoteLines.length) {
		const localLine = localLines[i];
		const remoteLine = remoteLines[j];

		if (i >= localLines.length) {
			// Só restam linhas remotas (adicionadas)
			diff.push({ type: "added", line: remoteLine });
			j++;
		} else if (j >= remoteLines.length) {
			// Só restam linhas locais (removidas)
			diff.push({ type: "removed", line: localLine });
			i++;
		} else if (localLine === remoteLine) {
			// Linhas iguais
			diff.push({ type: "unchanged", line: localLine });
			i++;
			j++;
		} else {
			// Linhas diferentes - tentar encontrar próxima correspondência
			const localInRemote = remoteLines.slice(j).indexOf(localLine);
			const remoteInLocal = localLines.slice(i).indexOf(remoteLine);

			if (
				localInRemote !== -1 &&
				(remoteInLocal === -1 || localInRemote < remoteInLocal)
			) {
				// Linha foi adicionada no remoto
				diff.push({ type: "added", line: remoteLine });
				j++;
			} else if (remoteInLocal !== -1) {
				// Linha foi removida no local
				diff.push({ type: "removed", line: localLine });
				i++;
			} else {
				// Ambas as linhas mudaram
				diff.push({ type: "removed", line: localLine });
				diff.push({ type: "added", line: remoteLine });
				i++;
				j++;
			}
		}
	}

	return diff;
};

// Mescla manual (usuário escolhe linha por linha)
export const createManualMerge = (
	local: string,
	remote: string,
	selections: boolean[], // true = local, false = remote
): string => {
	const diff = generateDiff(local, remote);
	const result: string[] = [];
	let selectionIndex = 0;

	for (const item of diff) {
		if (item.type === "unchanged") {
			result.push(item.line);
		} else if (item.type === "removed" || item.type === "added") {
			// Para conflitos, usar seleção do usuário
			if (selectionIndex < selections.length) {
				const useLocal = selections[selectionIndex];
				if (
					(item.type === "removed" && useLocal) ||
					(item.type === "added" && !useLocal)
				) {
					result.push(item.line);
				}
				selectionIndex++;
			}
		}
	}

	return result.join("\n");
};

// Formata diff para exibição
export const formatDiffForDisplay = (
	diff: ReturnType<typeof generateDiff>,
): string => {
	return diff
		.map((item) => {
			switch (item.type) {
				case "added":
					return `+ ${item.line}`;
				case "removed":
					return `- ${item.line}`;
				case "unchanged":
					return `  ${item.line}`;
			}
		})
		.join("\n");
};

// Estatísticas do diff
export const getDiffStats = (diff: ReturnType<typeof generateDiff>) => {
	return {
		added: diff.filter((d) => d.type === "added").length,
		removed: diff.filter((d) => d.type === "removed").length,
		unchanged: diff.filter((d) => d.type === "unchanged").length,
		total: diff.length,
	};
};
