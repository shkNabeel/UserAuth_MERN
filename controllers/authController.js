const Joi = require('joi');
const User = require('../models/users');
const bcrypt = require('bcrypt');
const JWTService = require('../Services/JWTService');
const UserDto = require('../dto/user');
const RefreshToken = require('../models/token');
const passwordPattern = /^(?=.*[A-Z])(?=.*\d.*\d)(?=.*[!@#$%^&*()_+}{":;'?\/><.,])(?=.*[a-z]).{8,}$/;


const authController = {
    async register(req, res, next) {
        // 1. valiadte user input data
        const userRegisterSchema = Joi.object({
            name: Joi.string().min(5).max(20).required(),
            username: Joi.string().min(5).max(10).required(),
            email: Joi.string().email().required(),
            password: Joi.string().pattern(passwordPattern)
                .messages({
                    'string.pattern.base': 'Password must contain at least one uppercase letter, two digits, one special character, and be at least 8 characters long'
                })
                .required(),
            confirmPassword: Joi.ref('password'),

        });

        // valiadte user input data

        const { value, error } = userRegisterSchema.validate(req.body);

        // 2. error handling , if there is an error then handle it 

        if (error) {
            return next(error);
        }

        // 3. checking user exisiteing already or not
        const { name, username, email, password } = value;

        try {
            // Check if email already exists
            const emailExists = await User.exists({ email });
            const usernameExists = await User.exists({ username });
            if (emailExists) {
                const error = {
                    status: 409,
                    msg: "Email already in use, try with another email address",
                };
                return res.status(error.status).json(error);
            }
            if (usernameExists) {
                const error = {
                    status: 409,
                    msg: "Username already taken"
                };
                return res.status(error.status).json(error);
            }
        } catch (error) {
            return next(error);
        }

        // 4. hash the user password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5. store user in database
        let user;
        let accessToken;
        let refreshToken;
        try {
            const newUser = new User({
                name: name,
                username: username,
                email: email,
                password: hashedPassword,
            });
            user = await newUser.save();
            //generating token 
            accessToken = JWTService.signAccessToken({ _id: user._id, username: user.username }, '30m');
            refreshToken = JWTService.signRefreshToken({ _id: user._id }, '60m');


        } catch (error) {
            return next(error);
        }
        //store refresh token in db
        await JWTService.storeRefreshToken(refreshToken, user._id)
        //sending token in cookies
        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true
        });
        res.cookie('refreshToken', refreshToken, {
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true
        });

        // 6. send response
        // const userDto=new UserDto(user);
        return res.status(200).json({ user: user, auth: true });
    },
    async login(req, res, next) {
        // Validate user input
        const userLoginSchema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().pattern(passwordPattern).required(),
        });
        const { value, error } = userLoginSchema.validate(req.body);

        // If there's an error in validation, return error to the client
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Check credentials
        const { email, password } = value;
        let user;
        try {
            user = await User.findOne({ email: email });
            if (!user) {
                return res.status(401).json({ error: "Invalid Email or Password" });
            }
            const matchPwd = await bcrypt.compare(password, user.password);
            if (!matchPwd) {
                return res.status(401).json({ error: "Incorrect Password" });
            }
        } catch (error) {
            return res.status(500).json({ error: "Internal Server Error" });
        }

        // If user credentials are correct, send user data to the client
        //assigning token
        const accessToken = JWTService.signAccessToken({ _id: user._id, username: user.username }, '30m');
        const refreshToken = JWTService.signRefreshToken({ _id: user._id }, '60m');

        //updating refresh token in database
        try {
            RefreshToken.updateOne({
                _id: user._id
            },
                {
                    token: refreshToken

                },
                { upsert: true }
            )

        } catch (error) {
            return next(error);
        }

        //sending cookies 
        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true,
            secure: true
        });
        res.cookie('refreshToken', refreshToken, {
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true,
            secure: true
        });

        const userDto = new UserDto(user);
        return res.status(200).json({ user: userDto, auth: true });
    },
    async logout(req, res, next) {
        //delete refresh token from database
        // console.log(req.user);
        const { refreshToken } = req.cookies;
        try {
            await RefreshToken.deleteOne({ token: refreshToken });


        } catch (error) {
            return next(error);
        }
        //delete cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        // send rresponse
        res.status(200).json({ user: null, auth: false });

    },
    async refresh(req, res, next) {
        //1. get refresh token from cookies
        const originalRefreshToken = req.cookies.refreshToken;
        let id;
        try {
            id = JWTService.verifyRefreshToken(originalRefreshToken)._id;


        } catch (error) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        //2. verify refresh token 
        try {
            const match = RefreshToken.findOne({ _id: id, token: originalRefreshToken });
            if (!match) {
                const error={
                    status: 401,
                    message: 'Unauthorized'
                }
                return next(error)
            }
            
        } catch (e) {
            return next(e);
        }
    

        //3. generate new refresh tokens
        //4. update database
        try {
            const accessToken=JWTService.signAccessToken({_id: id}, '30m');
            const refreshToken=JWTService.signRefreshToken({_id: id}, '60m');
            await RefreshToken.updateOne({_id: id},{token: refreshToken});

            res.cookie('accessToken',accessToken,{
                maxAge: 1000*60*60*24,
                httpOnly:true
            });
            res.cookie('refreshToken',refreshToken,{
                maxAge: 1000*60*60*24,
                httpOnly:true
            })
            
        } catch (error) {
            return next(error);
            
        }
        //5. response return 
        const user=await User.findOne({_id: id});
        const userDto=new UserDto(user);
        return res.status(200).json({user: userDto, auth: true});



    }

}

module.exports = authController;