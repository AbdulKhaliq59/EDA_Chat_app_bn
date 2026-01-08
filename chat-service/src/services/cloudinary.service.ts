import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { AttachmentType } from '../entities/message-attachment.entity';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload a file to Cloudinary for message attachments
   */
  async uploadAttachment(
    file: Express.Multer.File,
    attachmentType: AttachmentType,
    userId: string,
  ): Promise<any> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      // Validate file size (max 100MB for messages)
      const maxFileSize = 100 * 1024 * 1024;
      if (file.size > maxFileSize) {
        throw new BadRequestException('File size exceeds 100MB limit');
      }

      const resourceType = this.getResourceType(attachmentType, file.mimetype);
      const folder = `eda-chat/messages/${userId}/${attachmentType.toLowerCase()}`;

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

      this.logger.log(`✅ Attachment uploaded successfully: ${uploadResult.public_id}`);

      return {
        publicId: uploadResult.public_id,
        url: uploadResult.url,
        secureUrl: uploadResult.secure_url,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
        fileSize: uploadResult.bytes,
        mimeType: file.mimetype,
        originalName: file.originalname,
        metadata: {
          publicId: uploadResult.public_id,
          version: uploadResult.version,
          signature: uploadResult.signature,
        },
      };
    } catch (error) {
      this.logger.error('❌ Failed to upload attachment to Cloudinary', error);
      throw error;
    }
  }

  /**
   * Delete an attachment from Cloudinary
   */
  async deleteAttachment(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`✅ Attachment deleted from Cloudinary: ${publicId}`);
    } catch (error) {
      this.logger.error('❌ Failed to delete attachment from Cloudinary', error);
      throw error;
    }
  }

  /**
   * Determine resource type based on attachment type and MIME type
   */
  private getResourceType(attachmentType: AttachmentType, mimeType: string): 'image' | 'video' | 'raw' | 'auto' {
    switch (attachmentType) {
      case AttachmentType.IMAGE:
        return 'image';
      case AttachmentType.VIDEO:
        return 'video';
      case AttachmentType.AUDIO:
      case AttachmentType.VOICE_MESSAGE:
        return 'auto';
      case AttachmentType.DOCUMENT:
      case AttachmentType.ATTACHMENT:
        return 'raw';
      default:
        if (mimeType.startsWith('video/')) {
          return 'video';
        } else if (mimeType.startsWith('audio/')) {
          return 'auto';
        } else if (mimeType.startsWith('image/')) {
          return 'image';
        }
        return 'raw';
    }
  }
}
