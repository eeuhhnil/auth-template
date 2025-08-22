import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../user/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'name',
        'createdAt',
        'updatedAt',
        'hashPassword',
        'isActive',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Account is not activated. Please verify your email.',
      );
    }

    if (user && user.hashPassword) {
      const isMatch = bcrypt.compareSync(password, user.hashPassword);
      if (isMatch) {
        const { hashPassword, ...result } = user;
        return result;
      }
    }

    throw new UnauthorizedException('Invalid credentials');
  }
}
