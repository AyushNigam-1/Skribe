import mongoose, { Schema, Document, Types } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

interface IUser extends Document {
  name: string;
  languages: string[];
  location: string;
  bio: string;
  email: string;
  username: string;
  scripts: Types.ObjectId[];
  likes: Types.ObjectId[];
  follows: number;
  views: Types.ObjectId[];
  followers: Types.ObjectId[];
  favourites: Types.ObjectId[];
  interested: Types.ObjectId[];
  notInterested: Types.ObjectId[];
  contributions: Types.ObjectId[];
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String },
    languages: { type: [String] },
    location: { type: String },
    bio: { type: String },
    email: { type: String, required: true, index: true },
    username: { type: String, unique: true },
    scripts: { type: [Schema.Types.ObjectId], ref: "Script", default: [] },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    views: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dislikes: { type: Number, default: 0 },
    follows: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    followers: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    favourites: { type: [Schema.Types.ObjectId], ref: "Script", default: [] },
    interested: { type: [Schema.Types.ObjectId], ref: "Script", default: [] },
    notInterested: { type: [Schema.Types.ObjectId], ref: "Script", default: [] },
    contributions: { type: [Schema.Types.ObjectId], ref: "Request", default: [] },
  },
  {
    timestamps: true,
    collection: "user",
  }
);

export default mongoose.model<IUser>("User", UserSchema);