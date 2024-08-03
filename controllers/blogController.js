const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;
const Blog = require('../models/blogs');
const { BACKEND_SERVER_PATH } = require('../config/variables');
const BlogDTO = require('../dto/blog');
const BlogDetailsDTO=require('../dto/blogDetails');
// const Comment = require("../models/comments");

const blogController = {
    async create(req, res, next) {
        const createBlogSchema = Joi.object({
            title: Joi.string().required(),
            author: Joi.string().regex(mongodbIdPattern).required(),
            content: Joi.string().required(),
            photo: Joi.string().required(),
        });

        const { value, error } = createBlogSchema.validate(req.body);
        if (error) {
            return next(error);
        }

        const { title, author, content, photo } = value;
        const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/, ''), 'base64');
        const ImgPath = `${Date.now()}-${author}.png`;
        const storageDirectory = path.join(__dirname, '..', 'storage');

        if (!fs.existsSync(storageDirectory)) {
            fs.mkdirSync(storageDirectory);
        }

        try {
            const imagePath = path.join(storageDirectory, ImgPath);
            fs.writeFileSync(imagePath, buffer);
            console.log(`Photo saved to: ${imagePath}`);
        } catch (error) {
            console.error('Error saving photo:', error);
            return next(error);
        }

        let newBlog;
        try {
            newBlog = new Blog({
                title,
                author,
                content,
                photoPath: `${BACKEND_SERVER_PATH}/storage/${ImgPath}`
            });
            await newBlog.save();
        } catch (error) {
            console.error('Error saving blog:', error);
            return next(error);
        }

        const blogDto = new BlogDTO(newBlog);
        res.status(201).json({ blog: blogDto });
    },

    async getAll(req, res, next) {
        try {
            const blogs = await Blog.find({});

            const blogsDto = [];

            for (let i = 0; i < blogs.length; i++) {
                const dto = new BlogDTO(blogs[i]);
                blogsDto.push(dto);
            }
            return res.status(200).json({ blogs: blogsDto })
        } catch (error) {
            return next(error);
        }

    },
    
    async blogById(req, res, next) {
        try {
            // Validate id
            const blogIdSchema = Joi.object({
                id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(), // Assuming mongodbIdPattern is a regex pattern for MongoDB ObjectId
            });
            const { error } = blogIdSchema.validate(req.params);
            if (error) {
                return res.status(400).json({ error: error.message });
            }
    
            const { id } = req.params;
    
            // Find blog by id
            const blog = await Blog.findOne({ _id: id }).populate('author');
            if (!blog) {
                return res.status(404).json({ message: "Blog not found" });
            }
    
            // Return blog data
            const blogDto = new BlogDetailsDTO(blog);
    
            // Send JSON response
            return res.status(200).json({ blog: blogDto });  
        } catch (error) {
            // Handle other errors
            return next(error);
        }
    }
    ,
    async update(req, res, next) {
        const updateBlogSchema = Joi.object({
            title: Joi.string().required(),
            content: Joi.string().required(),
            author: Joi.string().regex(mongodbIdPattern).required(),
            blogId: Joi.string().regex(mongodbIdPattern).required(),
            photo: Joi.string().optional(),
        });

        const { value, error } = updateBlogSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.message });
        }

        const { title, content, author, blogId, photo } = value;

        let blog;
        try {
            blog = await Blog.findOne({ _id: blogId });
            if (!blog) {
                return res.status(404).json({ message: "Blog not found" });
            }
        } catch (error) {
            return next(error);
        }

        if (photo) {
            const previousPhoto = blog.photoPath.split('/').pop();
            const previousPhotoPath = path.join(__dirname, '..', 'storage', previousPhoto);

            // Check if the file exists before attempting to delete it
            if (fs.existsSync(previousPhotoPath)) {
                try {
                    fs.unlinkSync(previousPhotoPath);
                } catch (error) {
                    console.error('Error deleting previous photo:', error);
                    return next(error);
                }
            }

            const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/, ''), 'base64');
            const newImgPath = `${Date.now()}-${author}.png`;
            const storageDirectory = path.join(__dirname, '..', 'storage');
            const newImagePath = path.join(storageDirectory, newImgPath);

            if (!fs.existsSync(storageDirectory)) {
                fs.mkdirSync(storageDirectory);
            }

            try {
                fs.writeFileSync(newImagePath, buffer);
            } catch (error) {
                console.error('Error saving new photo:', error);
                return next(error);
            }

            blog.photoPath = `${BACKEND_SERVER_PATH}/storage/${newImgPath}`;
        }

        blog.title = title;
        blog.content = content;

        try {
            await blog.save();
            res.status(200).json({ message: "Blog updated!" });
        } catch (error) {
            next(error);
        }
    },
    async delete(req, res, next) {
        // validate id
        // delete blog
        // delete comments on this blog
    
        const deleteBlogSchema = Joi.object({
          id: Joi.string().regex(mongodbIdPattern).required(),
        });
    
        const { value, error } = deleteBlogSchema.validate(req.params);
    
        const { id } = value;
    
        // delete blog
        // delete comments
        try {
          await Blog.deleteOne({ _id: id });
    
        //   await Comment.deleteMany({ blog: id });
        } catch (error) {
          return next(error);
        }
    
        return res.status(200).json({ message: "blog deleted" });
      },
    
};

module.exports = blogController;