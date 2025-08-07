// Common shape for JWT payloads
export class JwtPayloadDto {
  readonly email: string;
  readonly sub: string; // Mongo’s ObjectId as string
  readonly _id: string;
  readonly userId: string;
  readonly role?: string; // Optional, for role-based access control
}
// What we’ll send back on any successful login
export class LoginResponseDto {
  readonly access_token: string;
}
