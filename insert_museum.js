const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://distilledchild_db_user:D!st!ll2dch!ld@distilledchildwebpage.0eoyzf5.mongodb.net/webpage?retryWrites=true&w=majority';

async function insertMuseum() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('webpage');
        const collection = db.collection('INTERESTS_ART_MUSEUM');

        const result = await collection.insertOne({
            "__v": 0,
            "artworks": [],
            "city_code": "MEM",
            "museum_code": "MBMA",
            "museum_name": "Memphis Brooks Museum of Art",
            "show": "Y",
            "state": "TN"
        });

        console.log('Document inserted with _id:', result.insertedId);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

insertMuseum();
