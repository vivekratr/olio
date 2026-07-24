export interface JwtPayload {
  userId: string;
  accountId: string;
  email: string;
}

export interface AuthenticatedUser {
  id: string;
  accountId: string;
  email: string;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  accessToken: string;
}
