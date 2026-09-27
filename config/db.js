// const { MongoClient } = require("mongodb");

// const client = new MongoClient(`mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.1gq65mp.mongodb.net/?appName=Cluster0`)

// const connectDB = async () => {
//     try {
//         await client.connect();

//         console.log("Mongodb connected");

//         const db = client.db(process.env.MONGODB_USER);

//         return db;


//     } catch (err) {
//         console.error("Mongodb connection failed:", err.message);
//         process.exit(1);

//     }
// }

// module.exports = connectDB;




const { MongoClient } = require("mongodb");

const client = new MongoClient(
    `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.1gq65mp.mongodb.net/?appName=Cluster0`
);

let cachedDb = null;
let connectingPromise = null;

const connectDB = async () => {
    if (cachedDb) {
        return cachedDb;
    }


    if (!connectingPromise) {
        connectingPromise = client.connect()
            .then(() => {
                console.log("MongoDB connected");
                cachedDb = client.db(process.env.MONGODB_DB_NAME); 
                return cachedDb;
            })
            .catch((err) => {
                connectingPromise = null; 
                console.error("MongoDB connection failed:", err.message);
                throw err;
            });
    }

    return connectingPromise;
};

module.exports = connectDB;