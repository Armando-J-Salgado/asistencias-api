import {
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class PatchMeDto {


  @IsOptional()


  @IsString()


  @Length(1, 120)


  name?: string;





  @IsOptional()


  @IsString()


  @Length(1, 120)


  lastname?: string;





  @IsOptional()


  @IsString()


  @Length(1, 64)


  idCard?: string;





  @IsOptional()


  @IsString()


  @Length(0, 2048)


  imageUrl?: string;





}



