
const mongoose= require('mongoose')
const bcrypt = require('bcrypt')
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
     
      },
    phoneNumber: {
      type: String,
      required: true,
      unique:true
   
    },
    password: {
      type: String,
      required: true,
      minlength: 8 
    },
    balance: {
        type: Number,
        default: 0,
      },
      recipient_code:{
        type:String
      },
      roleId: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
      },
  });
  
  userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
      return next(); // Skip hashing if password hasn't changed
    }
  
    try {
      // Generate a salt (random bytes for added security)
      const salt = await bcrypt.genSalt(10); // Adjust rounds as needed (higher = slower, more secure)
  
      // Hash the password using the generated salt
      const hashedPassword = await bcrypt.hash(this.password, salt);
  
      // Update the password field with the hashed value
      this.password = hashedPassword;
      next();
    } catch (error) {
      next(error); // Pass error to error handling middleware
    }
  });
  
  module.exports = mongoose.model('User', userSchema);