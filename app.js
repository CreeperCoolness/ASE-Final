const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const jwt=require('jsonwebtoken');  // add
const cookieParser = require('cookie-parser'); //add
require('dotenv').config();   //add
const app = express();
const PORT = process.env.PORT || 3001;
app.use(bodyParser.json());  //add
app.use(cookieParser());   //add
app.use(express.json());  //add

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://marlin12801:test1234@final.qaptkrc.mongodb.net/?retryWrites=true&w=majority&appName=final";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

client.connect(err => {
    if (err) {
        console.error('MongoDB connection error:', err);
    } else {
        console.log('Connected to MongoDB');
    }
});

app.use(express.static(__dirname + '/test'));

app.post('/donutshop', (req, res) => {
    const newShop = req.body;
    const db = client.db('shops');
    db.collection('shopinfo').insertOne(newShop, (err, result) => {
        if (err) {
            console.error('Error inserting new shop:', err);
            res.status(500).json({ error: 'Error inserting new shop' });
        } else {
            console.log('New shop inserted:', result.ops[0]);
            res.json(result.ops[0]);
        }
    });
});

app.get('/donutshop/:index', (req, res) => {
    const index = parseInt(req.params.index);
    const db = client.db('shops');
    db.collection('shopinfo').findOne({ index: index }, (err, shop) => {
        if (err) {
            console.error('Error finding donut shop:', err);
            res.status(500).json({ error: 'Error finding donut shop' });
        } else if (!shop) {
            res.status(404).json({ error: 'Donut shop not found' });
        } else {
            res.json(shop);
        }
    });
});

app.put('/donutshop/:index', (req, res) => {
    const index = parseInt(req.params.index);
    const updatedShop = req.body;
    const db = client.db('shops');
    db.collection('shopinfo').updateOne({ index: index }, { $set: updatedShop }, (err, result) => {
        if (err) {
            console.error('Error updating donut shop:', err);
            res.status(500).json({ error: 'Error updating donut shop' });
        } else if (result.matchedCount === 0) {
            res.status(404).json({ error: 'Donut shop not found' });
        } else {
            res.json({ message: 'Donut shop updated successfully' });
        }
    });
});

app.delete('/donutshop/:index', (req, res) => {
    const index = parseInt(req.params.index);
    const db = client.db('shops');
    db.collection('shopinfo').deleteOne({ index: index }, (err, result) => {
        if (err) {
            console.error('Error deleting donut shop:', err);
            res.status(500).json({ error: 'Error deleting donut shop' });
        } else if (result.deletedCount === 0) {
            res.status(404).json({ error: 'Donut shop not found' });
        } else {
            res.json({ message: 'Donut shop deleted successfully' });
        }
    });
});

fs.readFile('shopinfo.json', (err, data) => {
    if (err) {
        console.error('Error reading shops file:', err);
    } else {
        shops = JSON.parse(data);
        console.log('Shops loaded from file');
    }
});
fs.readFile('shopmenu.json', (err, data) => {
    if (err) {
        console.error('Error reading shops file:', err);
    } else {
        shopsinfo = JSON.parse(data);
        console.log('Shops menu loaded from file');
    }
});
app.get('/donutmenu', (req, res) => {
    res.json(shopsinfo);
});



 

app.get('/donutshop', (req, res) => {
    const db = client.db('shops');
    db.collection('shopinfo').find().toArray((err, shops) => {
        if (err) {
            console.error('Error fetching donut shops:', err);
            res.status(500).json({ error: 'Error fetching donut shops' });
        } else {
            res.json(shops);
			console.log(shops);
        }
    });
});

app.post('/Sign_in.html', (req, res) => {
    const { email, password } = req.body;

    const db = client.db('shops');
    db.collection('users').findOne({ "username": email, "password": password }, (err, user) => {
        if (err) {
            console.error('Error finding user:', err);
            res.status(500).send({ error: 'Internal server error' });
        } else if (!user) {
            res.status(401).send({ error: 'Invalid credentials' });
        } else {
            const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.cookie('token', token, { httpOnly: true, secure: true });
            res.json({ status: 1, jwt: token, redirect: '/indexadmin.html' });
        }
    });
});

app.post('/Sign_up.html',(req,res)=>{
	const { firstname, lastname, email, password  } = req.body;
	if((email != "" || password != "" || firstname != "" || lastname !="")){
	//let account = firstname+','+lastname+','+email+','+password;
	//fs.appendFileSync('./usercredentials.csv', account+'\n')
	client.db('shops').collection('users').insertOne({"firstname":firstname, "lastname":lastname, "username":email, "password":password});
	}else{
		res.status(401).send({ status:-1,jwt:'Invalid credentials'});
	}
});


function verifyToken(req, res, next) {
    let bearerHeader = req.headers['authorization'];
    if (!bearerHeader) {
        bearerHeader = req.cookies.token;
    }
    if (typeof bearerHeader !== 'undefined') {
        const bearerToken = bearerHeader.split(' ')[1];
        jwt.verify(bearerToken, process.env.JWT_SECRET, (err, authData) => {
            if (err) {
                res.sendStatus(403);
            } else {
                req.user = authData;
                next();
            }
        });
    } else {
        res.sendStatus(403);
    }
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});