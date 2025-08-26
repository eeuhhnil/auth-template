import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { User } from '../../user/entities'

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'userId' })
  user: User

  @Column()
  userId: number

  @Column({ type: 'varchar' })
  ip: string

  @Column({ type: 'varchar' })
  deviceName: string

  @Column()
  browser: string

  @Column()
  os: string

  @Column({ type: 'timestamp' })
  expiredAt: Date

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date
}
