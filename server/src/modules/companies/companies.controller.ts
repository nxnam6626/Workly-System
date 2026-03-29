import { Controller, Get, Param, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { FilterCompanyDto } from './dto/filter-company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll(@Query() query: FilterCompanyDto) {
    return this.companiesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }
}
