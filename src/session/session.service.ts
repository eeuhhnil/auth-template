import { Injectable } from '@nestjs/common';
import { Session } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async findManySession() {
    return this.sessionRepository.find();
  }
}
