import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException({
        message: 'Path parameter id must be a positive integer',
        details: { parameter: 'id', value },
      });
    }

    const parsed = Number(value);

    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      throw new BadRequestException({
        message: 'Path parameter id must be a positive integer',
        details: { parameter: 'id', value },
      });
    }

    return parsed;
  }
}
