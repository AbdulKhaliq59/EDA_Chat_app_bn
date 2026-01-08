import { IsUUID, IsArray, ArrayMinSize } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('4', { each: true })
  participants: string[];
}

export class GetConversationsDto {
  @IsUUID()
  userId: string;
}
