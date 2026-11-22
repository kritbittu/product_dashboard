
const Product=require('../model/product.model');

const cloudinary=require('../utils/cloudinary');

//const uploadToCloudinary=require('../utils/uploadtocloud');

class productcontroller{


 



    async showaddform(req,res){



        


try {
        res.render('addform');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }



    }


    async addproducts(req,res){

           
        let uploadedImageId;

    try {
        const { name, description, price, size, color, brand } = req.body;

        if (!name || !description || price === undefined ||
            price === "" || !brand) {
            return res.status(400).send("Please fill in all required fields");
        }

        if (!Number.isFinite(Number(price)) || Number(price) < 0) {
            return res.status(400).send("Please enter a valid price");
        }

        if (!req.file) {
            return res.status(400).send("Please select a product image");
        }

        const uploadToCloudinary=async(fileBuffer)=>{

                   return new Promise((resolve, reject) => {
                           const stream = cloudinary.uploader.upload_stream(
                               {
                                   folder: "products"
                               },
                               (error, result) => {
                                   if (error) {
                                       return reject(error);
                                   }
                   
                                   resolve(result);
                               }
                           );
                   
                           stream.end(fileBuffer);
                       });

        }

        

        // Upload image to Cloudinary
        const imageResult = await uploadToCloudinary(req.file.buffer);
        uploadedImageId = imageResult.public_id;

        // Save product information in MongoDB
        await Product.create({
            name,
            description,
            price: Number(price),
            size: size || [],
            color: color || [],
            brand,
            image: imageResult.secure_url,
            public_id: imageResult.public_id
        });

        res.redirect("/products");

    } catch (error) {
        // Clean up an uploaded image if saving the product fails
        if (uploadedImageId) {
            try {
                await cloudinary.uploader.destroy(uploadedImageId);
            } catch (cleanupError) {
                console.error("Image cleanup failed:", cleanupError);
            }
        }

        console.error(error);
        res.status(500).send(error.message);
    }
};

async getproducts(req,res){


    try {
        const { search, size, color, brand } = req.query;

        let filter = {
            isDeleted: false
        };

        // Search by product name
        if (search && search.trim()) {
            filter.name = {
                $regex: search.trim(),
                $options: "i"
            };
        }

        // Filter by size
        if (size) {
            filter.size = {
                $in: Array.isArray(size) ? size : [size]
            };
        }






        // Filter by color
        if (color) {
            filter.color = {
                $in: Array.isArray(color) ? color : [color]
            };
        }

        // Filter by brand
        if (brand) {
            filter.brand = {
                $in: Array.isArray(brand) ? brand : [brand]
            };
        }

        const products = await Product.find(filter).sort({
            createdAt: -1
        });

        res.render("products", {
            products,
            search: search || "",
            selectedSizes: size
                ? Array.isArray(size) ? size : [size]
                : [],
            selectedColors: color
                ? Array.isArray(color) ? color : [color]
                : [],
            selectedBrands: brand
                ? Array.isArray(brand) ? brand : [brand]
                : []
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Unable to load products");
    }

}


async showeditform(req,res){

    try {
        const product = await Product.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!product) {
            return res.status(404).send("Product not found");
        }

        res.render("edit", { product });

    } catch (error) {
        console.error(error);
        res.status(500).send("Unable to load edit form");
    }


}


async update(req,res){

let newImageId;

    try {
        const { name, description, price, size, color, brand } = req.body;

        const product = await Product.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!product) {
            return res.status(404).send("Product not found");
        }

        if (!name || !description || price === undefined ||
            price === "" || !brand) {
            return res.status(400).send("Please fill in all required fields");
        }

        if (!Number.isFinite(Number(price)) || Number(price) < 0) {
            return res.status(400).send("Please enter a valid price");
        }

        const oldImageId = product.public_id;

        const uploadToCloudinary=async(fileBuffer)=>{

                   return new Promise((resolve, reject) => {
                           const stream = cloudinary.uploader.upload_stream(
                               {
                                   folder: "products"
                               },
                               (error, result) => {
                                   if (error) {
                                       return reject(error);
                                   }
                   
                                   resolve(result);
                               }
                           );
                   
                           stream.end(fileBuffer);
                       });

        }

        // Replace the image only if a new file was selected
        if (req.file) {
            const imageResult = await uploadToCloudinary(req.file.buffer);

            newImageId = imageResult.public_id;

            product.image = imageResult.secure_url;
            product.public_id = imageResult.public_id;
        }

        product.name = name;
        product.description = description;
        product.price = Number(price);
        product.size = size || [];
        product.color = color || [];
        product.brand = brand;

        // Save the updated product first
        await product.save();

        // Delete the old image only after the database update succeeds
        if (newImageId && oldImageId) {
            try {
                await cloudinary.uploader.destroy(oldImageId);
            } catch (cleanupError) {
                console.error("Old image cleanup failed:", cleanupError);
            }
        }

        res.redirect("/products");

    } catch (error) {
        // Clean up a newly uploaded image if the update fails
        if (newImageId) {
            try {
                await cloudinary.uploader.destroy(newImageId);
            } catch (cleanupError) {
                console.error("New image cleanup failed:", cleanupError);
            }
        }

        console.error(error);
        res.status(500).send(error.message);
    }


}

async recyclebin(req,res){

    try {


        const products=await Product.find({isDeleted : true

        });

        res.render("recyclebin",{products});
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }


}



async delete(req,res){

try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).send("Product not found");
        }

        // Delete the database record
        await Product.deleteOne({
            _id: product._id
        });

        // Delete its Cloudinary image
        if (product.public_id) {
            try {
                await cloudinary.uploader.destroy(product.public_id);
            } catch (imageError) {
                console.error("Cloudinary image deletion failed:", imageError);

                return res.status(500).send(
                    "Product deleted, but image cleanup failed"
                );
            }
        }

        res.redirect("/products");

    } catch (error) {
        console.error(error);
        res.status(500).send("Unable to delete product");
    }

}

async softdelete(req,res){

try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { isDeleted: true },
            { new: true }
        );

        if (!product) {
            return res.status(404).send("Product not found");
        }

        // Keep the database record and image
        res.redirect("/products");

    } catch (error) {
        console.error(error);
        res.status(500).send("Unable to soft-delete product");
    }


}

async restore (req,res){

    try {

        const id=req.params.id;

        const products=await Product.findByIdAndUpdate(id,{isDeleted:false},{new:true}

        );

        res.redirect("/products");
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }

}

    }




module.exports=new productcontroller();