const jwt = require('jsonwebtoken')
const userModel = require('../models/usermodel')
const usermodel = require('../models/usermodel')
const { checkUser } = require('../middlewares/jwt')
const axios = require('axios')
const { response, text } = require('express')
// const { response, response } = require('express')

const getregisterpage = async(req,res)=>{
    res.render('register')
}
const postregisterroute=async(req,res)=>{
    try {
        const {email,phonenumber,password,confirmpassword}=req.body
        
        const checkField = ["email", "phonenumber", "password", "confirmpassword"];
        const emptyField = [];
        for (const field of checkField) {
          if (!req.body[field] || req.body[field] === ""|| req.body[field]===null) {
            emptyField.push(field);
          }
        }
      
        if (emptyField.length > 0) {
          return res.render("register", {
            error: `This field(s) ${emptyField.join(", ")} cannot be empty`,
          });
        }
        if(phonenumber.length<11){
            return res.render('register',{error:'phonenumber can not be less than 11 numbers'})
           
        }
        const checkIfPhonenumberExist = await userModel.findOne({phoneNumber:phonenumber})
        if(checkIfPhonenumberExist){
            return res.render('register',{error:'phone number already been used '})
        }
        if(password !==confirmpassword){
            console.log('password not equal to confirm password ');
            return res.render('register',{error:'password and confirmpassword cannot be different'})
           
            
        }
        if(password.length<8){
            return res.render('register',{error:'password cannot be lower than eight characters'})
        }
        if(phonenumber.length>13){
            return res.render('register',{error:'invalid phonenumber'})
        }
        const checkifUserExist = await userModel.findOne({email:email})
        if(checkifUserExist){
            return res.render('register', {error:'user email already been used '})
        }
      
        console.log(email);
     await userModel.create({
            email:email,
            phoneNumber:phonenumber,
            password:password,
            recipient_code:''
            
        })
        
        res.redirect('/login')
        
    } catch (error) {
        console.log(error.message);
        
    }
}
const getloginpage =async(req,res)=>{
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message);
        
    }
    
}
const postlogin =async(req,res)=>{
    try {
        const {email,password}=req.body
        if(!email ||email ===''||email===null){
            return res.render('login', {error:'email cannot be empty'})
        }
        if(!password ||password ===''||password===null){
            return res.render('login', {error:'password cannot be empty'})
        }
        const checkUser = await userModel.findOne({email:email})
        if(!checkUser){
            return res.render('login', {error:'user does not exists'})
        }
        const bcrypt=require('bcrypt')
        const comparePassword = await bcrypt.compare(password, checkUser.password);
        if(comparePassword){
            const token = await jwt.sign(
                { id: checkUser._id },
                process.env.JWT_SECRET_KEY,
                { expiresIn: "1h" }
              );
              res.cookie('paymentsystem', token);
              res.redirect('/dashboard')
        }else{
            return res.render('login',{error:'email or password mismatch'})
        }

        
    } catch (error) {
        console.log(error.message);
        
    }
}
const getdashboard =async(req,res)=>{
    try {
        if(req.user){
            const {email}=req.body
            const userId= req.user.id
            const checkUser = await userModel.findOne({_id:userId})
            // console.log(checkUser);
            
           
            res.render('dashboard',{checkUser})
        }
        else {
            res.redirect('/login')
        }
      
    } catch (error) {
        console.log(error.message);
        
    }
}
const deposit =async(req,res)=>{
    try {
        const {deposit,email}=req.body
        const userId= req.user.id
       
   
   
    if(deposit==='' || !deposit || deposit===null){
        return res.render('dashboard',{error:'deposit must be inputed'})

    }
    let bankCharges = deposit *0.02
    console.log(deposit+bankCharges/100);
    
   
    const currentUser = await userModel.findOne({_id:userId})
   
   
    if(deposit<parseInt(100)){
        
        return res.render('dashboard', {error:'deposit cannot be less than 100 naira'})
        
    }
    const headers = {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      };
      const transactionData = {
        email: currentUser.email,
      
        currency: "NGN",
       
       
       
        amount:deposit * 100 + bankCharges,
        metadata: {
            custom_fields: [
              {
                display_name: deposit,
                
              }
            ]
          },
        callback_url: `https://walletsystem.onrender.com/callback`,
      };
    console.log(checkUser);
    const createTransaction = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        transactionData,
        { headers }
      );

    //   const { reference, trxref } = req.query;
    //   const userId = req.user.id
      
    //   const currentUser=await usermodel.findOne({_id:userId})
    //  // sending token to the frontend
   
    
//   const status = await verifyPayment(trxref);
//   if(status){
//       const checkUser =await userModel.findOneAndUpdate({_id:userId},{ $inc: { balance: deposit }})
//       res.redirect('/dashboard')
//   }
  
     
      // console.log(getbalace);
    
    
      const { data: { authorization_url },} = createTransaction.data;
      

      res.redirect(authorization_url);
   res.redirect('/dashboard')
    } catch (error) {
        console.log(error.message);
        
        
    }
    
}
const callback = async(req,res)=>{
   try {
    if(req.user){
        const { reference, trxref } = req.query;
        const userId = req.user.id
        
        const currentUser=await usermodel.findOne({_id:userId})
       // sending token to the frontend
     
      
    const status = await verifyPayment(trxref);
    const value0fx = status.amount /100 -status.metadata.custom_fields[0].display_name
    const deposit = status.amount / 100 -value0fx
    console.log(status.metadata.custom_fields[0].display_name);
    const checkUser =await userModel.findOneAndUpdate({_id:userId},{ $inc: { balance: deposit }})
    
    
    res.redirect('/dashboard')
   
    }
   } catch (error) {
    console.log(error.message);
    
   }
}
async function verifyPayment(trxref) {
    try {
      const verifyUrl = `https://api.paystack.co/transaction/verify/${trxref}`;
      
      const response = await axios.get(verifyUrl, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
 
        
      });
   console.log(response.data.data.amount);
   
     
  
      if (
        
        response.data &&
        response.data.status &&
        response.data.data.status === "success" 
        
      ) {
        return response.data.data;
       
            // const checkUser =await userModel.findOneAndUpdate({email:response.data.customer.email},{ $inc: { balance: response.data.data.amount }})
            // res.redirect('/dashboard')
       
        
      } else {
        return false;
      }
    } catch (err) {
      console.log(err);
      return false;
    }
  }
const logout =async(req,res)=>{
    try {
        if (req.user) {
            res.clearCookie("paymentsystem");
            res.redirect("/login");
          } else{
            res.redirect('/login')
          }
        
    } catch (error) {
        
    }
}
const gettransferpage = async(req,res)=>{
    try {
        if(req.user){
            res.render('transfer')
        }else{
            res.redirect('/login')
        }
            
       
    } catch (error) {
        console.log(error.message);
        
    }
}

const posttransferpage =async(req,res)=>{
    try {
    const userId =req.user.id
    const checkUser = await userModel.findOne({_id:userId})
    const {amount ,phonenumber,password}=req.body
    const bcrypt = require('bcrypt')
    const comparePassword = bcrypt.compare(password,checkUser.password)
   
   
    if(!phonenumber){
        return res.render('transfer',{error:'no user found'})
    }
    if(!amount){
        return res.render('transfer',{error:'transfers cannot be a text has to be a number'})
    }
    if(checkUser.balance<amount){
      return  res.render('transfer',{error:'Insufficient funds. You do not have enough money in your wallet to make this transfer. Try funding your wallet to continue'})
    }
    if(comparePassword){
        await userModel.findOneAndUpdate({phoneNumber:phonenumber},{ $inc: { balance: amount }})
        let sender_current_balance = await userModel.findById(userId);
    
        // Update the Sender's balance
        await userModel.updateOne(
          { _id: userId },
          { $set: { balance: sender_current_balance.balance - parseInt(amount) } },
        );
      return  res.render('transfer',{success:`Transfer Of ${amount}naira to ${phonenumber} was successful`})
    }
   else {

    return res.render('transfer', {error :'password incorrect'})
    
    
   }
    
        
    } catch (error) {
        console.log(error.message);
        
    }
}

const getwithdraw = async(req,res)=>{
    try {
        if(req.user){
           res.render('withdraw')
        }else{
            res.redirect('/login')
        }
        
    } catch (error) {
        console.log(error.message);
        
    }
}

const postwithdraw = async(req,res)=>{
    try {
        if(req.user){
            const {reason,amount}=req.body
        //   console.log(reason,amount);
        const userId = req.user.id
          
        const currentUser = await userModel.findOne({_id:userId})
            const headers = {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
              };
              const shortuuid =require('short-uuid')
              const https = require('https')
             

const paramss = JSON.stringify({
  "type":"nuban",
  "name" : "Matuluko Olwanifemi John",
  "account_number": "0702133630",
  "bank_code": "058",
  "currency": "NGN"
})

const optionss = {
  hostname: 'api.paystack.co',
  port: 443,
  path: '/transferrecipient',
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
}

const reque = https.request(optionss, res => {
  let data = ''

  res.on('data', (chunk) => {
    data += chunk
  });

  res.on('end', async() => {
   
    console.log(JSON.parse(data))
    const parsedData = JSON.parse(data);
    const recipientCode = parsedData.data.recipient_code;
    const updateRecipientCode = await userModel.findOne( { _id: userId } );
    updateRecipientCode.recipient_code=recipientCode
    await updateRecipientCode.save();
    
console.log(updateRecipientCode);

console.log(recipientCode); // Output: "RCP_3z2e2b1qn3oswih" 
    // currentUser.recipient_code=data.reference
    // console.log(data.recipient_code);
    // console.log(recipient_code);
    
    
    
  })
  
}).on('error', error => {
  console.error(error)
})

reque.write(paramss)
reque.end()

const params = JSON.stringify({
    "source": "balance",
    "amount": 37800,
    "reference": `${shortuuid.generate()}`,
    "recipient": `${currentUser.recipient_code}`,
    "reason":  `${currentUser.id}`
  })
  
  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transfer',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    }
  }
  
  const request = https.request(options, res => {
    let data = ''
  
    res.on('data', (chunk) => {
      data += chunk
    });
  
    res.on('end', () => {
      console.log(JSON.parse(data))
    })
  }).on('error', error => {
    console.error(error)
  })
  
  request.write(params)
  request.end()
// console.log(params);


  
              
              
            //   const transactionData = {
            //     amount:amount,
              
            //     source: "balance",
            //     reason:reason,
            //     recipient: shortuuid.generate(),
            //   };
            // // console.log(checkUser);
            // const createTransaction = await axios.post(
            //     "https://api.paystack.co/transfer",
            //     transactionData,
            //     { headers }
            //   );
            //   const { data: { authorization_url },} = createTransaction.data;
      

            //   res.redirect(authorization_url);
           res.render('withdraw')
        }else{
            res.redirect('/login')
        }
        
    } catch (error) {
    }
        
    }

const webhookurl = async(req,res)=>{
    const crypto = require('crypto');
const secret = process.env.PAYSTACK_SECRET_KEY;
const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
    if (hash == req.headers['x-paystack-signature']) {
    // Retrieve the request's body
    const event = req.body;
    // Do something with event
         const userId=req.user
       
    if (event && event.event === 'transfer.success') {
    console.log('transfer api is working');
         console.log(event)
      let sender_current_balance = await userModel.findById(event.reason);
    
        // Update the Sender's balance
        const amountsTobedeductedFrombalance = event.data.amount
        await userModel.updateOne(
          { _id:event.reason},
          { $set: { balance: sender_current_balance.balance - parseInt(amountsTobedeductedFrombalance) } },
        ); 

        
    // console.log(event.data.customer.email);

    require('dotenv').config();
    
        
        
       
       
        
      
        
     
    }    
    }
    res.sendStatus(200);

}
module.exports={getregisterpage,postregisterroute,getloginpage,postlogin,getdashboard,deposit,logout,gettransferpage,posttransferpage,callback,getwithdraw,postwithdraw,webhookurl}
