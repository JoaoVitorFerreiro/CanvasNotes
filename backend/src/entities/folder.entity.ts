import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryColumn,
	UpdateDateColumn,
} from "typeorm";
import { Note } from "./note.entity";
import { User } from "./user.entity";

@Entity("folders")
export class Folder {
	@PrimaryColumn()
	id: string;

	@Column({ name: "user_id" })
	userId: number;

	@Column()
	name: string;

	@CreateDateColumn({ name: "created_at" })
	createdAt: Date;

	@UpdateDateColumn({ name: "updated_at" })
	updatedAt: Date;

	@ManyToOne(
		() => User,
		(user) => user.folders,
	)
	@JoinColumn({ name: "user_id" })
	user: User;

	@OneToMany(
		() => Note,
		(note) => note.folder,
	)
	notes: Note[];
}
