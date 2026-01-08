import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class MediaAssetType {
  @Field(() => ID)
  id: string;

  @Field()
  publicId: string;

  @Field()
  url: string;

  @Field()
  type: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class ProfileType {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  website?: string;

  @Field(() => MediaAssetType, { nullable: true })
  profilePicture?: MediaAssetType;

  @Field(() => MediaAssetType, { nullable: true })
  coverImage?: MediaAssetType;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
