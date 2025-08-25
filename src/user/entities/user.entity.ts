import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { UserRole } from '../enums'
import { Session } from '../../session/entities'
import { OtpCode } from '../../auth/entities/otp-code.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  email: string

  @Column()
  name: string

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole

  @Column()
  hashPassword: string

  @Column({ default: false })
  isActive: boolean

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken: string

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[]

  @OneToMany(() => OtpCode, (otp) => otp.user)
  otps: OtpCode[]

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date
}
