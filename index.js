var jwt = require('jsonwebtoken');
const express = require("express");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const ObjectID = require('mongodb').ObjectId;
const stripe = require("stripe")(process.env.SCREAT_key);

// console.log(process.env.SCREAT_key)


const app = express();
const port = process.env.PORT || 5000;

//Middleware


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r5j5a.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Wellcome to doctor's portal server");
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
// console.log(uri);


function verifyToken(req,res,next){
    console.log('ABC');
    const authorization = req.headers.authorization;
    // console.log(authorization)
    if(!authorization){
        return res.status(401).send({message: 'UnAuthorize Access'})
    }
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.SCREAT_TOKEN,function(err, decoded){
        if(err){
            return res.status(403).send({message: "Forbidden access"})
        }
        console.log(decoded);
        next();
    })
}

const run = async() =>{
    try{
        await client.connect();
        const appointmentsCollection = client.db("doctorsportal2").collection("appointments2");
        const paymentsCollection = client.db("doctorsportal2").collection("payments");
        const usersCollection = client.db("doctorsportal2").collection("users");
        const doctorsCollection = client.db("doctorsportal2").collection("doctors");
        // console.log('DB connected successfully.')

        app.get("/appointment",async(req,res)=>{
            const email = req.query.email;
            
            const authorization = req.headers.authorization;
            // console.log("from appointment", authorization)
            // const date = new Date(req.query.date).toLocaleDateString();
            // console.log(date)
            const query = { email: email};
            // console.log(query);
            const cursor = appointmentsCollection.find(query);
            const appointments = await cursor.toArray();
            res.json(appointments);
        })
        app.get('/booking/:id', async(req,res)=>{
            const id = req.params;
            const query = {_id: ObjectId(id)};
            // console.log("Query----------",query)
            const booking = await appointmentsCollection.findOne(query);
            res.send(booking);

        })
        app.get('/users',async(req,res)=>{
            const users = await usersCollection.find().toArray();
            res.send(users)
        })

        app.get('/users/:email', async(req, res)=>{
            const email = req.params.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);
            // console.log(user)
            let isAdmin = false;
            if(user?.role === 'admin'){
                isAdmin = true
            }
            res.send({admin: isAdmin})
        } )

        app.post('/create-payment-intent', async(req,res)=>{
            const service = req.body;
            const price  = Number(service.price.split("$")[1]);
            if(typeof(price) === "number"){
                const amount = Number(price * 100);
                const paymentIntent = await stripe.paymentIntents.create({
                    amount : amount,
                    currency: 'usd',
                    automatic_payment_methods: {
                        enabled: true,
                      },
                })
                res.send({clientSecret : paymentIntent.client_secret})
            }else{
                console.log('Price is not a number')
            }
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
            //console.log(options)
            const updateDoc = {$set: user};
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })

        app.put('/users/admin',async(req,res)=>{
            const user =  req.body;
            // console.log("put-------", req.headers)
            const filter = {email: user.email};
            
            const updateDoc = {$set:{role: 'admin'}};
            const result = await usersCollection.updateOne(filter,updateDoc);
            res.json(result);

        })
       
        app.patch('/booking/:id', async(req,res)=>{
            const id = req.params.id;
            const payment = req.body;
            // console.log("Payment----------", payment, id)
            const  filter  = {_id : ObjectID(id)}
                            
            const updateDoc = {
                $set:{
                    paid : true,
                    transactionId: payment.transitionId,
                }
            }
            const result = await paymentsCollection.insertOne(payment);
            const updatedBooking = await appointmentsCollection.updateOne(filter, updateDoc);
            res.send(updatedBooking)

        })

        app.get('/doctor',async(req,res)=>{
            const doctors = await doctorsCollection.find().toArray();
            res.send(doctors);
        })
        app.post('/doctor',async(req,res)=>{
            const doctor = req.body;
            // console.log(doctor)
            const result = await doctorsCollection.insertOne(doctor);
            res.send(result);
        })
        app.delete('/doctor/:id',async(req,res)=>{
            const id = req.params.id;
            // console.log(id)
            const filter = {_id: ObjectID(id)}
            const result = await doctorsCollection.deleteOne(filter);
            // console.log(result)
            res.send(result);
        })



    }catch(err){
        console.log("error 1------", err.message);
    }
}
run().catch(console.dir);

app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
});
