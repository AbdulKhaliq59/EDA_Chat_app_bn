export class GoogleAuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    userId: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
    provider: string;
  };
}
