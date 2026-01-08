import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../entities/profile.entity';
import { MediaAsset } from '../entities/media-asset.entity';
import { CreateProfileDto, UpdateProfileDto, ProfileResponseDto } from '../dto/profile.dto';
import { CloudinaryService } from './cloudinary.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { KAFKA_TOPICS } from '../kafka/topics';
import { MediaType } from '../entities/media-asset.entity';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(UserProfile)
    private profileRepository: Repository<UserProfile>,
    @InjectRepository(MediaAsset)
    private mediaAssetRepository: Repository<MediaAsset>,
    private cloudinaryService: CloudinaryService,
    private kafkaProducer: KafkaProducerService,
  ) {}

  /**
   * Create a new user profile
   */
  async createProfile(userId: string, createProfileDto: CreateProfileDto): Promise<ProfileResponseDto> {
    try {
      // Check if profile already exists
      const existingProfile = await this.profileRepository.findOne({
        where: { userId },
      });

      if (existingProfile) {
        throw new BadRequestException('Profile already exists for this user');
      }

      const profile = this.profileRepository.create({
        userId,
        ...createProfileDto,
      });

      const savedProfile = await this.profileRepository.save(profile);
      return this.profileToDto(savedProfile);
    } catch (error) {
      this.logger.error('Failed to create profile', error);
      throw error;
    }
  }

  /**
   * Get user profile by userId
   */
  async getProfileByUserId(userId: string): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile not found for user ${userId}`);
    }

    // Fetch media assets if they exist
    const profileData = { ...profile };
    if (profile.profilePictureId) {
      const media = await this.mediaAssetRepository.findOne({
        where: { id: profile.profilePictureId },
      });
      if (media) {
        (profileData as any).profilePicture = {
          id: media.id,
          url: media.url,
          secureUrl: media.secureUrl,
          publicId: media.publicId,
        };
      }
    }

    return this.profileToDto(profileData as UserProfile, profileData as any);
  }

  /**
   * Get user profile by ID
   */
  async getProfileById(profileId: string): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile not found`);
    }

    const profileData = { ...profile };
    if (profile.profilePictureId) {
      const media = await this.mediaAssetRepository.findOne({
        where: { id: profile.profilePictureId },
      });
      if (media) {
        (profileData as any).profilePicture = {
          id: media.id,
          url: media.url,
          secureUrl: media.secureUrl,
          publicId: media.publicId,
        };
      }
    }

    return this.profileToDto(profileData as UserProfile, profileData as any);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile not found for user ${userId}`);
    }

    // Update profile fields
    Object.assign(profile, updateProfileDto);
    const updatedProfile = await this.profileRepository.save(profile);

    // Publish event
    await this.publishProfileUpdatedEvent(updatedProfile, userId);

    return this.profileToDto(updatedProfile);
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile not found for user ${userId}`);
    }

    try {
      // Upload to Cloudinary
      const mediaAsset = await this.cloudinaryService.uploadFile(
        file,
        MediaType.IMAGE,
        userId,
      );

      const previousMediaId = profile.profilePictureId;

      // Update profile with new picture
      profile.profilePictureId = mediaAsset.id;
      const updatedProfile = await this.profileRepository.save(profile);

      // Delete old picture if it exists
      if (previousMediaId) {
        const oldMedia = await this.mediaAssetRepository.findOne({
          where: { id: previousMediaId },
        });
        if (oldMedia) {
          await this.cloudinaryService.deleteFile(oldMedia.publicId, userId);
        }
      }

      // Publish event
      await this.publishProfilePictureUpdatedEvent(
        updatedProfile,
        mediaAsset,
        previousMediaId,
        userId,
      );

      const profileData = { ...updatedProfile };
      (profileData as any).profilePicture = {
        id: mediaAsset.id,
        url: mediaAsset.url,
        secureUrl: mediaAsset.secureUrl,
        publicId: mediaAsset.publicId,
      };

      return this.profileToDto(profileData as UserProfile, profileData as any);
    } catch (error) {
      this.logger.error('Failed to upload profile picture', error);
      throw error;
    }
  }

  /**
   * Upload cover image
   */
  async uploadCoverImage(userId: string, file: Express.Multer.File): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile not found for user ${userId}`);
    }

    try {
      // Upload to Cloudinary
      const mediaAsset = await this.cloudinaryService.uploadFile(
        file,
        MediaType.IMAGE,
        userId,
      );

      const previousMediaId = profile.coverImageId;

      // Update profile with new cover
      profile.coverImageId = mediaAsset.id;
      const updatedProfile = await this.profileRepository.save(profile);

      // Delete old cover if it exists
      if (previousMediaId) {
        const oldMedia = await this.mediaAssetRepository.findOne({
          where: { id: previousMediaId },
        });
        if (oldMedia) {
          await this.cloudinaryService.deleteFile(oldMedia.publicId, userId);
        }
      }

      const profileData = { ...updatedProfile };
      (profileData as any).coverImage = {
        id: mediaAsset.id,
        url: mediaAsset.url,
        secureUrl: mediaAsset.secureUrl,
        publicId: mediaAsset.publicId,
      };

      return this.profileToDto(profileData as UserProfile, profileData as any);
    } catch (error) {
      this.logger.error('Failed to upload cover image', error);
      throw error;
    }
  }

  /**
   * Delete profile picture
   */
  async deleteProfilePicture(userId: string): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile not found for user ${userId}`);
    }

    if (!profile.profilePictureId) {
      throw new BadRequestException('No profile picture to delete');
    }

    try {
      const media = await this.mediaAssetRepository.findOne({
        where: { id: profile.profilePictureId },
      });

      if (media) {
        await this.cloudinaryService.deleteFile(media.publicId, userId);
      }

      profile.profilePictureId = undefined;
      return this.profileToDto(await this.profileRepository.save(profile));
    } catch (error) {
      this.logger.error('Failed to delete profile picture', error);
      throw error;
    }
  }

  /**
   * Publish profile updated event
   */
  private async publishProfileUpdatedEvent(
    profile: UserProfile,
    userId: string,
  ): Promise<void> {
    this.kafkaProducer
      .produce(KAFKA_TOPICS.PROFILE_UPDATED, {
        eventType: 'profile.updated',
        data: {
          profileId: profile.id,
          userId: profile.userId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          bio: profile.bio,
          phoneNumber: profile.phoneNumber,
          location: profile.location,
          website: profile.website,
          updatedAt: profile.updatedAt,
        },
      })
      .catch((error) => {
        this.logger.error('Failed to publish profile updated event', error);
      });
  }

  /**
   * Publish profile picture updated event
   */
  private async publishProfilePictureUpdatedEvent(
    profile: UserProfile,
    mediaAsset: MediaAsset,
    previousMediaId: string | undefined,
    userId: string,
  ): Promise<void> {
    this.kafkaProducer
      .produce(KAFKA_TOPICS.PROFILE_PICTURE_UPDATED, {
        eventType: 'profile.picture.updated',
        data: {
          profileId: profile.id,
          userId: profile.userId,
          mediaAssetId: mediaAsset.id,
          publicId: mediaAsset.publicId,
          url: mediaAsset.url,
          secureUrl: mediaAsset.secureUrl,
          previousMediaAssetId: previousMediaId,
          updatedAt: profile.updatedAt,
        },
      })
      .catch((error) => {
        this.logger.error('Failed to publish profile picture updated event', error);
      });
  }

  /**
   * Convert profile entity to DTO
   */
  private profileToDto(profile: UserProfile, enrichedData?: any): ProfileResponseDto {
    return {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio,
      profilePicture: enrichedData?.profilePicture,
      coverImage: enrichedData?.coverImage,
      phoneNumber: profile.phoneNumber,
      location: profile.location,
      website: profile.website,
      birthDate: profile.birthDate,
      isPublic: profile.isPublic,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
