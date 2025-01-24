const express= require('express')
const app = express();
const moongose =require('mongoose')
const expresshandlebars = require('express-handlebars')
const expressfileupload = require('express-fileupload')
const routes= require('./routes/route')
const cookieparser= require('cookie-parser')
require('dotenv').config()
moongose.connect('mongodb+srv://oluwanifemimatuluko:yorimisoke04@cluster0.e2as4y7.mongodb.net/paymentsystemsnew').then(()=>{
    console.log('database connected successfully');
    
}).catch((err)=>{
    console.log(err.message);
    
})
app.engine(
    "hbs",
    expresshandlebars.engine({
      extname: ".hbs",
      defaultLayouts: "main",
      runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
      },
    })
  );
  app.set("view engine", "hbs");

//middlewares
app.use(expressfileupload())
app.use(cookieparser())
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json())

app.get('/',(req,res)=>{
    res.render('home')
})
app.use('/',routes)
app.get('/*', (req,res)=>{
    res.send('<h1>Oops Page Not Found</h1>')
})
app.listen(3000, (req,res)=>{
   console.log('server is running on port 3000');
   
})
