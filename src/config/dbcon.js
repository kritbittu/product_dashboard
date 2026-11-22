

const mongoose=require('mongoose');

const dbcon= async()=>{

try{

await mongoose.connect(process.env.MONGODB_URL)

console.log('database connected')



}

catch(error){



}



}


module.exports=dbcon;