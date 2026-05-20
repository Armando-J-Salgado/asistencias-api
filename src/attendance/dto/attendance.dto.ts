import { IsBoolean, IsString } from 'class-validator';

export class ResolveScanDto {
  @IsString()


  token!: string;


}




export class DecideAttendanceDto {


  @IsBoolean()



  approve!: boolean;



}
