const express=require('express');
const authController=require('../controllers/authController');
const router=express.Router();
const auth=require('../middlewares/auth');
const blogController=require('../controllers/blogController');
const commentController=require('../controllers/commentController');

router.get('/test',(req,res)=>{res.json("Welcome Home Page")});

router.post('/register',authController.register);
router.post('/login',authController.login);
router.post('/logout',auth, authController.logout);
router.get('/refresh', authController.refresh);

// blogs controller

// create
router.post('/blog', auth, blogController.create);

// get all
router.get('/blog/all', auth, blogController.getAll);

// get blog by id
router.get('/blog/:id', auth, blogController.blogById);

// update
router.put('/blog', auth, blogController.update);

// delete
router.delete('/blog/:id', auth, blogController.delete);


// comment
// create 
router.post('/comment', auth, commentController.create);

// get 
router.get('/comment/:id', auth, commentController.getById);

module.exports = router;



 