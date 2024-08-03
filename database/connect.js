const mongoose=require('mongoose');

const connectionString="mongodb://127.0.0.1:27017/techronaut";

const dbConnect=async()=>{
    try {
        const conn=await mongoose.connect(connectionString);
        console.log(`Database connected Successfully, ${conn.connection.host}`);
        
    } catch (error) {
        console.log(`Error: ${error}`);
        
    }
}
module.exports=dbConnect;