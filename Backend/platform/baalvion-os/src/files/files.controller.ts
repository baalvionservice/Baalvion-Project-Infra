import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/jwt.strategy';
import { FilesService } from './files.service';
import { PresignDto } from './files.dto';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('presign')
  presignUpload(@Body() dto: PresignDto, @CurrentUser() user: AuthUser) {
    return this.files.presignUpload(dto, user?.keycloakId);
  }

  // Object keys contain slashes, so pass via query param (Express-4 safe).
  @Get('signed')
  presignDownload(@Query('key') key: string) {
    return this.files.presignDownload(key);
  }

  @Delete()
  remove(@Query('key') key: string) {
    return this.files.remove(key);
  }
}
