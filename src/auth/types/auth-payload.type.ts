import { UserRole } from '../../user/enums'

export type AuthPayload = {
  sub: number
  jti: string
  name: string
  role: UserRole
}
