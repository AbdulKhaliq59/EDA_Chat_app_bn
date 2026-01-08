import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import FormData from 'form-data';

@Injectable()
export class ProfileService {
    private readonly profileServiceUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.profileServiceUrl = this.configService.get<string>('PROFILE_SERVICE_URL') || 'http://localhost:3004';
    }

    /**
     * Generic HTTP request handler for all profile service calls
     */
    private async request<T>(
        method: 'get' | 'post' | 'patch' | 'delete',
        endpoint: string,
        data?: any,
        token?: string,
        isFormData?: boolean,
    ): Promise<T> {
        try {
            const url = `${this.profileServiceUrl}${endpoint}`;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            let response;
            switch (method) {
                case 'get':
                    response = await firstValueFrom(
                        this.httpService.get(url, { headers }),
                    );
                    break;
                case 'post':
                    response = await firstValueFrom(
                        this.httpService.post(url, data, { headers }),
                    );
                    break;
                case 'patch':
                    response = await firstValueFrom(
                        this.httpService.patch(url, data, { headers }),
                    );
                    break;
                case 'delete':
                    response = await firstValueFrom(
                        this.httpService.delete(url, { headers }),
                    );
                    break;
            }
            return response.data;
        } catch (error) {
            throw new HttpException(
                error.response?.data?.message || `Failed to ${method} ${endpoint}`,
                error.response?.status || 500,
            );
        }
    }

    /**
     * Create a new profile
     */
    async createProfile(userId: string, profileData: any): Promise<any> {
        return this.request('post', '/profiles', profileData, profileData.token);
    }

    /**
     * Get current user's profile
     */
    async getMyProfile(token: string): Promise<any> {
        return this.request('get', '/profiles/me', undefined, token);
    }

    /**
     * Get any user's profile
     */
    async getProfileByUserId(userId: string): Promise<any> {
        return this.request('get', `/profiles/${userId}`);
    }

    /**
     * Update profile
     */
    async updateProfile(token: string, profileData: any): Promise<any> {
        return this.request('patch', '/profiles/me', profileData, token);
    }

    /**
     * Upload profile picture
     */
    async uploadProfilePicture(token: string, file: any): Promise<any> {
        return this.uploadFileInternal(token, '/profiles/me/picture', file);
    }

    /**
     * Upload cover image
     */
    async uploadCoverImage(token: string, file: any): Promise<any> {
        return this.uploadFileInternal(token, '/profiles/me/cover', file);
    }

    /**
     * Delete profile picture
     */
    async deleteProfilePicture(token: string): Promise<any> {
        return this.request('delete', '/profiles/me/picture', undefined, token);
    }

    /**
     * Generic file upload handler
     */
    private async uploadFileInternal(token: string, endpoint: string, file: any): Promise<any> {
        try {
            const formData = new FormData();
            formData.append('file', file.buffer, file.originalname);

            const response = await firstValueFrom(
                this.httpService.post(`${this.profileServiceUrl}${endpoint}`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        ...formData.getHeaders(),
                    },
                }),
            );
            return response.data;
        } catch (error) {
            throw new HttpException(
                error.response?.data?.message || `Failed to upload file to ${endpoint}`,
                error.response?.status || 500,
            );
        }
    }
}
