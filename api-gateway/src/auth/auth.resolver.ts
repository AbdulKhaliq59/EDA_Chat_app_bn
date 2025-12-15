import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthResponse } from './dto/auth-response.dto';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { RefreshTokenInput } from './dto/refresh-token.input';


@Resolver()
export class AuthResolver {
    constructor(private readonly authService: AuthService) { }

    @Mutation(() => AuthResponse)
    async register(@Args('input') input: RegisterInput): Promise<AuthResponse> {
        return this.authService.register(input.email, input.username, input.password);
    }

    @Mutation(() => AuthResponse)
    async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
        return this.authService.login(input.email, input.password);
    }

    @Mutation(() => AuthResponse)
    async refreshToken(@Args('input') input: RefreshTokenInput): Promise<AuthResponse> {
        return this.authService.refreshToken(input.refreshToken);
    }

    @Query(() => String)
    async hello(): Promise<string> {
        return 'Hello from Auth!';
    }
}
