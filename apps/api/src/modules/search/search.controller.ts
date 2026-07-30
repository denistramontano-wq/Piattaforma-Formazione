import { Controller, Get, Post, Query } from '@nestjs/common';
import { SearchService, SearchResultType } from './search.service';

@Controller()
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get('search')
  search(@Query('q') q: string = '', @Query('type') type?: SearchResultType) {
    return this.service.search(q, type);
  }

  @Get('search/suggest')
  suggest(@Query('q') q: string = '') {
    return this.service.suggest(q);
  }

  @Post('admin/search/reindex')
  reindex() {
    return this.service.reindexManuals();
  }
}
