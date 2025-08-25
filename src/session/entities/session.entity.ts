import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { User } from '../../user/entities/user.entity'

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  user: User

  @Column()
  userId: number

  @Column()
  ip: string

  @Column()
  deviceName: string

  @Column()
  browser: string

  @Column()
  os: string

  @Column({ type: 'timestamp' })
  expiredAt: Date

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  @CreateDateColumn({ type: 'timestamp' })
  updatedAt: Date
}
