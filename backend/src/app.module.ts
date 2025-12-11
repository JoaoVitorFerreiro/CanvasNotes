import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { Folder } from "./entities/folder.entity";
import { Note } from "./entities/note.entity";
import { User } from "./entities/user.entity";
import { FoldersModule } from "./folders/folders.module";
import { NotesModule } from "./notes/notes.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				type: "better-sqlite3",
				database: configService.get<string>("DATABASE_PATH") || "./database.db",
				entities: [User, Folder, Note],
				synchronize: true,
			}),
			inject: [ConfigService],
		}),
		AuthModule,
		FoldersModule,
		NotesModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
