const express = require("express");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

//Middleware


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r5j5a.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Wellcome to doctor's portal server");
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
// console.log(uri);

const run = async() =>{
    try{
        await client.connect();
        const appointmentsCollection = client.db("doctorsportal2").collection("appointments2");
        const usersCollection = client.db("doctorsportal2").collection("users");
        // console.log('DB connected successfully.')

        app.get("/appointment", async(req,res)=>{
            const email = req.query.email;
            const date = new Date(req.query.date).toLocaleDateString();
            const query = { email: email, date:date};
            // console.log(query);
            const cursor = appointmentsCollection.find(query);
            const appointments = await cursor.toArray();
            res.json(appointments);
        })
        app.post("/appointment", async(req,res)=>{
            // console.log('enter here');
            // console.log(req.body);
            const appointmentInformation = req.body;
            const result = await appointmentsCollection.insertOne(appointmentInformation)
            .then(result=>{
                // console.log(`A document was inserted with the _id: ${result.insertedId}`);
                res.json(result);
            })
        })


        app.post('/users',async(req,res)=>{
            const users = req.body;
            const result = await usersCollection.insertOne(users)
            .then(result=>{
                // console.log(users)
                res.json(result);
            })
        })


        app.put('/users',async(req,res)=>{
            const user = req.body;
            
            const filter = {email: user.email};
            const options = {upsert: true};
            console.log(options)
            const updateDoc = {$set: user};
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })

        app.put('users/admin',async(req,res)=>{
            const user =  req.body;
            console.log("put-------", user)
            const filter = {email: user.email};
            const updateDoc = {$set:{role: 'admin'}};
            const result = await usersCollection.updateOne(filter,updateDoc);
            res.json(result);

        })



    }catch(err){
        console.log("error 1------", err.message);
    }
}
run().catch(console.dir);

app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
});
