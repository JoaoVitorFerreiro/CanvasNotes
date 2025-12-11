import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormProps {
	onLogin: (email: string, password: string) => Promise<boolean>;
	onRegister: (
		email: string,
		password: string,
		name: string,
	) => Promise<boolean>;
}

export function LoginForm({ onLogin, onRegister }: LoginFormProps) {
	const [isLogin, setIsLogin] = useState(true);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		if (isLogin) {
			await onLogin(email, password);
		} else {
			await onRegister(email, password, name);
		}

		setIsLoading(false);
	};

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl font-bold text-center">
						Git Canvas Notes
					</CardTitle>
					<CardDescription className="text-center">
						{isLogin ? "Sign in to your account" : "Create a new account"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{!isLogin && (
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									type="text"
									placeholder="Your name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required={!isLogin}
									disabled={isLoading}
								/>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="your@email.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								disabled={isLoading}
								minLength={6}
							/>
						</div>

						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
						</Button>

						<div className="text-center text-sm">
							<button
								type="button"
								onClick={() => {
									setIsLogin(!isLogin);
									setEmail("");
									setPassword("");
									setName("");
								}}
								className="text-primary hover:underline"
								disabled={isLoading}
							>
								{isLogin
									? "Don't have an account? Sign up"
									: "Already have an account? Sign in"}
							</button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
