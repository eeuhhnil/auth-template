import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'uuid', unique: true })
  refreshJti: string;
  //
  // @Column()
  // accessToken: string;
  //
  // @Column()
  // refreshToken: string;

  @Column()
  ipAddress: string;

  @Column()
  deviceName: string;

  @Column({ type: 'timestamp', nullable: true })
  access_exp: Date;

  @Column({ type: 'timestamp', nullable: true })
  refresh_exp: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
