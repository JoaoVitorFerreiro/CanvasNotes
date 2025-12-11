import {
	Body,
	Controller,
	Get,
	Post,
	Request,
	UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("api/auth")
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post("register")
	async register(@Body() registerDto: RegisterDto) {
		return this.authService.register(registerDto);
	}

	@Post("login")
	async login(@Body() loginDto: LoginDto) {
		return this.authService.login(loginDto);
	}

	@Get("validate")
	@UseGuards(JwtAuthGuard)
	validate(@Request() req) {
		return {
			valid: true,
			userId: req.user.id,
		};
	}
}
