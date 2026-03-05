import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { BaseResponseDto } from "../../common/dto/BaseResponse.dto";

@Exclude()
export class AuthResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({
    example: "HEADER.PAYLOAD.SIGNATURE",
  })
  access_token: string;
}
