import mongoose, { model, Schema } from "mongoose";
import { string } from "zod";
mongoose.connect("mongodb+srv://Admin:Ayush%40588@cluster0.t4fpj.mongodb.net/brainly")

const UserSchema = new Schema ({
    username:{type: String ,unique: true},
    password : String
})
const ContentSchema = new Schema({
    tittle : String,
    link : String,
    type: String,
    tags :[{type:mongoose.Types.ObjectId,ref:'Tag'}],
    userId: {type:mongoose.Types.ObjectId, ref:'User', required : true}
})

const LinkSchema = new Schema({
    hash : String,
    userId : {type:mongoose.Types.ObjectId, ref: "User", required : true, unique: true}
})

export const LinkModel = model("links",LinkSchema);
export const UserModel = model("user",UserSchema);
export const ContentModel = model("content",ContentSchema);