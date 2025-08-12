import { SetMetadata } from '@nestjs/common';
import {UserRole} from "../../user/enums";

export const USER_ROLE_KEY = 'user_roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(USER_ROLE_KEY, roles);
