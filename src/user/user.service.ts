import {ConflictException, Injectable, NotFoundException} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {User} from "./entities/user.entity";
import {Repository} from "typeorm";
import * as bcrypt from 'bcrypt'
import {CreateUserDto, QueryUserDto, UpdateUserDto} from "./dtos/user.dto";
import {PaginationMetadata} from "../common/interceptors";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ){}

    async create(payload: CreateUserDto): Promise<User>{
        const existing = await this.userRepository.exists({
            where: {
                email: payload.email
            }
        })

        if(existing){
            throw new ConflictException("Email already exists")
        }

        const user = this.userRepository.create({
            email: payload.email,
            name: payload.name,
            hashPassword: bcrypt.hashSync(payload.password, 10)
        });

        return this.userRepository.save(user);
    }

    async findMany(query: QueryUserDto): Promise<{data: User[], meta: PaginationMetadata}>{
        const  {page = 1, limit =  10, search} = query

        const user   = this.userRepository.createQueryBuilder('user')

        if (search) {
            user.andWhere(
                '(user.name ILIKE :search OR user.email ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        const [data, total] = await user
            .skip((page-1) * limit)
            .take(limit)
            .orderBy("user.createdAt", "DESC")
            .getManyAndCount()

        const meta = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }

        return {data, meta}
    }

    async findOneById(id: number): Promise<Omit<User, 'hashPassword'>>{
        const user = await this.userRepository.findOne({where: {id: id}});

        if(!user){
            throw new NotFoundException('User not found');
        }

        const  {hashPassword, ...safeUser}  =  user

        return safeUser;
    }

    async updateById(id: number, payload: UpdateUserDto): Promise<Omit<User, 'hashPassword'>> {

        const hashPassword = bcrypt.hashSync(payload.password, 10)
        await this.userRepository.update(id, {
            email: payload.email,
            name: payload.name,
            hashPassword: hashPassword
        });

        const user =  await  this.userRepository.findOneBy({ id });

        if(!user){
            throw new NotFoundException('User not found');
        }

        const { hashPassword: _removed, ...safeUser}  = user

        return safeUser;
    }


    async deleteById(id: number): Promise<User>{
        const user =  await  this.userRepository.findOneBy({ id });

        if(!user){
            throw new NotFoundException('User not found');
        }

        return this.userRepository.remove(user);
    }
}