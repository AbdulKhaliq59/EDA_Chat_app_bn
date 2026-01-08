import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { MediaAsset, MediaType, MediaStatus } from '../entities/media-asset.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(MediaAsset)
    private mediaAssetRepository: Repository<MediaAsset>,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload a file to Cloudinary
   */
  async uploadFile(
    file: Express.Multer.File,
    mediaType: MediaType,
    userId: string,
  ): Promise<MediaAsset> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      // Validate file size (max 50MB)
      const maxFileSize = 50 * 1024 * 1024;
      if (file.size > maxFileSize) {
        throw new BadRequestException('File size exceeds 50MB limit');
      }

      const resourceType = this.getResourceType(mediaType, file.mimetype);
      const folder = `eda-chat/${userId}/${mediaType.toLowerCase()}`;

      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: resourceType,
            folder,
            access_mode: 'token',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        uploadStream.end(file.buffer);
      });

      const uploadResult: any = await uploadPromise;

      // Save media asset to database
      const mediaAsset = this.mediaAssetRepository.create({
        publicId: uploadResult.public_id,
        type: mediaType,
        status: MediaStatus.READY,
        url: uploadResult.url,
        secureUrl: uploadResult.secure_url,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
        fileSize: uploadResult.bytes,
        mimeType: file.mimetype,
        originalName: file.originalname,
        uploadedBy: userId,
        metadata: {
          publicId: uploadResult.public_id,
          version: uploadResult.version,
          signature: uploadResult.signature,
          etag: uploadResult.etag,
        },
      });

      const savedAsset = await this.mediaAssetRepository.save(mediaAsset);
      this.logger.log(`✅ File uploaded successfully: ${savedAsset.id}`);

      return savedAsset;
    } catch (error) {
      this.logger.error('❌ Failed to upload file to Cloudinary', error);
      throw error;
    }
  }

  /**
   * Delete a file from Cloudinary
   */
  async deleteFile(publicId: string, userId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`✅ File deleted from Cloudinary: ${publicId}`);

      // Update database
      await this.mediaAssetRepository.update(
        { publicId },
        {
          status: MediaStatus.DELETED,
          deletedAt: new Date(),
          deletedBy: userId,
        },
      );
    } catch (error) {
      this.logger.error('❌ Failed to delete file from Cloudinary', error);
      throw error;
    }
  }

  /**
   * Get file information from Cloudinary
   */
  async getFileInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      this.logger.error('❌ Failed to get file info from Cloudinary', error);
      throw error;
    }
  }

  /**
   * Determine resource type based on media type and MIME type
   */
  private getResourceType(mediaType: MediaType, mimeType: string): 'image' | 'video' | 'raw' | 'auto' {
    switch (mediaType) {
      case MediaType.IMAGE:
      case MediaType.VOICE_MESSAGE:
        return 'image';
      case MediaType.VIDEO:
        return 'video';
      case MediaType.AUDIO:
      case MediaType.DOCUMENT:
        return 'raw';
      case MediaType.ATTACHMENT:
        if (mimeType.startsWith('video/')) {
          return 'video';
        } else if (mimeType.startsWith('audio/')) {
          return 'auto';
        } else if (mimeType.startsWith('image/')) {
          return 'image';
        }
        return 'raw';
      default:
        return 'auto';
    }
  }

  /**
   * Generate secure download URL with token
   */
  generateSecureUrl(publicId: string, expirationHours: number = 24): string {
    const expirationTime = Math.floor(Date.now() / 1000) + expirationHours * 3600;
    return cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
      type: 'token',
      expires_at: expirationTime,
    });
  }
}
