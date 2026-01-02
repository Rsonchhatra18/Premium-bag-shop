 const express = require('express');
 const router = express.Router();
 
 router.get('/', (req, res) => {
     res.json({ message: 'API is working properly welcome to bag shop' });
 });
 
 module.exports = router;