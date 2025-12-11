import {
	ConflictException,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { Folder } from "../entities/folder.entity";
import { User } from "../entities/user.entity";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtPayload } from "./interfaces/jwt-payload.interface";

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(User)
		private userRepository: Repository<User>,
		@InjectRepository(Folder)
		private folderRepository: Repository<Folder>,
		private jwtService: JwtService,
	) {}

	async register(registerDto: RegisterDto) {
		const { email, password, name } = registerDto;

		const existingUser = await this.userRepository.findOne({
			where: { email },
		});

		if (existingUser) {
			throw new ConflictException("User already exists with this email");
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = this.userRepository.create({
			email,
			password: hashedPassword,
			name,
		});

		const savedUser = await this.userRepository.save(user);

		try {
			const defaultFolder = this.folderRepository.create({
				id: `folder-${Date.now()}`,
				userId: savedUser.id,
				name: "My Notes",
			});
			await this.folderRepository.save(defaultFolder);
		} catch (error) {
			console.error("Error creating default folder:", error);
		}

		const token = this.generateToken(savedUser);

		return {
			token,
			user: {
				id: savedUser.id,
				email: savedUser.email,
				name: savedUser.name,
			},
		};
	}

	async login(loginDto: LoginDto) {
		const { email, password } = loginDto;

		const user = await this.userRepository.findOne({
			where: { email },
		});

		if (!user) {
			throw new UnauthorizedException("Invalid email or password");
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			throw new UnauthorizedException("Invalid email or password");
		}

		const token = this.generateToken(user);

		return {
			token,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
			},
		};
	}

	private generateToken(user: User): string {
		const payload: JwtPayload = {
			userId: user.id,
			email: user.email,
		};

		return this.jwtService.sign(payload);
	}

	verifyToken(token: string): JwtPayload {
		try {
			return this.jwtService.verify(token);
		} catch (error) {
			throw new UnauthorizedException("Invalid token");
		}
	}
}
