import { UserRole } from '../../user/enums'

export interface Token {
  jti: string
  sub: string
  name: string
  role: UserRole[]
  iat: number
  exp: number
}
