import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DeleteResult, ILike, Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { PaginationMetadata } from '../common/interceptors'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from '@nestjs/cache-manager'
import { User } from './entities'
import { QueryUserDto, UpdateMeDto, UpdateUserDto } from './dtos'
import * as path from 'node:path'
import { StorageService } from '../storage/storage.service'
import { AuthPayload } from '../auth/types'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly storageService: StorageService,
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

  async updateById(
    id: number,
    payload: UpdateUserDto,
  ): Promise<Omit<User, 'hashPassword'>> {
    const { password, ...rest } = payload

    const user = await this.userRepository.preload({
      id,
      ...rest,
      hashPassword: password ? bcrypt.hashSync(password, 10) : undefined,
    })

    if (!user) throw new NotFoundException('User not found')

    const updatedUser = await this.userRepository.save(user)
    const { hashPassword, ...safeUser } = updatedUser
    return safeUser
  }

  async updateMe(
    authPayload: AuthPayload,
    payload: UpdateMeDto,
    file?: Express.Multer.File,
  ): Promise<Omit<User, 'hashPassword'>> {
    const user = await this.userRepository.findOne({
      where: { id: authPayload.sub },
    })
    if (!user) throw new NotFoundException('User not found')

    let avatar: string | undefined
    if (file) {
      const fileExtension = path.extname(file.originalname)
      avatar = await this.storageService.uploadFile(
        `users/avatar/${authPayload.sub}${fileExtension}`,
        file,
      )
    }

    if (payload.removeAvatar) {
      const user = await this.userRepository.findOne({
        where: { id: authPayload.sub },
      })
      if (user?.avatar) {
        await this.storageService.deleteFile(
          this.storageService.extractKeyFromUrl(user.avatar),
        )
      }
    }
    user.avatar = avatar ? avatar : user.avatar

    Object.assign(user, payload)
    const updatedUser = await this.userRepository.save(user)
    const { hashPassword, ...safeUser } = updatedUser
    return safeUser
  }

  async deleteById(id: number): Promise<DeleteResult> {
    return this.userRepository.delete(id)
  }
}
