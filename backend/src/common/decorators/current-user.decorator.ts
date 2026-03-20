import type { AuthUser } from '@auth/domain/interfaces/auth-user.interface.js';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
	(data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const user = request.user as AuthUser;
		return data ? user[data] : user;
	},
);
