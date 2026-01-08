import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async create(email: string, username: string, password: string): Promise<User> {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.usersRepository.create({
            email,
            username,
            password: hashedPassword,
            provider: 'local',
        });
        return this.usersRepository.save(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { username } });
    }

    async findById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async findByProviderId(provider: string, providerId: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { provider, providerId } });
    }

    async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
        await this.usersRepository.update(userId, {
            refreshToken: refreshToken ?? undefined
        });
    }

    async validatePassword(user: User, password: string): Promise<boolean> {
        if (!user.password) return false;
        return bcrypt.compare(password, user.password);
    }

    async createOrUpdateGoogleUser(googleProfile: {
        email: string;
        firstName: string;
        lastName: string;
        picture: string;
        providerId: string;
    }): Promise<User> {
        // Check if user exists by provider ID
        let user = await this.findByProviderId('google', googleProfile.providerId);

        if (user) {
            // Update existing user
            user.firstName = googleProfile.firstName;
            user.lastName = googleProfile.lastName;
            user.picture = googleProfile.picture;
            return this.usersRepository.save(user);
        }

        // Check if user exists by email (migration from local to Google)
        user = await this.findByEmail(googleProfile.email);

        if (user) {
            // Link Google account to existing user
            user.provider = 'google';
            user.providerId = googleProfile.providerId;
            user.firstName = googleProfile.firstName;
            user.lastName = googleProfile.lastName;
            user.picture = googleProfile.picture;
            return this.usersRepository.save(user);
        }

        // Create new user
        const username = googleProfile.email.split('@')[0] + '_' + Math.random().toString(36).substring(7);
        const newUser = this.usersRepository.create({
            email: googleProfile.email,
            username,
            firstName: googleProfile.firstName,
            lastName: googleProfile.lastName,
            picture: googleProfile.picture,
            provider: 'google',
            providerId: googleProfile.providerId,
        });

        return this.usersRepository.save(newUser);
    }
}
