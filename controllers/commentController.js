const Joi = require('joi');
const Comment = require('../models/comments');
const CommentDTO = require('../dto/Comment');

const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;

const commentController = {
    async create(req, res, next){
        const createCommentSchema = Joi.object({
            content: Joi.string().required(),
            author: Joi.string().regex(mongodbIdPattern).required(),
            blog: Joi.string().regex(mongodbIdPattern).required()
        });

        const {value, error} = createCommentSchema.validate(req.body);

        if (error){
            return next(error);
        }

        const {content, author, blog} = value;

        try{
            const newComment = new Comment({
                content, author, blog
            });

            await newComment.save();
            return res.status(200).json({newComment});
            
        }
        catch(error){
            return next(error);
        }
         
        // return res.status(201).json({message: 'comment created'});
    },
    async getById(req, res, next){
        const getByIdSchema = Joi.object({
            id: Joi.string().regex(mongodbIdPattern).required()
        });

        const {value , error} = getByIdSchema.validate(req.params);

        if (error){
            return next(error);
        }

        const {id} = value;

        let comments;

        try{
            comments = await Comment.find({blog: id}).populate('author');
        }
        catch(error){
            return next(error);
        }

        let commentsDto = [];

        for(let i = 0; i < comments.length; i++){
            const obj = new CommentDTO(comments[i]);
            commentsDto.push(obj);
        }

        return res.status(200).json({data: commentsDto});
    }
}

module.exports = commentController;
