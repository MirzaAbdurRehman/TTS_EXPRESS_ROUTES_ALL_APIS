

const mongoose =  require('mongoose');

const productModel = new mongoose.Schema({
    name: {type: String, required: true, trim: true},
    description: {type: String, trim: true},
    price: {type: Number, required: true},
    discountPrice: {type: Number},
    category: {type: String, required: true},
    stock: {type: Number, required: true, min: 0},
    sku: {type: String, unique: true},
    isFeatured: {type: Boolean, default: false},
    ratings: {type: Number, default: 0, min: 0, max: 5},


    // Image as Binary Data
    image: {
        data: Buffer,  // Image as Binary Data
        contentType: String
    },


    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now}
})

productModel.pre('save',  function(next){
    this.updatedAt = Date.now();
    next();
})

module.exports = mongoose.model('Product', productModel);