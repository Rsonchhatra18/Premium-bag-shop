const express = require('express');
const router = express.Router();
const ownerModel = require('../models/owner-model');
const debug = require('debug')('development:ownersRouter');

// Define your routes here
debug('NODE_ENV:', process.env.NODE_ENV);
if(process.env.NODE_ENV === 'development'){
    debug('Registering POST /create route');
    router.post('/create', async (req, res) => {  
        try {
            let owners=await ownerModel.find();
            if(owners.length>0){
                return res
                .status(500)
                .json({ error: "Owner already exists" });
            }
            let {fullname, email, password}=req.body;
            let createdOwner = await ownerModel.create({
                fullname,
                email,
                password
            });
            res.status(201).json(createdOwner);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
}

router.get('/', (req, res) => {
    res.send('Owners Router');
});

module.exports = router; 