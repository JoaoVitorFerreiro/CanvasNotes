export interface JwtPayload {
  userId: number;
  email: string;
  githubId?: string;
}
