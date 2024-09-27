const mongoose = require('mongoose');
const HistoricalTag = require('./historicalTags');
const Schema = mongoose.Schema;

const historicalPlacesSchema = new Schema({
    title: { type: String, required: [true,'Please enter a name'] },
    description: { 
        type: String, required: [true,'Please enter a description'] },

    location: {
        address:{type: String, required: [true,'Please enter an address']} ,
        city: {type: String, required: [true,'Please enter a city']},
        country: {type: String, required: [true,'Please enter a country']},
        
    },
    historicalTag: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HistoricalTag',
            required: [true,'Please enter a tag']
        },
    ],
    openingHours: {
        weekdays: String,
        weekends: String,
    },
    ticketPrices: {
        adult: Number,
        child: Number,
        
    },
    pictures: [String], // Array of GridFS filenames

    governor: {  // New field for the maker's ID
        type: mongoose.Schema.Types.ObjectId,
        ref: 'governor', // Replace 'User' with the appropriate model name for makers
        required: true, // Assuming it's required, you can set this to false if it's optional
    },
});


historicalPlacesSchema.statics.findByGovernor = function(governorId) {
    return this.find({ governor: governorId }).populate('governor').exec();
};

historicalPlacesSchema.statics.findByFields = async function(searchCriteria) {
    if(searchCriteria === undefined || searchCriteria === null || searchCriteria === "") {
        return this.find().populate('governor').populate('historicalTag').exec();
    }
    const query = [];
    
    const historicalTags = await HistoricalTag.searchByFields(searchCriteria);
    const tagIds = historicalTags.map(tag => tag._id);

    searchFields = ["title", "description", "location.address","location.city","location.country"];
    searchFields.forEach(field => {
        query.push({[field] : { $regex: new RegExp(searchCriteria, 'i') }});  // Case-insensitive
    });
    
    const cursor = this.find().cursor();

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        for(const tagId of tagIds){
            if(doc.historicalTag.includes(tagId)){
                query.push({ _id: doc._id });
                break;
            }
        }
    }

    return this.find({ $or: query }).populate('governor').populate('historicalTag').exec();  // Perform a search with the regex query
};

historicalPlacesSchema.statics.filterByTag = async function(types,periods) {
    const query = [];
    let historicalTags = null;
    if((types === undefined || types === null || types.length===0) && (periods === undefined || periods === null || periods.length===0))
        return this.find().populate('governor').populate('historicalTag').exec();
    else if(types === undefined || types === null || types.length===0)
        historicalTags = await HistoricalTag.find({ period: { $in: periods } });
    else if(periods === undefined || periods === null || periods.length===0)
        historicalTags = await HistoricalTag.find({ type: { $in: types } });
    else
        historicalTags = await HistoricalTag.find({ type: { $in: types }, period: { $in: periods } });

    if(historicalTags.length === 0)
        return [];

    const tagIds = historicalTags.map(tag => tag._id);
    const cursor = this.find().cursor();

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        for(const tagId of tagIds){
            if(doc.historicalTag.includes(tagId)){
                query.push({ _id: doc._id });
                break;
            }
        }
    }
    return this.find({ $or: query }).populate('governor').populate('historicalTag').exec();
};

const historicalPlaces = mongoose.model('HistoricalPlace', historicalPlacesSchema);
module.exports = historicalPlaces;