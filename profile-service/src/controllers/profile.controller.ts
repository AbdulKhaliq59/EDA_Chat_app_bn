import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from '../services/profile.service';
import { CreateProfileDto, UpdateProfileDto, ProfileResponseDto } from '../dto/profile.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { memoryStorage } from 'multer';

@Controller('profiles')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  /**
   * Create a new profile
   * POST /profiles
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createProfile(
    @Body() createProfileDto: CreateProfileDto,
    @Request() req: any,
  ): Promise<ProfileResponseDto> {
    return this.profileService.createProfile(req.user.sub, createProfileDto);
  }

  /**
   * Get current user's profile
   * GET /profiles/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Request() req: any): Promise<ProfileResponseDto> {
    return this.profileService.getProfileByUserId(req.user.sub);
  }

  /**
   * Get profile by userId
   * GET /profiles/:userId
   */
  @Get(':userId')
  async getProfileByUserId(@Param('userId') userId: string): Promise<ProfileResponseDto> {
    return this.profileService.getProfileByUserId(userId);
  }

  /**
   * Update profile
   * PATCH /profiles/me
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @Request() req: any,
  ): Promise<ProfileResponseDto> {
    return this.profileService.updateProfile(req.user.sub, updateProfileDto);
  }

  /**
   * Upload profile picture
   * POST /profiles/me/picture
   */
  @Post('me/picture')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Only image files are allowed (jpg, png, gif, webp)'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<ProfileResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.profileService.uploadProfilePicture(req.user.sub, file);
  }

  /**
   * Upload cover image
   * POST /profiles/me/cover
   */
  @Post('me/cover')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Only image files are allowed (jpg, png, gif, webp)'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadCoverImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<ProfileResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.profileService.uploadCoverImage(req.user.sub, file);
  }

  /**
   * Delete profile picture
   * DELETE /profiles/me/picture
   */
  @Delete('me/picture')
  @UseGuards(JwtAuthGuard)
  async deleteProfilePicture(@Request() req: any): Promise<ProfileResponseDto> {
    return this.profileService.deleteProfilePicture(req.user.sub);
  }
}
