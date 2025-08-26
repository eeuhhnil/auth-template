import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { User } from '../../user/entities'

@Entity('otp_codes')
export class OtpCode {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number

  @Column({ type: 'text', nullable: false, unique: true })
  code: string

  @Column()
  userId: number

  @ManyToOne(() => User, (user: User) => user.otps, { onDelete: 'CASCADE' })
  user: User

  @Column()
  expiresAt: Date

  @CreateDateColumn()
  createdAt: Date
}
