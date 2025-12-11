import { foldersAPI } from "@/services/api";
import { useEffect, useState } from "react";
import { useToast } from "./use-toast";

interface Folder {
	id: string;
	user_id: number;
	name: string;
	created_at: string;
	updated_at: string;
}

export function useApiFolders() {
	const [folders, setFolders] = useState<Folder[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const { toast } = useToast();

	useEffect(() => {
		loadFolders();
	}, []);

	const loadFolders = async () => {
		try {
			setIsLoading(true);
			const data = await foldersAPI.getAll();
			setFolders(data);
		} catch (error: any) {
			console.error("Error loading folders:", error);
			if (error.response?.status !== 401 && error.response?.status !== 403) {
				toast({
					title: "Error",
					description: "Failed to load folders",
					variant: "destructive",
				});
			}
		} finally {
			setIsLoading(false);
		}
	};

	const createFolder = async (id: string, name: string) => {
		try {
			const newFolder = await foldersAPI.create({ id, name });
			setFolders((prev) => [...prev, newFolder]);

			toast({
				title: "Folder Created",
				description: `"${name}" has been created`,
			});

			return newFolder;
		} catch (error: any) {
			console.error("Error creating folder:", error);
			toast({
				title: "Error",
				description: "Failed to create folder",
				variant: "destructive",
			});
			return null;
		}
	};

	const renameFolder = async (id: string, newName: string) => {
		try {
			const updated = await foldersAPI.update(id, newName);
			setFolders((prev) =>
				prev.map((folder) => (folder.id === id ? updated : folder)),
			);

			toast({
				title: "Folder Renamed",
				description: `Renamed to "${newName}"`,
			});

			return true;
		} catch (error: any) {
			console.error("Error renaming folder:", error);
			toast({
				title: "Error",
				description: "Failed to rename folder",
				variant: "destructive",
			});
			return false;
		}
	};

	const deleteFolder = async (id: string) => {
		try {
			await foldersAPI.delete(id);
			setFolders((prev) => prev.filter((folder) => folder.id !== id));

			toast({
				title: "Folder Deleted",
				description: "Folder and all its notes have been deleted",
			});

			return true;
		} catch (error: any) {
			console.error("Error deleting folder:", error);
			toast({
				title: "Error",
				description: "Failed to delete folder",
				variant: "destructive",
			});
			return false;
		}
	};

	return {
		folders,
		isLoading,
		createFolder,
		renameFolder,
		deleteFolder,
		refreshFolders: loadFolders,
	};
}
