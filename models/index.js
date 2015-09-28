mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/game-thing');

// mongoose.on('connection', function(){
// 	console.log('connected to db');
// });

var thingSchema = new mongoose.Schema({
    img: { type: String, required: true},
    x: {type: Number, required: true},
    y: { type: Number, required: true},
    width: {type: Number, required: true},
    height: {type: Number, required: true}
});

var spikeSchema = new mongoose.Schema({
    img: { type: String, required: true},
    x: {type: Number, required: true},
    y: { type: Number, required: true},
    width: {type: Number, required: true},
    height: {type: Number, required: true}
});

var levelSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true},
    things: {type: [thingSchema]},
    spikes: { type: [spikeSchema]},
});

var Level = mongoose.model('Level', levelSchema);

module.exports = Level;