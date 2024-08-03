const jwt = require('jsonwebtoken');
const RefreshToken=require('../models/token');

const ACCESS_TOKEN_SECRET = 'f50dfe011a50466dbcc7d757d97b66e69553927a812e087082ec0b071b188941f6ee3fd5fc9d8735f9bd26fcff93d3292cbe6ca8ca133ac75671f99b05a231a4';
const REFRESH_TOKEN_SECRET = '3a683874c79ae097a32efcbbc4e7e427cb73bf784da3907ace17767a5e254677db79b6bc72cc058eb355f702a22be9d00945d5ae132fb7fe896d9a53ddc995b6';


class JWTService {
    // sign access token
    static signAccessToken(payload, expiryTime) {
        return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: expiryTime });
    }

    // sign refresh token 
    static signRefreshToken(payload, expiryTime) {
        return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: expiryTime });
    }
    //verify access token
    static verifyAccessToken(token){
        return jwt.verify(token, ACCESS_TOKEN_SECRET);
    }
    //verify refresh token
    static verifyRefreshToken(token){
        return jwt.verify(token, REFRESH_TOKEN_SECRET);
    }
    // store refresh token
    static async storeRefreshToken(token, userId){
        try {
            const newToken=new RefreshToken({
                token: token,
                userId: userId
            })
            await newToken.save();
        } catch (error) {
            console.log(error);
        }
    }

}
module.exports = JWTService;