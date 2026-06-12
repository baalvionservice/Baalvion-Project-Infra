import { Body, Controller, Param, Post } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';
import { EscrowService } from './escrow.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class FundDto {
  @Type(() => Number) @IsNumber() amount!: number;
}

@Controller('escrow')
export class PaymentsController {
  constructor(private readonly escrow: EscrowService) {}

  @Post(':id/fund')
  fund(
    @CurrentUser('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: FundDto,
  ) {
    return this.escrow.fund(orgId, id, dto.amount);
  }

  @Post(':id/release')
  release(@CurrentUser('orgId') orgId: string, @Param('id') id: string) {
    return this.escrow.release(orgId, id);
  }
}
