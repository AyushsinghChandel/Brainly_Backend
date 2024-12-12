import express from "express";
import jwt from "jsonwebtoken";
import { z } from "zod"
import bcrypt from "bcrypt"
import { ContentModel, LinkModel, UserModel } from "./db";
import cors from "cors";


const app = express();
app.use(express.json());
app.use(cors());
import { JWT_SECRET } from "./config";
import { userMiddleware } from "./middleware";
import { random } from "./utils";

app.post("/api/v1/signup", async (req,res) => {
    const requireBody = z.object({
        username: z.string().min(3).max(50),
        password : z.string().min(7).max(100).refine(
            password => /[A-Z]/.test(password),{
                message: "Password must contain an"
            }
        ).refine(
            password => /[!@#$%^&*(),.?":{}|<>]/.test(password),{
                message: "Password must cotain a special charachter"
            }
        )
    })
    const parsedData = requireBody.safeParse(req.body);
    if(!parsedData.success){
        res.status(411).json({
            message: "Incorrect Formate",
            error : parsedData.error
        })
        return;
    }
    const username = req.body.username;
    const password = req.body.password;
    const hasedPassword = await bcrypt.hash(password,5);
    try{
        await UserModel.create({
            username,
            password: hasedPassword
        })
        res.json({
            message : "User is signedUp"
        })   
    } catch(e){
        res.status(403).json({
            message : "User already exist with this username"
        })
    }
})

app.post("/api/v1/signin", async (req,res) => {
    const username = req.body.username;
    const password = req.body.password;
    const UserExist = await UserModel.findOne({
        username:username,
    })
    if(!UserExist){
        res.status(403).json({
            message: "Inccorect credentials"
        })
        return;
    }
    console.log(UserExist);
    //@ts-ignore
    const passwordMatch = await bcrypt.compare(password, UserExist.password);
    if(passwordMatch){
        const token = jwt.sign({
            id:UserExist._id
        },JWT_SECRET)
        res.json({
            token
        })
    }else{
        res.status(403).json({
            message:"Inccorect Credentials here"
        })
    }
})

app.post("/api/v1/content", userMiddleware , async (req,res) => {
    const link = req.body.link;
    const type = req.body.type;
    await ContentModel.create({
        link,
        type,
        tittle : req.body.tittle;
        //@ts-ignore
        userId: req.userId,
        tags:[]
    })
    res.json({
        message: "content added"
    })
})

app.get("/api/v1/content", userMiddleware,async (req,res) => {
    try{
        //@ts-ignore
    const userId = req.userId;
    const content = await ContentModel.find({
        userId
    });
    res.json({
        content
    })
    }catch(e){
        res.json({
            message: "Something unexpected happened"
        })
    } 
})


app.delete("/api/v1/content",userMiddleware,async (req,res) => {
    const contentId = req.body.contentId;
    await ContentModel.deleteMany({
        contentId,
        //@ts-ignore
        userId: req.userId
    })
    res.json({
        message : "Successfully deleted"
    })
})

app.post("/api/v1/brain/share", userMiddleware, async (req,res) => {
    const share = req.body.share;
    if(share){
        const existingLink = await LinkModel.findOne({
            //@ts-ignore
            userId: req.userId
        })
        if(existingLink){
            res.json({
                hash: existingLink.hash
            })
            return;
        }
        const hash = random(10);
        await LinkModel.create({
            //@ts-ignore
            userId: req.userId,
            hash: hash
        })
        res.json({
            message: hash 
        })
    }else{
        await LinkModel.deleteOne({
            //@ts-ignore
            userId: req.userId
        });
    }
    res.json({
        message: "Removed the link"
    })
})

app.get("/api/v1/brain/:shareLink", async (req,res) => {
    const hash = req.params.shareLink;
    const link = await LinkModel.findOne({
        hash
    });
    if(!link){
        res.status(411).json({
            message : "Sorry incorrect input"
        })
        return;
    }
    //userId
    const content = await ContentModel.find({
        userId : link.userId
    })

    const user = await UserModel.findOne({
        _id : link.userId
    })

    res.json({
        username: user?.username,
        content: content
    })
})


app.listen(3000);