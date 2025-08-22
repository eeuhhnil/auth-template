import { UserRole } from '../../user/enums';

export interface Token {
  sub: string;
  email: string;
  name: string;
  role: UserRole[];
  jti: string;
  iat: number;
  exp: number;
}
