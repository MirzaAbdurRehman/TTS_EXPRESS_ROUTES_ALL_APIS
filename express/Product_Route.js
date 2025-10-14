
const express = require('express');
const app = express.Router();

const connectDB = require('./db/connect_db');
connectDB();

const multer = require('multer');

const empModel = require('./models/emp_model');
const fileModel = require('./models/file_model');

// ✅ Import Middleware from `protect.js`
const { extractToken, protect } = require("./Middleware/project");



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
    const token = jwt.sign({user}, secretKey, {expiresIn: '300s'});  // token siging
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









