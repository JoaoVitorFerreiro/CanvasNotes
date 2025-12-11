import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { BookOpen, Cloud, Github, Lock } from "lucide-react";

interface LoginScreenProps {
	onSignIn: () => void;
	isLoading?: boolean;
}

export function LoginScreen({ onSignIn, isLoading = false }: LoginScreenProps) {
	return (
		<div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-4 text-center">
					<div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
						<BookOpen className="w-8 h-8 text-primary" />
					</div>
					<CardTitle className="text-3xl">Git Canvas Notes</CardTitle>
					<CardDescription className="text-base">
						Suas notas sincronizadas automaticamente com GitHub
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-6">
					{/* Benefits List */}
					<div className="space-y-3">
						<div className="flex items-start gap-3">
							<Cloud className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
							<div className="space-y-1">
								<p className="text-sm font-medium">Backup Automático</p>
								<p className="text-xs text-muted-foreground">
									Todas as suas notas são salvas automaticamente em um
									repositório privado do GitHub
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
							<div className="space-y-1">
								<p className="text-sm font-medium">100% Privado</p>
								<p className="text-xs text-muted-foreground">
									Seu repositório é privado e apenas você tem acesso às suas
									notas
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3">
							<Github className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
							<div className="space-y-1">
								<p className="text-sm font-medium">Controle de Versão</p>
								<p className="text-xs text-muted-foreground">
									Histórico completo de mudanças com commits no Git
								</p>
							</div>
						</div>
					</div>

					{/* Sign In Button */}
					<Button
						onClick={onSignIn}
						disabled={isLoading}
						className="w-full h-12 text-base gap-2"
						size="lg"
					>
						{isLoading ? (
							<>
								<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
								Conectando...
							</>
						) : (
							<>
								<Github className="w-5 h-5" />
								Entrar com GitHub
							</>
						)}
					</Button>

					{/* Info */}
					<div className="text-center space-y-2">
						<p className="text-xs text-muted-foreground">
							Ao entrar, você autoriza o app a criar um repositório privado
							chamado{" "}
							<code className="text-xs bg-muted px-1.5 py-0.5 rounded">
								notes-backup
							</code>
						</p>
						<p className="text-xs text-muted-foreground">
							Permissões necessárias: acesso a repositórios privados
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
