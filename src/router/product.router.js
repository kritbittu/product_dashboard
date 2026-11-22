
const express=require('express');

const Router=express.Router();

const productcontroller=require('../controller/product.controller');

const upload=require('../utils/multer');

Router.get('/products',productcontroller.getproducts);


Router.get('/products/showaddform',productcontroller.showaddform);

Router.post('/products/add',upload.single("image"),productcontroller.addproducts);

Router.get('/products/recyclebin', productcontroller.recyclebin);
Router.post('/products/restore/:id',productcontroller.restore);

Router.get('/products/edit/:id',productcontroller.showeditform);

Router.post('/products/update/:id',upload.single("image"),productcontroller.update);

Router.post('/products/delete/:id',productcontroller.delete);

Router.post('/products/soft-delete/:id',productcontroller.softdelete);

module.exports=Router;