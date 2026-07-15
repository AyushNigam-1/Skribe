import mongoose, { Schema, Types, Document, Model } from "mongoose";
import mongooseFieldEncryption from "mongoose-field-encryption";
import dotenv from "dotenv";

dotenv.config();

const commentSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export interface IParagraph extends Document {
  script:
    | Types.ObjectId
    | {
        _id: Types.ObjectId;
        title?: string;
      };
  author: Types.ObjectId;
  text: string;
  status: "pending" | "approved" | "rejected";
  // Changed from number to array of ObjectIds
  likes: Types.ObjectId[];
  dislikes: Types.ObjectId[];
  comments: {
    author: Types.ObjectId;
    text: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const paragraphSchema = new Schema(
  {
    script: {
      type: Schema.Types.ObjectId,
      ref: "Script",
      required: true,
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Updated to store an array of User references
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Updated to store an array of User references
    dislikes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: {
      type: [commentSchema],
      default: [],
    },
  },
  { timestamps: true },
);

const Paragraph: Model<IParagraph> = mongoose.model<IParagraph>(
  "Paragraph",
  paragraphSchema,
);

paragraphSchema.plugin(mongooseFieldEncryption.fieldEncryption, {
  fields: ["text"],
  secret: process.env.FIELD_ENCRYPTION_KEY,
});

export default Paragraph;
