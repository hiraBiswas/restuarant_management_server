const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5200;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(express.json());
app.use(cors({
  origin: [
      'http://localhost:5173',
      
  ],
  credentials: true
}));

console.log(process.env.DB_USER)

const uri = `mongodb+srv://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASS)}@cluster0.eogwfq1.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
  
    await client.connect();
    
    const foodCollection = client.db('foodDB').collection('food');
    const orderCollection = client.db('foodDB').collection('order');

    //add food
    app.post('/food', async (req, res) => {
        const newFood = req.body;
        console.log(newFood);
        const result = await foodCollection.insertOne(newFood)
        res.send(newFood)
      })
    
      //for reading from db 
      app.get('/food', async (req, res) => {
        const cursor = foodCollection.find()
        const result = await cursor.toArray()
        res.send(result)
      })

      //finding single data
      app.get('/food/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await foodCollection.findOne(query);
        res.send(result);
      })

      //posting data to order collection
      app.post('/order', async (req, res) => {
        const orderItem = req.body;
        console.log(orderItem)
        const result = await orderCollection.insertOne(orderItem);
        res.send(result);
      });

      app.get('/top-selling-food', async (req, res) => {
        const topSellingFood = await foodCollection
          .find()
          .sort({ orderCount: -1 }) // Sort in descending order based on orderCount
          .limit(6)
          .toArray();
      
        res.send(topSellingFood);
      });
      
    

      
      //getting data from order
      app.get('/order', async (req, res) => {
        const cursor = orderCollection.find()
        const result = await cursor.toArray()
        res.send(result)
      })

      //for deleting from order
      app.delete('/order/:itemId', async (req, res) => {
        try {
          const itemId = req.params.itemId;
          const result = await orderCollection.deleteOne({ _id: new ObjectId(itemId) });
      
          if (result.deletedCount === 1) {
           console.log('deletion successful')
            res.status(204).send(); 
          } else {
            res.status(404).json({ error: 'Item not found' });
          }
        } catch (error) {
          console.error('Error deleting item:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
      });


      //updating a item
      app.put('/food/:id', async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) }
        const options = { upsert: true };
        const updateFood = req.body;
  
        const food = {
          $set: {
            image: updateFood.image,
            name: updateFood.name,
            brandName: updateFood.brandName,
            price: updateFood.price,
            type: updateFood.type,
            rating: updateFood.rating,
            description: updateFood.description
          }
        }
  
        const result = await foodCollection.updateOne(filter, food, options);
        res.send(result);
      })
  

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server is running')
})

app.listen(port, () => {
    console.log(` Server is running on port: ${port}`)
})