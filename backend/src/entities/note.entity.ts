import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryColumn,
	UpdateDateColumn,
} from "typeorm";
import { Folder } from "./folder.entity";
import { User } from "./user.entity";

@Entity("notes")
export class Note {
	@PrimaryColumn()
	id: string;

	@Column({ name: "user_id" })
	userId: number;

	@Column({ name: "folder_id" })
	folderId: string;

	@Column()
	title: string;

	@Column({ type: "text" })
	type: "text" | "drawing";

	@Column({ type: "text", nullable: true })
	content: string | null;

	@Column({ type: "text", nullable: true })
	thumbnail: string | null;

	@Column({ name: "canvas_background", default: "grid" })
	canvasBackground: string;

	@Column({ type: "text", nullable: true })
	path: string | null;

	@Column({ name: "github_sha", type: "text", nullable: true })
	githubSha: string | null;

	@Column({ name: "sync_status", default: "pending" })
	syncStatus: "pending" | "synced" | "conflict";

	@CreateDateColumn({ name: "created_at" })
	createdAt: Date;

	@UpdateDateColumn({ name: "updated_at" })
	updatedAt: Date;

	@ManyToOne(
		() => User,
		(user) => user.notes,
	)
	@JoinColumn({ name: "user_id" })
	user: User;

	@ManyToOne(
		() => Folder,
		(folder) => folder.notes,
	)
	@JoinColumn({ name: "folder_id" })
	folder: Folder;
}
