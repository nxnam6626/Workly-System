import {
  Controller,
  Get,
  Param,
  Query,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { FilterCompanyDto } from './dto/filter-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('my-company')
  @UseGuards(JwtAuthGuard)
  getMyCompany(@CurrentUser('userId') userId: string) {
    return this.companiesService.getMyCompany(userId);
  }

  @Patch('my-company')
  @UseGuards(JwtAuthGuard)
  updateMyCompany(
    @CurrentUser('userId') userId: string,
    @Body() updateData: any,
  ) {
    return this.companiesService.updateMyCompany(userId, updateData);
  }

  @Get()
  findAll(@Query() query: FilterCompanyDto) {
    return this.companiesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }
}
