import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class CreateMessageInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  content: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  conversationId?: string;
}
