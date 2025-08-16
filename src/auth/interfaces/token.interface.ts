import { UserRole } from '../../user/enums';

export interface Token {
  sub: string;
  jti: string;
  email: string;
  name: string;
  role: UserRole[];
  iat: number;
  exp: number;
}
