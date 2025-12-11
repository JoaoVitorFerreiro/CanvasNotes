import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { Folder } from "./folder.entity";
import { Note } from "./note.entity";

@Entity("users")
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true })
	email: string;

	@Column()
	password: string;

	@Column()
	name: string;

	@CreateDateColumn({ name: "created_at" })
	createdAt: Date;

	@UpdateDateColumn({ name: "updated_at" })
	updatedAt: Date;

	@OneToMany(
		() => Folder,
		(folder) => folder.user,
	)
	folders: Folder[];

	@OneToMany(
		() => Note,
		(note) => note.user,
	)
	notes: Note[];
}
