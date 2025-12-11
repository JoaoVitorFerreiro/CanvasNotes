import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateNoteDto {
	@IsString()
	@IsNotEmpty()
	id: string;

	@IsString()
	@IsNotEmpty()
	folderId: string;

	@IsString()
	@IsNotEmpty()
	title: string;

	@IsString()
	@IsIn(["text", "drawing"])
	type: "text" | "drawing";

	@IsOptional()
	@IsString()
	content?: string;

	@IsOptional()
	@IsString()
	thumbnail?: string;

	@IsOptional()
	@IsString()
	canvasBackground?: string;

	@IsOptional()
	@IsString()
	path?: string;

	@IsOptional()
	@IsString()
	githubSha?: string;

	@IsOptional()
	@IsString()
	@IsIn(["pending", "synced", "conflict"])
	syncStatus?: "pending" | "synced" | "conflict";
}
