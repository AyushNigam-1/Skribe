import mongoose, { Document, Model, Schema, Types } from "mongoose";
import mongooseFieldEncryption from "mongoose-field-encryption";
const RoleEnum = ["OWNER", "EDITOR", "CONTRIBUTOR", "VIEWER"];
import dotenv from "dotenv";

dotenv.config();

export interface ICollaborator {
  user: Types.ObjectId;
  role: string;
  addedAt: Date;
}

export interface IScript extends Document {
  author: Types.ObjectId;
  title: string;
  visibility: string;
  languages: string[];
  description: string;
  genres: string[];
  paragraphs: Types.ObjectId[];
  likes: Types.ObjectId[];
  dislikes: Types.ObjectId[];
  collaborators: ICollaborator[];
  combinedText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const scriptSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    visibility: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    languages: {
      type: [String],
      required: true,
    },
    genres: {
      type: [String],
      required: true,
    },
    paragraphs: [
      {
        type: Schema.Types.ObjectId,
        ref: "Paragraph",
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dislikes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    collaborators: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: RoleEnum,
          required: true,
        },
        status: { type: String, enum: ["PENDING", "ACCEPTED"], default: "PENDING" }
      },
    ],

    combinedText: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

scriptSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

/* ✅ Make virtuals appear in JSON */
scriptSchema.set("toJSON", {
  virtuals: true,
});

scriptSchema.set("toObject", {
  virtuals: true,
});

scriptSchema.plugin(mongooseFieldEncryption.fieldEncryption, {
  fields: ["title", "description", "combinedText"],
  secret: process.env.FIELD_ENCRYPTION_KEY,
});

const Script: Model<IScript> = mongoose.model<IScript>("Script", scriptSchema);

export default Script;
