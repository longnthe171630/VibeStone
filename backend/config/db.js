import mongoose from "mongoose";

export const  connectDB = async () =>{

    await mongoose.connect('mongodb+srv://giangkh1908:19082003@chat.ddabkrc.mongodb.net/EXE201').then(()=>console.log("DB Connected"));
   
}

export function getDB() {
  if (!mongoose.connection) {
    throw new Error('Database not connected. Call connectDB first.');
  }
  return mongoose.connection;
}

// add your mongoDB connection string above.
// Do not use '@' symbol in your databse user's password else it will show an error.