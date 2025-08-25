import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DeleteResult, FindOneOptions, ILike, Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { PaginationMetadata } from '../common/interceptors'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from '@nestjs/cache-manager'
import { User } from './entities'
import { QueryUserDto, UpdateUserDto } from './dtos'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findMany(
    query: QueryUserDto,
  ): Promise<{ data: User[]; meta: PaginationMetadata }> {
    const { page = 1, limit = 10, search } = query

    const whereConditions = search
      ? [{ name: ILike(`%${search}%`) }, { email: ILike(`%${search}%`) }]
      : {}

    const [data, total] = await this.userRepository.findAndCount({
      where: whereConditions,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      select: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
    })

    const meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }

    return { data, meta }
  }

  async findOneById(id: number): Promise<Omit<User, 'hashPassword'>> {
    const user = await this.userRepository.findOne({ where: { id: id } })
    if (!user) throw new NotFoundException('User not found')
    const { hashPassword, ...safeUser } = user

    return safeUser
  }

  async findOne(
    filter: FindOneOptions<User>,
    options: { select?: (keyof User)[] } = {},
  ): Promise<User | null> {
    const findOptions: FindOneOptions<User> = {
      ...filter,
      select: options.select,
    }
    return this.userRepository.findOne(findOptions)
  }

  async updateById(
    id: number,
    payload: UpdateUserDto,
  ): Promise<Omit<User, 'hashPassword'>> {
    const user = await this.userRepository.preload({
      id,
      email: payload.email,
      name: payload.name,
      hashPassword: payload.password
        ? bcrypt.hashSync(payload.password, 10)
        : undefined,
    })

    if (!user) throw new NotFoundException('User not found')

    const updatedUser = await this.userRepository.save(user)
    const { hashPassword, ...safeUser } = updatedUser
    return safeUser
  }

  async deleteById(id: number): Promise<DeleteResult> {
    return this.userRepository.delete(id)
  }
}
