const JWTService=require('../Services/JWTService');
const User=require('../models/users');
const UserDto=require('../dto/user');
const auth=async (req,res,next)=>{
     //refresh, access token validation
    try {
        const {refreshToken,accessToken}=req.cookies;
     if(!refreshToken || !accessToken){
        return res.status(401).json({ message: 'Unauthorized' });

     }
      let _id ;
     try {
         _id=JWTService.verifyAccessToken(accessToken)._id;

          
     } catch (error) {
        return next(error);
     }

     let user;
     try {
        user= await User.findOne({_id: _id})
        
     } catch (error) {
        return next(error);
     }
     const userDto=new UserDto(user);
     req.user=userDto;
     next();
     
        
    } catch (error) {
        return next(error);
    }
     
}
module.exports=auth;