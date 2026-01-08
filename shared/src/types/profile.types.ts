import { MediaAsset } from './media.types';

// Profile Types
export interface UserProfile {
    id: string;
    userId: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    profilePictureId?: string;
    profilePicture?: MediaAsset;
    coverImageId?: string;
    coverImage?: MediaAsset;
    phoneNumber?: string;
    location?: string;
    website?: string;
    birthDate?: Date;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateProfileRequest {
    firstName?: string;
    lastName?: string;
    bio?: string;
    phoneNumber?: string;
    location?: string;
    website?: string;
    birthDate?: Date;
    isPublic?: boolean;
}

export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    bio?: string;
    phoneNumber?: string;
    location?: string;
    website?: string;
    birthDate?: Date;
    isPublic?: boolean;
}

export interface ProfilePictureUploadRequest {
    file: {
        buffer: any;
        originalname: string;
        mimetype: string;
        size: number;
    };
    userId: string;
}

export interface ProfileResponse {
    id: string;
    userId: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    profilePicture?: {
        id: string;
        url: string;
        secureUrl: string;
    };
    coverImage?: {
        id: string;
        url: string;
        secureUrl: string;
    };
    phoneNumber?: string;
    location?: string;
    website?: string;
    birthDate?: Date;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}
