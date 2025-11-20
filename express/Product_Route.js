
require('dotenv').config();  // ✅ Load environment variables from .env file

const express = require('express');
const app = express.Router();

const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const empModel = require('./models/emp_model');
const fileModel = require('./models/file_model');
const productModel = require('./models/product_model');

// ✅ Import Middleware from `protect.js`
const { extractToken, protect } = require("./Middleware/project");
const { default: mongoose } = require('mongoose');
const { exists } = require('./models/user_model');


// cors

app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}))


const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: (req, file, callback) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);
        if(extName && mimeType){
            return callback(null, true);
        }else{
            callback('Error: Images Only! (JPEG, JPG, PNG, GIF)');
        }
    }
})


if(!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

app.post('/addProduct', upload.single('image'), async (req, res) => {
    try{
        const {
            name, description, price, discountPrice,
             category, stock, isFeatured, ratings} = req.body;

        // prepare image data

        let image = null;
        if (req.file) {
            image = {
                data: req.file.buffer,
                contentType: req.file.mimetype   // e.g:  image/jpeg
            };
        }

        const newProduct = new productModel({
            name,
            description,
            price,
            discountPrice,
            category,
            stock,
            isFeatured,
            ratings,
            image
        });

        const addedProduct =  await newProduct.save();
        console.log('Product added:', addedProduct);

        // Optional: Remove image binary data from response to save bandwidth
        const responseProduct = addedProduct.toObject();
        if (responseProduct.image && responseProduct.image.data) {
            delete responseProduct.image.data; // delete binary data from response 
        }
        res.status(201).json(responseProduct);


    }catch(error){
        console.error('Error adding product:', error);
        res.status(500).send('Server error');
    }
})


// helper function for image conversion binarty to string using base64 Algorithim

const formatProductImage = (product) => {
    const pro = product.toObject ? product.toObject() : {...product};

    if(pro.image && pro.image.data){
        if(pro.image.data.buffer){
            // Compass Binary Object
             pro.image.data = pro.image.data.buffer.toString("base64");
        }else if(Buffer.isBuffer(pro.image.data)){
        pro.image.data = pro.image.data.toString("base64");
         }
         else if (pro.image.data.data){
        pro.image.data = Buffer.from(pro.image.data).toString("base64");
    }
}
return pro;
}

// Get Api all Data

app.get("/productlist", async (req, res) => {
    try{
        const products = await productModel.find();
        const formattedImage = products.map(formatProductImage);
        res.status(200).json(formattedImage); 
    }catch(error){
        res.status(500).json({message: "Server Error"});
    }
})


// Get Product by ID (used as a searching api )

app.get("/productlist/:id", async (req, res) => {
    try{
        const {id} = req.params;
        if(!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({message: "Product Id Invalid"});
        }
        const product = await productModel.findById(id);
        if(!product) return res.status(401).json({message: "Product Not Found!..."});
        res.json(formatProductImage(product));

    }catch(error){
        res.status(500).json({message: "Server Error"});
    }
})



// Update Product Data 

app.put("/productListUpdate/:id", upload.single("image"), async(req, res) =>{
    try{
        const {id} =  req.params;
        if(!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({message: "Invalid Product Id"});
        }

        const UpdatePersonData = {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            discountPrice: req.body.discountPrice,
            category: req.body.category,
            stock: req.body.stock,
            isFeatured: req.body.isFeatured === "true" || req.body.isFeatured === "true",
            ratings: req.body.ratings,
        }

        // Handle Image Update

        if(req.file){
            UpdatePersonData.image = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
            }
        }

        const updateResult =  await UpdatePersonData.findByIdAndUpdate(id, UpdatePersonData, {
            new: true,
            runValidators: true
        })

        if(!updateResult) return res.status(404).json({message: "Preoduct Not Found"})
        res.json(formatProductImage(updateResult));

    }catch(error){
        console.error('UpdateData: ', error);
        res.status(500).json({message: "Server Error"});
    }
})


app.get('/checkSKU/:sku', async (req, res) => {
    try{
        const {sku} = req.params;
        const existing = await productModel.findOne({sku});
        res.json({
            exists: !!existing,
            productID: existing?existing._id?.toString() : null,
        })
    }catch(error){
        res.status(500).json({message: "Server Error"});
    }
})



// Delete Product Data

app.delete('productDelete/:id', async(req, res) => {
    try{
         const {id} =  req.params;
           if(!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({message: "Invalid Product Id"});

            const deleteProduct = await productModel.findByIdAndDelete(id);

            if(!deleteProduct) {
                res.status(404).json({message: "Product Not Found"});
            } else {
                res.status(200).json({message: "Product Deleted Successfully"});
                formatProductImage(deleteProduct);
            }
        }

    }catch(error){
        console.error("Delete Data: ", error)
        res.status(500).json({message: "Server Error"});
    }

})






app.post('/addEmployee',async (req, res) => {
    try{
        const {name, email, position, department} = req.body;  // Destructure the data from request body
        const newUser = new empModel({
            name,
            email,
            position,
            department
        });

        const addedUser = await newUser.save();
        res.status(201).json(addedUser);
        console.log('Employee added:', addedUser);


    }catch(error){
        console.error('Error adding employee:', error);
        res.status(500).send('Server error');
    }
});


app.get('/employee', async (req, res) => {   // get api to fetch all employees
    try{
        const users = await empModel.find();
        if(!users){
            res.status(404).send('No employee data found');
        }else{
            res.status(200).json(users);
        }
    }
    catch(error){
        console.error('Error fetching employees:', );error
        res.status(500).send('Server error');
    }
});





// New Work 8/11/2025   Product Model Work With Image as Binary Data
















app.get('/employee/:id', async (req, res) => {   // get api to fetch employee by id
    try{
        const userId = req.params.id;
        const user = await empModel.findById(userId);
        if(!user){
            res.status(404).send('Employee not found');
        } else{
             res.status(200).json(user);
            }
        }catch(error){
            console.error('Error fetching employee:', error);
            res.status(500).send('Server error');
        }
})


app.patch('/updateEmployeeData/:id', async (req, res) => {
    try{
        const userId = req.params.id;
        const updateData = req.body;  // Get the fields to be updated from request body

        const updatedUser = await empModel.findByIdAndUpdate(
            userId,
            {$set: updateData},   // Use $set to update only the provided fields
            {new: true}          // Return the updated document
        );

        if(!updatedUser){
            res.status(404).send('Employee not found');
        }else{
            res.status(200).json(updatedUser);
            console.log('Employee Data updated successfully:', updatedUser);
        }

    }catch(error){
        console.error('Error updating employee:', error);
        res.status(500).send('Server error');
    }
});


app.put('/updateEmployee/:id', async (req, res) => {  
    try{
        
        const userId = req.params.id;
        const {name, email, position, department} = req.body;  // Destructure the data from request body

        const UpdateUserData = await empModel.findByIdAndUpdate(
            userId,
            {name, email, position, department},
            {new: true}   // return the updated data 
            );

            if(!UpdateUserData){
                res.status(404).send('Employee not found');
            }else{
                res.status(201).json(UpdateUserData);
                console.log('Employee updated Successfully:', UpdateUserData);
            }
        }
        catch(error){
        console.error('Error updating employee:', error);
        res.status(500).send('Server error');
    }
});


app.delete('/deleteEmployee/:id', async (req, res) => {
    try{
        const userId = req.params.id;
        const deletedUser = await empModel.findByIdAndDelete(userId);

        if(!deletedUser){
            res.status(404).send('Employee not found');
        }else{
            res.status(201).json({message: 'Employee deleted successfully', deletedUser});
            console.log('Employee deleted successfully:', deletedUser);
        }
    } catch(error){
        console.error('Error deleting employee:', error);
        res.status(500).send('Server error');
    }
});

// Set up multer for file storage

const fileUpload = multer({
    storage: multer.diskStorage({
        destination: function(req, file, callback){
            callback(null, '../upload/');
        },

        filename: function(req, file, callback){
           const uniqueName = file.fieldname + '-' + Date.now() + '-' + ".jpg";
           callback(null, uniqueName);
        }
    })
}).single('my_file');


app.post('/uploadFile', fileUpload, async (req, res) => {
    try{
        if(!req.file) {
            return res.status(400).send('No file uploaded');
        }
        else{
            const newFile = new fileModel({
                filePath: req.file.path
            });

            await newFile.save()
            .then(() => res.status(200).send('File uploaded and saved to database successfully'))
            .catch((error) => res.send('Error saving file to database: ' + error));
        }
    }
    catch(error){
        console.error('Error uploading file:', error);  
        res.status(500).send('Server error');}
});


app.post('/login', extractToken,protect,(req, res) => {
    const user = {  // payload
        name: 'kashif',
        email: 'kashif12@gmail.com'
    }
    // Generate Token
    const token = jwt.sign({user}, process.env.JWT_SECRET, {expiresIn: '300s'});  // token siging
    res.status(200).json({token});
});

app.get('/searchUser/:value', async (req, res) => {
    try{

        let searchValue = req.params.value;

        let result = await empModel.find({
            "$or" : [
                {'name': {$regex: searchValue, $options: 'i'}},
                {'email': {$regex: searchValue, $options: 'i'}},
                {'position': {$regex: searchValue, $options: 'i'}},
                {'department': {$regex: searchValue, $options: 'i'}}
            ]
        });

        res.status(200).json(result);
        console.log('Search result:', result);

    }catch(error){
        console.error('Error searching User:', error);
        res.status(500).send('Server error');
    }
});

module.exports = app;









