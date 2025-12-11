import { authAPI } from "@/services/api";
import { useEffect, useState } from "react";
import { useToast } from "./use-toast";

interface User {
	id: number;
	email: string;
	name: string;
}

export function useApiAuth() {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const { toast } = useToast();

	useEffect(() => {
		loadUserFromStorage();
	}, []);

	const loadUserFromStorage = async () => {
		try {
			const token = localStorage.getItem("auth_token");
			const userData = localStorage.getItem("user_data");

			if (token && userData) {
				// Validate token with backend
				const isValid = await validateToken(token);
				if (isValid) {
					setUser(JSON.parse(userData));
				} else {
					// Token invalid - clear storage
					localStorage.removeItem("auth_token");
					localStorage.removeItem("user_data");
				}
			}
		} catch (error) {
			console.error("Error loading user from storage:", error);
			// Clear on any error to force re-login
			localStorage.removeItem("auth_token");
			localStorage.removeItem("user_data");
		} finally {
			setIsLoading(false);
		}
	};

	const validateToken = async (token: string): Promise<boolean> => {
		try {
			await authAPI.validate();
			return true;
		} catch {
			return false;
		}
	};

	const register = async (email: string, password: string, name: string) => {
		try {
			const { token, user: userData } = await authAPI.register(
				email,
				password,
				name,
			);

			// Save to localStorage
			localStorage.setItem("auth_token", token);
			localStorage.setItem("user_data", JSON.stringify(userData));

			setUser(userData);

			toast({
				title: "Account Created",
				description: `Welcome, ${userData.name}!`,
			});

			return true;
		} catch (error: any) {
			console.error("Register error:", error);
			toast({
				title: "Registration Failed",
				description: error.response?.data?.error || "Failed to create account",
				variant: "destructive",
			});
			return false;
		}
	};

	const login = async (email: string, password: string) => {
		try {
			const { token, user: userData } = await authAPI.login(email, password);

			// Save to localStorage
			localStorage.setItem("auth_token", token);
			localStorage.setItem("user_data", JSON.stringify(userData));

			setUser(userData);

			toast({
				title: "Login Successful",
				description: `Welcome back, ${userData.name}!`,
			});

			return true;
		} catch (error: any) {
			console.error("Login error:", error);
			toast({
				title: "Login Failed",
				description: error.response?.data?.error || "Invalid email or password",
				variant: "destructive",
			});
			return false;
		}
	};

	const signOut = () => {
		localStorage.removeItem("auth_token");
		localStorage.removeItem("user_data");
		setUser(null);

		toast({
			title: "Signed Out",
			description: "You have been signed out successfully",
		});
	};

	return {
		user,
		isLoading,
		register,
		login,
		signOut,
	};
}
