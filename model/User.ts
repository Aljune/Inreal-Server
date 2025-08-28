// models/User.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    created_at: Date;
    deleted_at?: any;
    email: string;
    first_name: string;
    image?: string;
    last_name: string;
    password: string;
    place: string;
    preferences: any;
    qr_code: string;
    updated_at?: any;
    user_type: string;
    verification_token?: any;
    verified_at: Date;
    verify: boolean;
}

const UserSchema: Schema<IUser> = new Schema(
    {
        created_at: { type: Date, default: Date.now },
        deleted_at: { type: Schema.Types.Mixed, default: null },
        email: { type: String, unique: true, required: true },
        first_name: { type: String, required: true },
        image: { type: String },
        last_name: { type: String, required: true },
        password: { type: String, required: true },
        place: { type: String, required: true },
        preferences: { type: Schema.Types.Mixed, default: {} },
        qr_code: { type: String, required: true },
        updated_at: { type: Schema.Types.Mixed, default: null },
        user_type: { type: String, required: true },
        verification_token: { type: Schema.Types.Mixed, default: null },
        verified_at: { type: Date, default: null },
        verify: { type: Boolean, default: false },
    },
    { collection: "users" }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
