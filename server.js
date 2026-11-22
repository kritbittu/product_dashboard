require('dotenv').config();
//const dns = require("node:dns/promises");

//dns.setServers(["1.1.1.1", "8.8.8.8"]);

require('dotenv').config()

const express=require('express');
const path = require("path");
const ejs=require('ejs');




const dbcon=require('./src/config/dbcon');


const app = express();

dbcon();




// Configure EJS
app.set('view engine','ejs');
app.set('views','./src/views');

// Read normal form data
app.use(express.json());
app.use(express.urlencoded({extended:true}));
//create statioc folder
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

const productRoutes=require('./src/router/product.router');


// Product routes
app.use(productRoutes);






// Home page redirects to products













const Port=process.env.PORT || 3000;

app.listen(Port,()=>{


                console.log(`server is running on the port ${Port}`);

});

