import { Injectable } from '@nestjs/common'
import { Session } from './entities'
import { InjectRepository } from '@nestjs/typeorm'
import { ILike, LessThan, Repository } from 'typeorm'
import { CreateSessionDto, QuerySessionDto } from './dtos'
import { PaginationMetadata } from '../common/interceptors'
import { Cron, CronExpression } from '@nestjs/schedule'

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async create(payload: CreateSessionDto) {
    const session = this.sessionRepository.create(payload)
    return await this.sessionRepository.save(session)
  }

  async findById(id: string) {
    return this.sessionRepository.findOne({ where: { id } })
  }
  async findManySession(
    query: QuerySessionDto,
  ): Promise<{ data: Session[]; meta: PaginationMetadata }> {
    const { page = 1, limit = 10, search } = query

    const whereConditions = search
      ? [
          { ip: ILike(`%${search}%`) },
          { deviceName: ILike(`%${search}%`) },
          { browser: ILike(`%${search}%`) },
          { os: ILike(`%${search}%`) },
        ]
      : {}

    const [data, total] = await this.sessionRepository.findAndCount({
      where: whereConditions,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    })

    const meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }

    return { data, meta }
  }

  async update(data: Partial<Omit<Session, 'id'>>) {
    const user = await this.sessionRepository.preload(data)
    await this.sessionRepository.save(data)
    return user
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpiredSessions() {
    const deleted = await this.sessionRepository.delete({
      expiredAt: LessThan(new Date()),
    })
    console.log(`Deleted ${deleted.affected} expired sessions`)
  }
}
